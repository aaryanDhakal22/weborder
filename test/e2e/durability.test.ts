// Ordering durability (DURABILITY-PLAN.md) against a running main: the outbox carries an order main
// didn't answer in time ("Still confirming") to its final answer, and a store whose Pi is offline
// refuses ASAP orders and says so before checkout. Its own storefront server, with a short
// ORDER_WAIT_MS so main's slow test card outlasts the page's wait. Skips when main isn't reachable.
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { TestServer } from './server.ts';
import { MAIN, TestStore, adminKey, mainUp, platformKey } from './main.ts';
import { connectFakeSquare, deviceKey, piOffline, piOnline } from '../browser/api.ts';

const admin = adminKey();
const up = admin ? await mainUp() : false;
const fakeSquare = up ? await fetch(`${MAIN}/__fake/square/_fake/payments`).then((r) => r.ok).catch(() => false) : false;

async function until<T>(what: string, f: () => Promise<T | undefined | null | false>, ms = 20_000): Promise<T> {
	const end = Date.now() + ms;
	for (;;) {
		const v = await f();
		if (v) return v;
		if (Date.now() > end) throw new Error(`timed out waiting for ${what}`);
		await new Promise((r) => setTimeout(r, 300)); // polling main / the storefront, not a fixed wait
	}
}

describe('ordering durability', { skip: up ? false : `main isn't reachable at ${MAIN} (or no admin key)` }, () => {
	const srv = new TestServer();
	const s = new TestStore(admin);
	const off = new TestStore(admin);
	let revoke = async () => {};

	before(async () => {
		await Promise.all([s.create(), off.create()]);
		const pk = await platformKey(admin);
		revoke = pk.revoke;
		await srv.start({ MAIN_URL: MAIN, PLATFORM_KEY: pk.key, TRUST_PROXY: '1', ORDER_WAIT_MS: '1500' });
	});
	after(async () => {
		srv.stop();
		piOffline(off);
		await Promise.allSettled([s.destroy(), off.destroy(), revoke()]);
	});

	const ip = () => `10.${(Math.random() * 255) | 0}.${(Math.random() * 255) | 0}.${1 + ((Math.random() * 250) | 0)}`;
	const order = (st: TestStore, extra: Record<string, unknown> = {}) => ({
		client_order_id: `e2e-${Math.random().toString(36).slice(2, 12)}`,
		type: 'pickup',
		lines: [{ item_id: st.menu.fries.id, qty: 1 }],
		payment: { method: 'cash' },
		customer: { name: 'Ada Lovelace', phone: '(410) 555-0101' },
		promised_at: null,
		...extra
	});
	const headers = () => ({ 'x-forwarded-for': ip() });

	test('main answers after the page stops waiting: pending, then by-key follows the outbox to the order', { skip: fakeSquare ? false : 'no fake Square' }, async () => {
		await connectFakeSquare(s);
		const body = order(s, { payment: { method: 'card', token: 'cnon:card-nonce-slow-4' } });
		const r = await srv.req(s.host, '/api/orders', { body, headers: headers() });
		assert.equal(r.status, 202, r.body);
		assert.deepEqual(r.json(), { state: 'pending', client_order_id: body.client_order_id });
		const placed = await until('the order placed', async () => {
			const k = await srv.req(s.host, `/api/orders/by-key/${body.client_order_id}`);
			assert.equal(k.status, 200, k.body);
			const v = k.json();
			assert.ok(['pending', 'placed'].includes(v.state), k.body);
			return v.state === 'placed' ? v : null;
		});
		assert.ok(placed.order.track_token);
		assert.equal(placed.order.client_order_id, body.client_order_id);
		// sending it again (the page retrying) returns the same order, never a second one
		const again = await srv.req(s.host, '/api/orders', { body, headers: headers() });
		assert.equal(again.status, 200, again.body);
		assert.equal(again.json().id, placed.order.id);
		// another store's host can't see the key
		assert.equal((await srv.req(off.host, `/api/orders/by-key/${body.client_order_id}`)).status, 404);
	});

	test('an unknown key is a 404; a final refusal is kept and answered from the outbox', async () => {
		assert.equal((await srv.req(s.host, '/api/orders/by-key/w-nope')).status, 404);
		const body = order(s, { expected_total_cents: 1 }); // main re-prices: prices changed
		const r = await srv.req(s.host, '/api/orders', { body, headers: headers() });
		assert.equal(r.status, 409, r.body);
		assert.equal(r.json().code, 'price_changed');
		const k = (await srv.req(s.host, `/api/orders/by-key/${body.client_order_id}`)).json();
		assert.equal(k.state, 'refused');
		assert.equal(k.error.code, 'price_changed');
		// the same key with another body: main says key_reused, and the outbox answers with main's truth
		const re = await srv.req(s.host, '/api/orders', { body: { ...body, expected_total_cents: null }, headers: headers() });
		assert.equal(re.status, 409, re.body);
		assert.equal((await srv.req(s.host, `/api/orders/by-key/${body.client_order_id}`)).json().state, 'refused');
	});

	test('the kitchen is offline: /api/store says so and ASAP orders are refused; back when the Pi is', async () => {
		await deviceKey(off, { stream: false }); // a Pi is set up, and isn't connected
		// the storefront re-reads a store's status at most every 10 s; main counts a Pi away 30 s after its
		// stream closed — or after main started, for a store it never saw (a main just restarted: air's
		// rebuild after a sync, a fresh gate stack), so allow both
		await until('the kitchen offline', async () => (await srv.req(off.host, '/api/store')).json().kitchen_offline === true, 50_000);
		const r = await srv.req(off.host, '/api/orders', { body: order(off), headers: headers() });
		assert.equal(r.status, 409, r.body);
		assert.equal(r.json().code, 'kitchen_offline');
		await piOnline(off);
		await until('the kitchen online', async () => (await srv.req(off.host, '/api/store')).json().kitchen_offline === false);
		const ok = await srv.req(off.host, '/api/orders', { body: order(off), headers: headers() });
		assert.equal(ok.status, 201, ok.body);
	});
});
