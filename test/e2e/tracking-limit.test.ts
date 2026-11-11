// main limits public tracking lookups per CUSTOMER, not per storefront: the storefront forwards each
// customer's IP (X-Customer-IP, believed only with its platform key). Without that, every customer of
// a live site would share one limit (120 a minute) and a busy night would lock all of them out.
// This storefront's own key gets a low limit (dev-only hook), so the run doesn't trip anyone else's.
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { TestServer } from './server.ts';
import { MAIN, TestStore, adminKey, mainUp, platformKey } from './main.ts';

const admin = adminKey();
const up = admin ? await mainUp() : false;
const PER_MIN = 5;

describe('tracking limit per customer through the storefront', { skip: up ? false : `main isn't reachable at ${MAIN} (or no admin key)` }, () => {
	const srv = new TestServer();
	const shop = new TestStore(admin);
	let key = '';
	let revoke = async () => {};
	const limit = (perMin: number) =>
		fetch(`${MAIN}/admin/v1/dev/track-limit`, {
			method: 'POST',
			headers: { authorization: `Bearer ${admin}`, 'content-type': 'application/json' },
			body: JSON.stringify({ key, per_min: perMin })
		});

	before(async () => {
		await shop.create();
		const pk = await platformKey(admin);
		key = pk.key;
		revoke = pk.revoke;
		assert.equal((await limit(PER_MIN)).status, 200, 'the dev hook (dev main only)');
		await srv.start({ MAIN_URL: MAIN, PLATFORM_KEY: key, TRUST_PROXY: '1' });
	});
	after(async () => {
		srv.stop();
		await limit(0).catch(() => null);
		await Promise.allSettled([shop.destroy(), revoke()]);
	});

	test('a customer over the limit gets 429; another customer of the same site still gets through', async () => {
		const ip = () => `10.${(Math.random() * 255) | 0}.${(Math.random() * 255) | 0}.${1 + ((Math.random() * 250) | 0)}`;
		const A = { 'x-forwarded-for': ip() };
		const B = { 'x-forwarded-for': ip() };
		const placed = await srv.req(shop.host, '/api/orders', {
			headers: A,
			body: {
				client_order_id: `limit-${Date.now()}`, type: 'pickup', payment: { method: 'cash' },
				customer: { name: 'Ada Lovelace', phone: '4105550100' },
				lines: [{ item_id: shop.menu.wings.id, qty: 1, options: [{ group_id: shop.menu.sauce.id, option_id: shop.menu.bbq.id }] }]
			}
		});
		assert.equal(placed.status, 201, placed.body);
		const token = placed.json().track_token;

		const a: number[] = [];
		for (let i = 0; i < PER_MIN + 2; i++) a.push((await srv.req(shop.host, `/api/track/${token}`, { headers: A })).status);
		assert.deepEqual(a.slice(0, PER_MIN), Array(PER_MIN).fill(200), `A's first ${PER_MIN}: ${a}`);
		assert.deepEqual(a.slice(PER_MIN), [429, 429], `A past the limit: ${a}`);

		// B never asked: a separate limit lets B through (one shared limit would answer 429 here)
		assert.equal((await srv.req(shop.host, `/api/track/${token}`, { headers: B })).status, 200);
		assert.equal((await srv.req(shop.host, `/order/${token}`, { headers: B })).status, 200, "B's tracking page");
	});
});
