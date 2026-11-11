// The order outbox (DURABILITY-PLAN.md) against a fake main: written before main is asked, sent
// again until main gives a final answer, never twice at once, expired when main never saw it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Outbox, EXPIRED_GRACE_MS, KEEP_DONE_MS, type Answer } from '../../src/lib/server/outbox.ts';

const H = 't.localhost';

/** A fake main: a script of answers per call kind; `null` = main didn't answer (throws). */
function fakeMain() {
	const m = {
		t: 1_000_000,
		placed: new Map<string, any>(), // key → order (main's own memory)
		places: [] as { key: string; body: any; session: string | null }[],
		byKeys: 0,
		placeAnswer: (_key: string): Answer | null => ({ status: 201, body: { id: 'o1', track_token: 'tk' } }),
		byKeyAnswer: (key: string): Answer | null =>
			m.placed.has(key) ? { status: 200, body: { state: 'placed', order: m.placed.get(key) } } : { status: 404, body: { code: 'unknown_key' } }
	};
	const deps = {
		now: () => m.t,
		place: async (_h: string, body: any, session: string | null) => {
			m.places.push({ key: body.client_order_id, body, session });
			const a = m.placeAnswer(body.client_order_id);
			if (!a) throw new Error('main unreachable');
			if (a.status === 201 || a.status === 200) m.placed.set(body.client_order_id, a.body);
			return a;
		},
		byKey: async (h: string, key: string) => {
			m.byKeys++;
			if (h !== H) return { status: 404, body: { code: 'unknown_key' } }; // another store's channel
			const a = m.byKeyAnswer(key);
			if (!a) throw new Error('main unreachable');
			return a;
		}
	};
	return { m, box: new Outbox(':memory:', deps) };
}

const order = (key: string) => ({ client_order_id: key, type: 'pickup', lines: [], payment: { method: 'cash' } });

test('main answers: the order comes back as is and the row is final', async () => {
	const { m, box } = fakeMain();
	const a = await box.place(H, order('k1'), 'qcs_x', '10.0.0.1', m.t + 300_000);
	assert.equal(a.status, 201);
	assert.equal(box.get(H, 'k1')?.state, 'done');
	assert.equal(box.get(H, 'k1')?.body, null, 'the order body and session are dropped once final');
	assert.equal(box.get(H, 'k1')?.session, null);
	assert.deepEqual(await box.lookup(H, 'k1'), { state: 'placed', order: { id: 'o1', track_token: 'tk' } });
	assert.equal(m.byKeys, 0, 'a final row answers without asking main');
	box.stop();
});

test('no answer: pending, then the worker asks main and sends the same body again', async () => {
	const { m, box } = fakeMain();
	m.placeAnswer = () => null; // main is down
	const a = await box.place(H, order('k2'), 'qcs_x', '10.0.0.1', m.t + 300_000);
	assert.deepEqual(a, { status: 202, body: { state: 'pending', client_order_id: 'k2' } });
	assert.equal(box.get(H, 'k2')?.state, 'pending');
	assert.deepEqual(await box.lookup(H, 'k2'), { state: 'pending' });

	m.placeAnswer = () => ({ status: 201, body: { id: 'o2', track_token: 'tk2' } }); // main is back
	await box.tick();
	assert.equal(box.get(H, 'k2')?.state, 'pending', 'not due yet (backoff)');
	m.t += 60_000;
	await box.tick();
	assert.equal(box.get(H, 'k2')?.state, 'done');
	assert.equal(m.places.length, 2);
	assert.deepEqual(m.places[1].body, m.places[0].body, 'the same body again');
	assert.equal(m.places[1].session, 'qcs_x', 'with the customer session');
	assert.deepEqual(await box.lookup(H, 'k2'), { state: 'placed', order: { id: 'o2', track_token: 'tk2' } });
	box.stop();
});

test('main has it and is still at work: the worker waits and never sends it again', async () => {
	const { m, box } = fakeMain();
	m.placeAnswer = () => ({ status: 202, body: { state: 'pending', client_order_id: 'k3' } });
	let state = 'pending';
	m.byKeyAnswer = () => (state === 'pending' ? { status: 200, body: { state: 'pending', expires_at: null } } : { status: 200, body: { state: 'placed', order: { id: 'o3' } } });
	assert.equal((await box.place(H, order('k3'), null, '', m.t + 300_000)).status, 202);
	m.t += 60_000;
	await box.tick();
	assert.equal(box.get(H, 'k3')?.state, 'pending');
	assert.equal(m.places.length, 1, 'never sent twice while main works on it');
	state = 'placed';
	m.t += 60_000;
	await box.tick();
	assert.equal(box.get(H, 'k3')?.state, 'done');
	assert.deepEqual(await box.lookup(H, 'k3'), { state: 'placed', order: { id: 'o3' } });
	box.stop();
});

test('the page asking moves a pending row along (main placed it meanwhile)', async () => {
	const { m, box } = fakeMain();
	m.placeAnswer = () => null;
	await box.place(H, order('k4'), null, '', m.t + 300_000);
	m.placed.set('k4', { id: 'o4' }); // main got it after all (the answer was lost)
	assert.deepEqual(await box.lookup(H, 'k4'), { state: 'placed', order: { id: 'o4' } });
	assert.equal(box.get(H, 'k4')?.state, 'done');
	box.stop();
});

test('main never saw it before the deadline: not placed, nothing charged', async () => {
	const { m, box } = fakeMain();
	m.placeAnswer = () => null;
	await box.place(H, order('k5'), null, '', m.t + 300_000);
	m.t += 300_000 + EXPIRED_GRACE_MS + 1;
	await box.tick();
	const s = await box.lookup(H, 'k5');
	assert.equal(s?.state, 'expired');
	assert.match(s?.error?.message ?? '', /wasn't charged/);
	assert.equal(m.places.length, 1, 'never sent past the deadline');
	box.stop();
});

test('final refusals are kept; 5xx and main_unreachable are not final', async () => {
	const { m, box } = fakeMain();
	m.placeAnswer = () => ({ status: 409, body: { code: 'price_changed', error: 'Prices changed' } });
	assert.equal((await box.place(H, order('k6'), null, '', m.t + 300_000)).status, 409);
	assert.deepEqual(await box.lookup(H, 'k6'), { state: 'refused', error: { code: 'price_changed', message: 'Prices changed' } });
	m.placeAnswer = () => ({ status: 500, body: { code: 'internal' } });
	assert.equal((await box.place(H, order('k7'), null, '', m.t + 300_000)).status, 202);
	assert.equal(box.get(H, 'k7')?.state, 'pending');
	m.placeAnswer = () => ({ status: 409, body: { code: 'expired', error: 'too late' } });
	await box.place(H, order('k8'), null, '', m.t + 300_000);
	assert.equal((await box.lookup(H, 'k8'))?.state, 'expired');
	box.stop();
});

test('3-D Secure parks the row: the worker leaves it to the customer', async () => {
	const { m, box } = fakeMain();
	m.placeAnswer = () => ({ status: 402, body: { code: 'verification_required', error: 'verify' } });
	m.byKeyAnswer = () => ({ status: 200, body: { state: 'pending', error: { code: 'verification_required', message: 'verify' } } });
	assert.equal((await box.place(H, order('k9'), null, '', m.t + 300_000)).status, 402);
	assert.equal(box.get(H, 'k9')?.state, 'parked');
	m.t += 60_000;
	await box.tick();
	assert.equal(m.places.length, 1);
	assert.equal((await box.lookup(H, 'k9'))?.state, 'verify');
	// the customer verifies: the same key again
	m.placeAnswer = () => ({ status: 201, body: { id: 'o9' } });
	assert.equal((await box.place(H, { ...order('k9'), payment: { method: 'card', verification_token: 'v' } }, null, '', m.t + 300_000)).status, 201);
	assert.equal(box.get(H, 'k9')?.state, 'done');
	box.stop();
});

test('main parked a temporary failure: the worker sends it again', async () => {
	const { m, box } = fakeMain();
	m.placeAnswer = () => ({ status: 503, body: { code: 'try_again' } });
	m.byKeyAnswer = () => ({ status: 200, body: { state: 'pending', error: { code: 'try_again', message: 'try again' } } });
	await box.place(H, order('k10'), null, '', m.t + 300_000);
	m.placeAnswer = () => ({ status: 201, body: { id: 'o10' } });
	m.t += 60_000;
	await box.tick();
	assert.equal(m.places.length, 2);
	assert.equal(box.get(H, 'k10')?.state, 'done');
	box.stop();
});

test('a send in progress is never doubled by the worker', async () => {
	const { m, box } = fakeMain();
	let release!: () => void;
	const gate = new Promise<void>((r) => (release = r));
	const first = { status: 201, body: { id: 'o11' } };
	box.deps.place = async (_h, body: any) => {
		m.places.push({ key: body.client_order_id, body, session: null });
		await gate;
		return first;
	};
	const p = box.place(H, order('k11'), null, '', m.t + 300_000);
	m.t += 60_000; // due, while the page's send still waits on main
	await box.tick();
	assert.equal(m.places.length, 1);
	release();
	assert.equal((await p).status, 201);
	box.stop();
});

test('hosts are separate, and final rows are pruned after a week', async () => {
	const { m, box } = fakeMain();
	await box.place(H, order('k12'), null, '', m.t + 300_000);
	assert.equal(await box.lookup('other.localhost', 'k12'), null, "another store's host doesn't see it");
	assert.equal(box.get('other.localhost', 'k12'), undefined, 'no row for another host');
	m.t += KEEP_DONE_MS + 1;
	box.prune();
	assert.equal(box.get(H, 'k12'), undefined);
	box.stop();
});

test('key_reused: main already placed the earlier attempt, so the page gets that order (never twice)', async () => {
	const { m, box } = fakeMain();
	m.placed.set('k13', { id: 'o13', track_token: 'tk13' }); // an attempt the page never heard back from
	m.placeAnswer = () => ({ status: 409, body: { code: 'key_reused', error: 'different order' } });
	const a = await box.place(H, { ...order('k13'), notes: 'changed' }, null, '', m.t + 300_000);
	assert.equal(a.status, 200);
	assert.deepEqual(a.body, { id: 'o13', track_token: 'tk13' });
	assert.equal((await box.lookup(H, 'k13'))?.state, 'placed');
	// nothing under the key at main: the refusal stands
	m.byKeyAnswer = () => ({ status: 200, body: { state: 'refused', error: { code: 'payment_declined', message: 'declined' } } });
	const b = await box.place(H, { ...order('k14'), notes: 'x' }, null, '', m.t + 300_000);
	assert.equal(b.status, 409);
	assert.equal((await box.lookup(H, 'k14'))?.state, 'refused');
	box.stop();
});
