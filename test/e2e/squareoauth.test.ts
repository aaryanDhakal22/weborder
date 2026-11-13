// Square's OAuth redirect relayed through the storefront to a running main (DURABILITY-PLAN.md
// step 6), with dev main's fake Square playing Square: the owner's code + state reach main only
// with the platform key, main connects the store, and the browser goes back to Store › Settings › Payments.
// The code is never in the storefront's output. Skips when main or the fake Square isn't there.
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { TestServer } from './server.ts';
import { MAIN, TestStore, adminKey, mainUp, platformKey } from './main.ts';

const admin = adminKey();
const up = admin ? await mainUp() : false;
const fakeSquare = up ? await fetch(`${MAIN}/__fake/square/_fake/payments`).then((r) => r.ok).catch(() => false) : false;

/** The owner on Square's page: the code + state Square sends to the registered redirect URL. */
async function squareSends(s: TestStore, deny = false): Promise<URLSearchParams> {
	const { url } = (await s.me('POST', '/square/connect', undefined, 200)).data;
	const r = await fetch(url + (deny ? '&deny=1' : ''), { redirect: 'manual' });
	assert.equal(r.status, 302);
	const q = new URL(r.headers.get('location')!).searchParams;
	const out = new URLSearchParams({ state: q.get('state')! });
	for (const k of ['code', 'error']) if (q.get(k)) out.set(k, q.get(k)!);
	return out;
}

const connected = async (s: TestStore) => (await s.me('GET', '/square', undefined, 200)).data.connected as boolean;

describe('Square OAuth relay', { skip: fakeSquare ? false : `main or its fake Square isn't reachable at ${MAIN}` }, () => {
	const srv = new TestServer();
	const wrongKey = new TestServer();
	const s = new TestStore(admin);
	const codes: string[] = [];
	let revoke = async () => {};

	before(async () => {
		await s.create();
		const pk = await platformKey(admin);
		revoke = pk.revoke;
		await Promise.all([
			srv.start({ MAIN_URL: MAIN, PLATFORM_KEY: pk.key }, { capture: true }),
			wrongKey.start({ MAIN_URL: MAIN, PLATFORM_KEY: 'qpk_' + '0'.repeat(64) }, { capture: true })
		]);
	});
	after(async () => {
		srv.stop();
		wrongKey.stop();
		await Promise.allSettled([s.destroy(), revoke()]);
	});

	test('a key main refuses relays nothing; the right key connects the store', async () => {
		const q = await squareSends(s);
		codes.push(q.get('code')!);
		// on a host no store is served on: the callback needs none
		const refused = await wrongKey.req('square.localhost', `/square/oauth/callback?${q}`);
		assert.equal(refused.status, 502, refused.body);
		assert.match(refused.body, /didn't accept this server/);
		assert.equal(await connected(s), false);

		const r = await srv.req('square.localhost', `/square/oauth/callback?${q}`);
		assert.equal(r.status, 303, r.body);
		assert.match(String(r.headers.location), /\/app\/store\/payments\?square=connected$/);
		assert.equal(r.headers['referrer-policy'], 'no-referrer');
		assert.equal(r.headers['cache-control'], 'no-store');
		assert.equal(await connected(s), true);

		// the same code again: Square's codes are single use, main says error
		const again = await srv.req(s.host, `/square/oauth/callback?${q}`);
		assert.equal(again.status, 303);
		assert.match(String(again.headers.location), /square=error$/);
	});

	test("a forged state goes back with main's expired flag; a malformed one never reaches main", async () => {
		const q = await squareSends(s);
		codes.push(q.get('code')!);
		const [loc, exp] = q.get('state')!.split('.');
		const forged = new URLSearchParams({ code: q.get('code')!, state: `${loc}.${exp}.${'B'.repeat(43)}` });
		const r = await srv.req('square.localhost', `/square/oauth/callback?${forged}`);
		assert.equal(r.status, 303, r.body);
		assert.match(String(r.headers.location), /square=expired$/);
		const bad = await srv.req('square.localhost', `/square/oauth/callback?code=${q.get('code')}&state=nope`);
		assert.equal(bad.status, 400);
		assert.match(bad.body, /isn't valid/);
	});

	test('the owner said no', async () => {
		await s.me('DELETE', '/square', undefined, 204);
		const q = await squareSends(s, true);
		const r = await srv.req('square.localhost', `/square/oauth/callback?${q}`);
		assert.equal(r.status, 303, r.body);
		assert.match(String(r.headers.location), /square=denied$/);
		assert.equal(await connected(s), false);
	});

	test('no code was ever logged', () => {
		assert.ok(codes.length >= 2);
		for (const c of codes) {
			assert.ok(!srv.output.includes(c), 'the storefront logged a code');
			assert.ok(!wrongKey.output.includes(c), 'the storefront logged a code');
		}
	});
});
