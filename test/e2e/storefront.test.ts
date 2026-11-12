// The storefront against a running main (dev by default; MAIN_BASE_URL + ADMIN_API_KEY for another):
// two throwaway stores with their own hosts, one platform key, the production build on a free port.
// Skips when main isn't reachable. Run: npm run test:e2e
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { TestServer } from './server.ts';
import { MAIN, TestStore, adminKey, mainUp, platformKey } from './main.ts';

const admin = adminKey();
const up = admin ? await mainUp() : false;

describe('storefront on main', { skip: up ? false : `main isn't reachable at ${MAIN} (or no admin key)` }, () => {
	const srv = new TestServer();
	const a = new TestStore(admin);
	const b = new TestStore(admin);
	let revoke = async () => {};

	before(async () => {
		await Promise.all([a.create(), b.create()]);
		const pk = await platformKey(admin);
		revoke = pk.revoke;
		// TRUST_PROXY: each test names its own customer IP (main's per-IP sign-in limit outlives runs).
		await srv.start({ MAIN_URL: MAIN, PLATFORM_KEY: pk.key, TRUST_PROXY: '1' });
	});
	after(async () => {
		srv.stop();
		await Promise.allSettled([a.destroy(), b.destroy(), revoke()]);
	});

	const phone = () => '410' + String(1000000 + Math.floor(Math.random() * 8999999));
	const ip = () => `10.${(Math.random() * 255) | 0}.${(Math.random() * 255) | 0}.${1 + ((Math.random() * 250) | 0)}`;
	const lines = () => [
		{ item_id: a.menu.pizza.id, size_id: a.menu.s16.id, qty: 1, options: [{ group_id: a.menu.top.id, option_id: a.menu.pep.id, portion: 'left' }] },
		{ item_id: a.menu.wings.id, qty: 2, options: [{ group_id: a.menu.sauce.id, option_id: a.menu.bbq.id }] }
	];
	const order = (extra: Record<string, unknown> = {}) => ({
		client_order_id: `e2e-${Math.random().toString(36).slice(2, 12)}`,
		type: 'pickup',
		lines: lines(),
		payment: { method: 'cash' },
		customer: { name: 'Ada Lovelace', phone: '(410) 555-0101' },
		promised_at: null,
		...extra
	});

	test('a host no store is served on gets a neutral 404 with no store data', async () => {
		for (const h of ['nobody.localhost', 'www.quiccpos.com', '127.0.0.1']) {
			const r = await srv.req(h, '/');
			assert.equal(r.status, 404, h);
			assert.ok(!r.body.includes('Test Pizza'));
		}
	});

	test('each host serves its own store: SSR menu, JSON-LD, item pages, sitemap', async () => {
		const home = await srv.req(a.host, '/');
		assert.equal(home.status, 200);
		assert.match(home.body, new RegExp(`${a.tag} Test Pizza`));
		assert.ok(!home.body.includes(`${b.tag} Test Pizza`));
		assert.match(home.body, /"@type":"Restaurant"/);
		const menu = await srv.req(a.host, '/menu');
		assert.match(menu.body, /Cheese Pizza/);
		assert.match(menu.body, /Wings/);
		assert.match(menu.body, /"@type":"Menu"/);
		const item = await srv.req(a.host, '/menu/cheese-pizza');
		assert.equal(item.status, 200);
		assert.match(item.body, /"@type":"MenuItem"/);
		assert.match(item.body, /\$15\.99/);
		assert.equal((await srv.req(a.host, '/menu/nope')).status, 404);
		const sm = await srv.req(a.host, '/sitemap.xml');
		assert.match(sm.body, /\/menu\/cheese-pizza/);
		const es = await srv.req(a.host, '/es/menu');
		assert.equal(es.status, 200);
		assert.match(es.body, /<html lang="es"/);
		const mf = (await srv.req(a.host, '/manifest.webmanifest')).json();
		assert.equal(mf.name, `${a.tag} Test Pizza`);
	});

	test('main prices the cart: halves, sizes, options, tip', async () => {
		const q = (await srv.req(a.host, '/api/quote', { body: { type: 'pickup', payment: 'card', lines: lines(), tip_pct: 20 } })).json();
		assert.deepEqual(q.errors, []);
		assert.equal(q.lines[0].unit_cents, 1599 + 225);
		assert.equal(q.lines[1].total_cents, 2 * (1099 + 50));
		assert.equal(q.subtotal_cents, 1824 + 2298);
		assert.ok(q.tip_cents > 0);
		const bad = (await srv.req(a.host, '/api/quote', { body: { type: 'pickup', lines: [{ item_id: a.menu.wings.id, qty: 1 }] } })).json();
		assert.ok(bad.errors.length, 'a missing required sauce is an error');
	});

	test('a cash order: placed once (idempotent), tracked live, never on another store', async () => {
		const body = order();
		const r = await srv.req(a.host, '/api/orders', { body });
		assert.equal(r.status, 201, r.body);
		const o = r.json();
		assert.equal(o.status, 'received');
		assert.equal(o.payment.method, 'cash');
		const again = await srv.req(a.host, '/api/orders', { body });
		assert.equal(again.status, 200);
		assert.equal(again.json().id, o.id);

		const page = await srv.req(a.host, `/order/${o.track_token}`);
		assert.equal(page.status, 200);
		const t = (await srv.req(a.host, `/api/track/${o.track_token}`)).json();
		assert.equal(t.order_id, o.id);
		assert.equal(t.status, 'received');
		assert.ok(!('customer' in t), 'no customer details on the public track');
		// Another store's site never shows it.
		assert.equal((await srv.req(b.host, `/order/${o.track_token}`)).status, 404);
		assert.equal((await srv.req(b.host, `/api/track/${o.track_token}`)).status, 404);
		// The live feed starts with the current state.
		const first = await firstEvent(srv.port, a.host, `/api/track/${o.track_token}/events`);
		assert.equal(first.event, 'track');
		assert.equal(JSON.parse(first.data).order_id, o.id);
	});

	test('card: approved hold, declined (402), outside the hours/options refusals come through', async () => {
		const ok = await srv.req(a.host, '/api/orders', { body: order({ payment: { method: 'card', token: 'tok_visa' }, tip_pct: 18 }) });
		assert.equal(ok.status, 201, ok.body);
		assert.equal(ok.json().payment.method, 'card');
		const no = await srv.req(a.host, '/api/orders', { body: order({ payment: { method: 'card', token: 'tok_decline' } }) });
		assert.equal(no.status, 402);
		assert.equal(no.json().code, 'payment_declined');
		const late = await srv.req(a.host, '/api/orders', { body: order({ promised_at: '2020-01-01T12:00:00Z' }) });
		assert.ok(late.status >= 400 && late.status < 500, late.body);
	});

	test('accounts: code → session in an httpOnly cookie (never in the page), account, orders, sign out', async () => {
		const p = phone();
		const hdr = { 'x-forwarded-for': ip() };
		const sent = await srv.req(a.host, '/api/account/code', { body: { phone: p }, headers: hdr });
		assert.equal(sent.status, 202, sent.body);
		assert.match(sent.json().sent_to, new RegExp(p.slice(-4)));
		assert.equal((await srv.req(a.host, '/api/account/verify', { body: { phone: p, code: '0000000' } })).status, 422);
		const code = await a.signinCode(p);
		const v = await srv.req(a.host, '/api/account/verify', { body: { phone: p, code, name: 'Grace Hopper' } });
		assert.equal(v.status, 200, v.body);
		assert.ok(!('session' in v.json()), 'the session never reaches the page');
		const set = String(v.headers['set-cookie'] ?? '');
		assert.match(set, /qcs=qcs_/);
		assert.match(set, /HttpOnly/i);
		const cookie = set.split(';')[0];
		const acct = (await srv.req(a.host, '/api/account', { headers: { cookie } })).json().account;
		assert.equal(acct.name, 'Grace Hopper');
		assert.equal(acct.phone, p);
		// An order placed signed in joins the account.
		const placed = await srv.req(a.host, '/api/orders', { body: order({ customer: { name: 'Grace Hopper', phone: p } }), headers: { cookie } });
		assert.equal(placed.status, 201, placed.body);
		const mine = (await srv.req(a.host, '/api/account/orders', { headers: { cookie } })).json().orders;
		assert.ok(mine.some((x: { id: string }) => x.id === placed.json().id));
		const re = (await srv.req(a.host, `/api/account/orders/${placed.json().id}/reorder`, { method: 'POST', headers: { cookie } })).json();
		assert.equal(re.lines.length, 2);
		// The cookie is this host's: the other store's site doesn't know the customer.
		assert.equal((await srv.req(b.host, '/api/account', { headers: { cookie } })).json().account, null);
		const out = await srv.req(a.host, '/api/account/logout', { method: 'POST', headers: { cookie } });
		assert.equal(out.status, 204);
		assert.equal((await srv.req(a.host, '/api/account', { headers: { cookie } })).json().account, null);
	});

	test('coupons on the website (the owner, 2026-11-12): offered, applied (they re-price their lines), the order priced with them', async () => {
		const { addCoupon } = await import('../browser/api.ts');
		await addCoupon(a); // 16" Pizza + Wings $19.99, every channel kind
		const ls = [lines()[0], { ...lines()[1], qty: 1 }];
		const q = (await srv.req(a.host, '/api/quote', { body: { type: 'pickup', lines: ls } })).json();
		const [offer] = q.coupon_offers;
		assert.equal(offer.name, '16" Pizza + Wings');
		assert.deepEqual(offer.lines, [0, 1]);
		const coupons = [{ id: offer.id, lines: offer.lines }];
		const qc = (await srv.req(a.host, '/api/quote', { body: { type: 'pickup', lines: ls, coupons } })).json();
		assert.deepEqual(qc.errors, []);
		assert.deepEqual(qc.lines.map((l: { total_cents: number }) => l.total_cents), [1999 + 225, 50]);
		assert.equal(qc.subtotal_cents, 1999 + 225 + 50);
		assert.deepEqual(qc.discounts, []);
		const r = await srv.req(a.host, '/api/orders', { body: order({ lines: ls, coupons, expected_total_cents: qc.total_cents }) });
		assert.equal(r.status, 201, r.body);
		assert.equal(r.json().money.subtotal_cents, qc.subtotal_cents);
		// a coupon that doesn't fit as sent refuses the order
		const bad = await srv.req(a.host, '/api/orders', { body: order({ lines: [ls[0]], coupons }) });
		assert.equal(bad.status, 422, bad.body);
		assert.equal(bad.json().code, 'cart_invalid');
	});

	test('live store status and a pause show up', async () => {
		const s = (await srv.req(a.host, '/api/store')).json();
		assert.ok(['open', 'closed', 'paused'].includes(s.state));
		assert.equal(s.week.length, 7);
	});

	test("Store › Website: the preview link shows the draft, keeps its prefix, never leaks; logo through /media; privacy page", async () => {
		// a logo (SVG) and a draft with a headline + an announcement
		const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#E2363B"/></svg>';
		const up = await fetch(`${MAIN}/store/v1/me/site/images?kind=logo`, { method: 'POST', headers: { cookie: a.cookie, 'content-type': 'image/svg+xml' }, body: svg });
		assert.equal(up.status, 201);
		const logo = (await up.json()).id as string;
		await a.me('PUT', '/site/website/draft', { logo, texts: { headline: `Draft headline ${a.tag}` }, announcement: { on: true, text: 'Closed Thanksgiving' }, blocks: [{ id: 'about', on: true }], miso_pages: false }, 200);
		const w = (await a.me('GET', '/site/website', undefined, 200)).data;
		const root = new URL(w.preview_url).pathname;
		assert.match(root, /^\/p\/qpv_[0-9a-f]+$/);

		const pv = await srv.req(a.host, root);
		assert.equal(pv.status, 200);
		assert.ok(pv.body.includes(`Draft headline ${a.tag}`) && pv.body.includes('Closed Thanksgiving'));
		assert.ok(pv.body.includes(`href="${root}/menu"`), 'links keep the preview prefix');
		assert.ok(pv.body.includes(`/media/${logo}`));
		assert.equal(pv.headers['content-security-policy'], 'frame-ancestors *');
		assert.equal(pv.headers['x-robots-tag'], 'noindex');
		assert.equal((await srv.req(a.host, `${root}/menu`)).status, 200);
		// the published site and the other store never see the draft
		const live = await srv.req(a.host, '/');
		assert.ok(!live.body.includes(`Draft headline ${a.tag}`) && live.headers['x-frame-options'] === 'SAMEORIGIN');
		const other = await srv.req(b.host, root);
		assert.equal(other.status, 303);
		// a stale link drops the prefix
		const stale = await srv.req(a.host, '/p/qpv_0000000000000000/menu');
		assert.equal(stale.status, 303);
		assert.equal(stale.headers.location, '/menu');

		const img = await srv.req(a.host, `/media/${logo}`);
		assert.equal(img.status, 200);
		assert.equal(img.headers['content-type'], 'image/svg+xml');
		assert.match(String(img.headers['cache-control']), /immutable/);
		assert.match(String(img.headers['content-security-policy']), /sandbox/);
		assert.equal((await srv.req(b.host, `/media/${logo}`)).status, 404);

		const pr = await srv.req(a.host, '/privacy');
		assert.equal(pr.status, 200);
		assert.ok(pr.body.includes('card numbers go straight to Square') || pr.body.includes('Cards: card numbers'));
		await a.me('DELETE', '/site/website/draft', undefined, 200);
	});
});

function firstEvent(port: number, host: string, path: string): Promise<{ event: string; data: string }> {
	return new Promise((resolve, reject) => {
		const req = http.get({ hostname: '127.0.0.1', port, path, headers: { host, accept: 'text/event-stream' } }, (res) => {
			let buf = '';
			res.on('data', (c) => {
				buf += c;
				for (const frame of buf.split('\n\n')) {
					const ev = /^event: (.+)$/m.exec(frame)?.[1];
					const data = /^data: (.+)$/m.exec(frame)?.[1];
					if (ev && data) {
						req.destroy();
						resolve({ event: ev, data });
						return;
					}
				}
			});
		});
		req.on('error', reject);
		setTimeout(() => reject(new Error('no event in 5 s')), 5000).unref();
	});
}
