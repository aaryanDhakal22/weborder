// The order outbox (DURABILITY-PLAN.md): an order the customer submitted is written here, on the
// storefront's disk, BEFORE main is asked to place it, and stays until main gives a final answer.
// A timeout, a dropped connection, main restarting or answering "still working" (202) leave the row
// pending; a background worker asks main's GET /channel/v1/orders/by-key/{key} and sends the same
// body again (the key makes that safe: main never places an order twice) until main says placed /
// refused / expired / voided, or the deadline passes with main never having seen it.
//
// Plain logic over node:sqlite with main's calls injected (unit-tested with a fake main); the
// running instance is outbox-run.ts. Keep this file free of $lib / $env imports (Node runs the tests).
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

/** main's answer as the storefront relays it: an HTTP status and its JSON body. */
export interface Answer {
	status: number;
	body: any;
}

/** What the page sees when it asks about a key (GET /api/orders/by-key/{key}). */
export interface KeyState {
	state: 'pending' | 'placed' | 'refused' | 'expired' | 'voided' | 'verify';
	order?: any;
	error?: { code: string; message: string };
}

export interface Deps {
	/** POST /channel/v1/orders: main's answer, or throws when main didn't answer (network, timeout). */
	place(host: string, body: unknown, session: string | null, ip: string): Promise<Answer>;
	/** GET /channel/v1/orders/by-key/{key}: main's answer, or throws when main didn't answer. */
	byKey(host: string, key: string): Promise<Answer>;
	now?: () => number;
	/** How long a send waits for main (the worker doesn't touch a row for that long + 5 s). */
	waitMs?: number;
	/** Called when a row reaches a final state (metrics / logs). */
	onFinal?: (host: string, key: string, s: KeyState) => void;
}

interface Row {
	host: string;
	key: string;
	body: string | null;
	session: string | null;
	ip: string;
	expires_at: number;
	state: 'pending' | 'parked' | 'done';
	status: number | null;
	result: string | null;
	attempts: number;
	next_at: number;
	created_at: number;
	resolved_at: number | null;
}

/** How long a page's POST waits for main before the order is left to the worker. */
export const PLACE_WAIT_MS = 22_000;
/** main never saw an order this long past its deadline: it was never placed (nothing charged). */
export const EXPIRED_GRACE_MS = 30_000;
/** Final rows are kept this long (the page can still read the answer), then pruned. */
export const KEEP_DONE_MS = 7 * 24 * 3600_000;
/** A row main still calls pending this long after its deadline is given up on (main's sweeper ends it). */
export const GIVE_UP_MS = 24 * 3600_000;

const backoff = (attempts: number) => Math.min(30_000, 2_000 * 2 ** Math.min(attempts, 4));

/** A placement answer → the page's view of it. */
export function stateOf(a: Answer): KeyState {
	if (a.status === 200 || a.status === 201) return { state: 'placed', order: a.body };
	if (a.status === 202) return { state: 'pending' };
	const code = String(a.body?.code ?? 'error');
	const error = { code, message: String(a.body?.error ?? a.body?.message ?? '') };
	if (a.status === 402 && code === 'verification_required') return { state: 'verify', error };
	if (code === 'expired') return { state: 'expired', error };
	if (code === 'voided') return { state: 'voided', error };
	return { state: 'refused', error };
}

/** main's by-key body → the page's view (null when main is still at work on it). */
function stateOfByKey(b: any): KeyState | null {
	const error = b?.error ? { code: String(b.error.code ?? 'error'), message: String(b.error.message ?? '') } : undefined;
	switch (b?.state) {
		case 'placed':
			return { state: 'placed', order: b.order };
		case 'refused':
		case 'expired':
		case 'voided':
			return { state: b.state, error };
		case 'pending':
			if (error?.code === 'verification_required') return { state: 'verify', error };
			return null;
	}
	return null;
}

/** Is main's answer final for this key (as opposed to "didn't answer" / "still working" / "try again")? */
const finalAnswer = (a: Answer) => a.status < 500 && a.status !== 202;

export class Outbox {
	db: DatabaseSync;
	deps: Deps;
	now: () => number;
	waitMs: number;
	/** Keys some request or the worker is sending right now (never two sends of one key at once). */
	busy = new Set<string>();
	timer: ReturnType<typeof setInterval> | null = null;

	constructor(path: string, deps: Deps) {
		if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
		this.db = new DatabaseSync(path);
		this.deps = deps;
		this.now = deps.now ?? Date.now;
		this.waitMs = deps.waitMs ?? PLACE_WAIT_MS;
		this.db.exec(`PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL; PRAGMA busy_timeout = 5000;
			CREATE TABLE IF NOT EXISTS outbox (
				host TEXT NOT NULL, key TEXT NOT NULL,
				body TEXT, session TEXT, ip TEXT NOT NULL DEFAULT '',
				expires_at INTEGER NOT NULL,
				state TEXT NOT NULL CHECK (state IN ('pending', 'parked', 'done')),
				status INTEGER, result TEXT,
				attempts INTEGER NOT NULL DEFAULT 0, next_at INTEGER NOT NULL,
				created_at INTEGER NOT NULL, resolved_at INTEGER,
				PRIMARY KEY (host, key));
			CREATE INDEX IF NOT EXISTS outbox_due ON outbox (state, next_at);`);
	}

	private id(host: string, key: string) {
		return `${host}\u0000${key}`;
	}

	get(host: string, key: string): Row | undefined {
		return this.db.prepare('SELECT * FROM outbox WHERE host = ? AND key = ?').get(host, key) as Row | undefined;
	}

	/** Writes (or rewrites, for a retry of the same key) the order before main is asked. */
	private put(host: string, key: string, body: unknown, session: string | null, ip: string, expiresAt: number) {
		const now = this.now();
		this.db
			.prepare(
				`INSERT INTO outbox (host, key, body, session, ip, expires_at, state, attempts, next_at, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?)
				 ON CONFLICT (host, key) DO UPDATE SET body = excluded.body, session = excluded.session, ip = excluded.ip,
				   expires_at = excluded.expires_at, state = 'pending', status = NULL, result = NULL, next_at = excluded.next_at, resolved_at = NULL`
			)
			.run(host, key, JSON.stringify(body), session, ip, expiresAt, now + this.waitMs + 5_000, now);
	}

	/** A final answer: kept for the page, the order body and the session dropped. */
	private resolve(host: string, key: string, a: Answer) {
		this.db
			.prepare(`UPDATE outbox SET state = 'done', status = ?, result = ?, body = NULL, session = NULL, resolved_at = ? WHERE host = ? AND key = ?`)
			.run(a.status, JSON.stringify(a.body ?? null), this.now(), host, key);
		this.deps.onFinal?.(host, key, stateOf(a));
	}

	/** 3-D Secure: only the customer can go on (the page sends the same key with a verification token). */
	private park(host: string, key: string, a: Answer) {
		this.db.prepare(`UPDATE outbox SET state = 'parked', status = ?, result = ? WHERE host = ? AND key = ?`).run(a.status, JSON.stringify(a.body ?? null), host, key);
	}

	private later(host: string, key: string, attempts: number) {
		this.db.prepare(`UPDATE outbox SET attempts = ?, next_at = ? WHERE host = ? AND key = ?`).run(attempts, this.now() + backoff(attempts), host, key);
	}

	/** Records main's answer to a send of this key; returns what the page gets. */
	private async settle(row: Pick<Row, 'host' | 'key' | 'attempts'>, a: Answer): Promise<Answer> {
		if (a.status === 409 && a.body?.code === 'key_reused') {
			// main already has an order under this key with a different body (the page changed the
			// order after an attempt it never heard back from): main's state for the key is the truth,
			// and it may well be placed: never let the customer order it twice.
			try {
				const k = await this.deps.byKey(row.host, row.key);
				const s = k.status === 200 ? stateOfByKey(k.body) : null;
				if (s && s.state !== 'verify') {
					this.resolve(row.host, row.key, answerOf(s));
					return answerOf(s);
				}
			} catch {
				/* main didn't answer: the refusal stands, the worker isn't involved */
			}
		}
		const s = stateOf(a);
		if (s.state === 'verify') {
			this.park(row.host, row.key, a);
			return a;
		}
		if (finalAnswer(a)) {
			this.resolve(row.host, row.key, a);
			return a;
		}
		this.later(row.host, row.key, row.attempts + 1);
		return { status: 202, body: { state: 'pending', client_order_id: row.key } };
	}

	/**
	 * The page's Place order: written first, then sent to main. main's final answer comes back as is;
	 * anything else (no answer in time, main down, 5xx, 202) is 202 {state: pending} and the worker
	 * carries on.
	 */
	async place(host: string, body: { client_order_id: string } & Record<string, unknown>, session: string | null, ip: string, expiresAt: number): Promise<Answer> {
		const key = body.client_order_id;
		const id = this.id(host, key);
		this.put(host, key, body, session, ip, expiresAt);
		this.busy.add(id);
		try {
			let a: Answer;
			try {
				a = await this.deps.place(host, body, session, ip);
			} catch {
				a = { status: 503, body: { code: 'main_unreachable' } };
			}
			return await this.settle({ host, key, attempts: 0 }, a);
		} finally {
			this.busy.delete(id);
		}
	}

	/** The page asking about a key: the row's answer, else main's (and the row follows it). */
	async lookup(host: string, key: string): Promise<KeyState | null> {
		const row = this.get(host, key);
		if (row?.state === 'done') return stateOf({ status: row.status!, body: JSON.parse(row.result ?? 'null') });
		let a: Answer;
		try {
			a = await this.deps.byKey(host, key);
		} catch {
			return row ? (row.state === 'parked' ? stateOf({ status: row.status!, body: JSON.parse(row.result ?? 'null') }) : { state: 'pending' }) : null;
		}
		if (a.status === 404) {
			if (!row) return null;
			if (row.state === 'pending' && this.now() > row.expires_at + EXPIRED_GRACE_MS && !this.busy.has(this.id(host, key))) {
				const ans = notPlaced(key);
				this.resolve(host, key, ans);
				return stateOf(ans);
			}
			return row.state === 'parked' ? stateOf({ status: row.status!, body: JSON.parse(row.result ?? 'null') }) : { state: 'pending' };
		}
		if (a.status !== 200) return row ? { state: 'pending' } : null;
		const s = stateOfByKey(a.body);
		if (s && s.state !== 'verify' && row) this.resolve(host, key, answerOf(s));
		return s ?? { state: 'pending' };
	}

	/** One pass of the worker over the rows that are due. */
	async tick() {
		const now = this.now();
		const due = this.db.prepare(`SELECT * FROM outbox WHERE state = 'pending' AND next_at <= ? ORDER BY next_at LIMIT 50`).all(now) as unknown as Row[];
		for (const row of due) {
			const id = this.id(row.host, row.key);
			if (this.busy.has(id)) continue;
			this.busy.add(id);
			try {
				await this.step(row);
			} catch {
				this.later(row.host, row.key, row.attempts + 1);
			} finally {
				this.busy.delete(id);
			}
		}
		this.prune();
	}

	private async step(row: Row) {
		const now = this.now();
		let a: Answer;
		try {
			a = await this.deps.byKey(row.host, row.key);
		} catch {
			this.later(row.host, row.key, row.attempts + 1);
			return;
		}
		if (a.status === 404) {
			// main never saw it (or lost it before writing the key): send it again, unless too late.
			if (now > row.expires_at + EXPIRED_GRACE_MS || !row.body) {
				this.resolve(row.host, row.key, notPlaced(row.key));
				return;
			}
			await this.resend(row);
			return;
		}
		if (a.status !== 200) {
			this.later(row.host, row.key, row.attempts + 1);
			return;
		}
		const s = stateOfByKey(a.body);
		if (s?.state === 'verify') {
			this.park(row.host, row.key, answerOf(s));
			return;
		}
		if (s) {
			this.resolve(row.host, row.key, answerOf(s));
			return;
		}
		// pending at main: a parked temporary failure waits for the caller to send it again;
		// otherwise main is at work. Either way main ends it (its sweeper) if we can't.
		if (a.body?.error && row.body && now <= row.expires_at) {
			await this.resend(row);
			return;
		}
		if (now > row.expires_at + GIVE_UP_MS) {
			this.resolve(row.host, row.key, notPlaced(row.key));
			return;
		}
		this.later(row.host, row.key, row.attempts + 1);
	}

	private async resend(row: Row) {
		let a: Answer;
		try {
			a = await this.deps.place(row.host, JSON.parse(row.body!), row.session, row.ip);
		} catch {
			a = { status: 503, body: { code: 'main_unreachable' } };
		}
		await this.settle(row, a);
	}

	/** Drops final rows after KEEP_DONE_MS, parked ones a day past their deadline. */
	prune() {
		const now = this.now();
		this.db.prepare(`DELETE FROM outbox WHERE (state = 'done' AND resolved_at < ?) OR (state = 'parked' AND expires_at < ?)`).run(now - KEEP_DONE_MS, now - GIVE_UP_MS);
	}

	/** Rows still waiting on main (metrics, /healthz). */
	pending(): number {
		return (this.db.prepare(`SELECT count(*) AS n FROM outbox WHERE state = 'pending'`).get() as { n: number }).n;
	}

	start(everyMs = 2_000) {
		if (this.timer) return;
		let running = false;
		this.timer = setInterval(() => {
			if (running) return;
			running = true;
			this.tick().finally(() => (running = false));
		}, everyMs);
		this.timer.unref?.();
	}

	stop() {
		if (this.timer) clearInterval(this.timer);
		this.timer = null;
		this.db.close();
	}
}

/** The answer for an order main never saw before its deadline: not placed, nothing charged. */
export function notPlaced(key: string): Answer {
	return { status: 409, body: { code: 'expired', error: "We couldn't reach the restaurant in time. Your order wasn't placed and your card wasn't charged.", client_order_id: key } };
}

function answerOf(s: KeyState): Answer {
	if (s.state === 'placed') return { status: 200, body: s.order };
	if (s.state === 'verify') return { status: 402, body: { code: s.error?.code, error: s.error?.message } };
	return { status: 409, body: { code: s.error?.code ?? s.state, error: s.error?.message ?? '' } };
}
