// Live tracking without a public stream on main: one upstream /channel/v1/events connection per
// store host, open only while at least one tracking page watches an order of that store. Each
// upstream event names an order; its watchers re-read the public /track/v1/{token} (so nothing but
// the public fields ever reaches a browser). Reconnects with Last-Event-ID after a drop.
import { stream } from './main';

type Watcher = () => void;

interface Upstream {
	host: string;
	watchers: Map<string, Set<Watcher>>; // order id → watchers
	ctl: AbortController | null;
	lastId: string;
	backoff: number;
}

const ups = new Map<string, Upstream>();

function wake(u: Upstream, orderId: string | null) {
	const sets = orderId ? [u.watchers.get(orderId)] : [...u.watchers.values()];
	for (const s of sets) if (s) for (const w of s) w();
}

async function run(u: Upstream) {
	while (u.watchers.size) {
		const ctl = new AbortController();
		u.ctl = ctl;
		try {
			const res = await stream(u.host, '/channel/v1/events', ctl.signal, u.lastId || undefined);
			if (!res.ok || !res.body) throw new Error(`events ${res.status}`);
			u.backoff = 1000;
			if (!u.lastId) wake(u, null); // first connect: catch anything missed while opening
			const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
			let buf = '';
			for (;;) {
				const { value, done } = await reader.read();
				if (done) break;
				buf += value;
				let i: number;
				while ((i = buf.indexOf('\n\n')) >= 0) {
					const frame = buf.slice(0, i);
					buf = buf.slice(i + 2);
					let id = '', ev = '', data = '';
					for (const line of frame.split('\n')) {
						if (line.startsWith('id:')) id = line.slice(3).trim();
						else if (line.startsWith('event:')) ev = line.slice(6).trim();
						else if (line.startsWith('data:')) data += line.slice(5).trim();
					}
					if (id) u.lastId = id;
					if (ev === 'reset') wake(u, null);
					else if (ev && data) {
						try {
							const d = JSON.parse(data) as { order_id?: string; id?: string };
							wake(u, d.order_id ?? d.id ?? null);
						} catch {
							/* not JSON: ignore */
						}
					}
				}
			}
		} catch {
			if (ctl.signal.aborted && !u.watchers.size) break;
		}
		if (!u.watchers.size) break;
		await new Promise((r) => setTimeout(r, u.backoff));
		u.backoff = Math.min(u.backoff * 2, 30_000);
	}
	u.ctl = null;
	ups.delete(u.host);
}

/** Calls `fn` whenever main reports a change to `orderId` at `host`. Returns the unsubscribe. */
export function watch(host: string, orderId: string, fn: Watcher): () => void {
	let u = ups.get(host);
	if (!u) {
		u = { host, watchers: new Map(), ctl: null, lastId: '', backoff: 1000 };
		ups.set(host, u);
	}
	const set = u.watchers.get(orderId) ?? new Set();
	set.add(fn);
	u.watchers.set(orderId, set);
	if (!u.ctl) void run(u);
	return () => {
		set.delete(fn);
		if (!set.size) u.watchers.delete(orderId);
		if (!u.watchers.size) u.ctl?.abort();
	};
}

/** Open upstream connections (tests). */
export const upstreams = () => ups.size;
