import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { brotliDecompressSync } from 'node:zlib';
import { TestServer, ADMIN_PASSWORD } from './server.ts';
import { isOpen } from '../../src/lib/hours.ts';

const srv = new TestServer();
before(() => srv.start());
after(() => srv.stop());

const L = 'lombardis.localhost';
const F = 'fern.localhost';
const T = 'lumbre.localhost';
const ADMIN = 'admin.localhost';
const auth = { authorization: `Bearer ${ADMIN_PASSWORD}` };
const fx = (id: string) => JSON.parse(readFileSync(new URL(`../../fixtures/stores/${id}.json`, import.meta.url), 'utf8'));

/** ASAP when the store is open now, otherwise the next open 15-minute slot. */
function when(store: string) {
	const s = fx(store);
	if (isOpen(s.hours, s.timezone)) return { asap: true };
	for (let t = Math.ceil((Date.now() + 15 * 60_000) / 900_000) * 900_000; t < Date.now() + 2 * 86400_000; t += 900_000) if (isOpen(s.hours, s.timezone, new Date(t))) return { asap: false, at: new Date(t).toISOString() };
	throw new Error('no slot');
}
const sauce = { g: 'pizza-sauce', o: 'regular' };
const pizza = { kind: 'item', itemId: 'build-your-own-pizza', sizeId: 's-14', opts: [sauce, { g: 'pizza-toppings', o: 'pepperoni', p: 'left' }], qty: 1 };
const checkout = (over: Record<string, unknown> = {}) => ({ key: crypto.randomUUID(), lines: [pizza], fulfil: 'pickup', when: when('lombardis'), customer: { name: 'Test Customer', phone: '4435550119' }, payment: { method: 'cash' }, ...over });

describe('tenancy', () => {
	test('unknown and reserved hosts get a neutral 404 with no store data', async () => {
		for (const h of ['nobody.localhost', 'www.localhost', 'api.localhost', 'example.com']) {
			const r = await srv.req(h, '/');
			assert.equal(r.status, 404, h);
			assert.doesNotMatch(r.body, /Lombardi|Fern|Lumbre/);
		}
	});
	test('each store host serves its own store, with its own language', async () => {
		const l = await srv.req(L, '/');
		assert.equal(l.status, 200);
		assert.match(l.body, /<title>Lombardi's/);
		assert.match(l.body, /<html lang="en"/);
		const t = await srv.req(T, '/');
		assert.match(t.body, /<html lang="es"/);
		assert.doesNotMatch(t.body, /Lombardi/);
	});
	test("one store's items, deals and orders are 404 on another store's host", async () => {
		assert.equal((await srv.req(L, '/menu/latte')).status, 404);
		assert.equal((await srv.req(F, '/menu/build-your-own-pizza')).status, 404);
		assert.equal((await srv.req(T, '/deals/game-day')).status, 404);
		const placed = (await srv.req(L, '/api/checkout', { body: checkout() })).json();
		assert.ok(placed.ok, JSON.stringify(placed));
		assert.equal((await srv.req(L, `/api/orders/${placed.publicId}`)).status, 200);
		assert.equal((await srv.req(F, `/api/orders/${placed.publicId}`)).status, 404);
		assert.equal((await srv.req(F, `/order/${placed.publicId}`)).status, 404);
	});
	test('admin pages exist only on the admin host', async () => {
		assert.equal((await srv.req(L, '/admin')).status, 404);
		assert.equal((await srv.req(L, '/admin/api/stores', { headers: auth })).status, 404);
		assert.equal((await srv.req(ADMIN, '/menu')).status, 404);
	});
});

describe('SEO', () => {
	test('home: title, description, canonical, Restaurant JSON-LD, manifest, theme tokens inline', async () => {
		const r = await srv.req(L, '/');
		assert.match(r.body, /<meta name="description"/);
		assert.match(r.body, /<link rel="canonical" href="https:\/\/lombardis\.localhost\/"/);
		assert.match(r.body, /"@type":"Restaurant"/);
		assert.match(r.body, /"openingHoursSpecification"/);
		assert.match(r.body, /rel="manifest"/);
		assert.match(r.body, /--q-canvas:#0F0D1A/);
	});
	test('menu: every visible item is in the HTML with Menu JSON-LD; item pages have MenuItem + breadcrumbs', async () => {
		const m = await srv.req(L, '/menu');
		assert.match(m.body, /"@type":"Menu"/);
		assert.match(m.body, /Butter Chicken/);
		assert.match(m.body, /Cheesesteak Sub/);
		const i = await srv.req(L, '/menu/butter-chicken');
		assert.match(i.body, /"@type":"MenuItem"/);
		assert.match(i.body, /"@type":"BreadcrumbList"/);
	});
	test('sitemap, robots and hreflang', async () => {
		const sm = await srv.req(L, '/sitemap.xml');
		assert.match(sm.body, /<loc>https:\/\/lombardis\.localhost\/menu\/butter-chicken<\/loc>/);
		assert.match((await srv.req(L, '/robots.txt')).body, /Sitemap: https:\/\/lombardis\.localhost\/sitemap\.xml/);
		const t = await srv.req(T, '/');
		assert.match(t.body, /hreflang="en" href="https:\/\/lumbre\.localhost\/en"/);
		assert.equal((await srv.req(T, '/en/menu')).status, 200);
		assert.equal((await srv.req(L, '/es/menu')).status, 404);
	});
	test('per-store manifest and icon', async () => {
		const m = (await srv.req(F, '/manifest.webmanifest')).json();
		assert.equal(m.name, 'Fern & Fold');
		assert.equal(m.display, 'standalone');
		assert.match((await srv.req(F, '/icon.svg')).body, /<svg/);
	});
});

describe('ordering', () => {
	test('quote prices from the menu and ignores anything the client claims', async () => {
		const q = (await srv.req(L, '/api/quote', { body: { lines: [{ ...pizza, unitCents: 1 }], fulfil: 'pickup', tipCents: 0 } })).json();
		assert.equal(q.lines[0].unitCents, 1799 + 150 * 0 + 200);
		assert.deepEqual(q.errors, []);
	});
	test('cash order → tracking with a kitchen number from 1100, advancing stages', async () => {
		const r = (await srv.req(L, '/api/checkout', { body: checkout() })).json();
		assert.ok(r.ok);
		const o = (await srv.req(L, `/api/orders/${r.publicId}`)).json();
		assert.ok(o.kitchenNo >= 1100);
		assert.equal(o.stages[0].status, 'received');
		assert.equal(o.payment.method, 'cash');
	});
	test('the same idempotency key never creates a second order', async () => {
		const body = checkout();
		const a = (await srv.req(L, '/api/checkout', { body })).json();
		const b = (await srv.req(L, '/api/checkout', { body })).json();
		assert.equal(a.publicId, b.publicId);
	});
	test('card: approve, decline (402), bad number', async () => {
		const ok = await srv.req(L, '/api/checkout', { body: checkout({ payment: { method: 'card', card: { number: '4242424242424242', exp: '12/29', cvc: '123' } } }) });
		assert.equal(ok.status, 200);
		const no = await srv.req(L, '/api/checkout', { body: checkout({ payment: { method: 'card', card: { number: '4000000000000002', exp: '12/29', cvc: '123' } } }) });
		assert.equal(no.status, 402);
		assert.equal(no.json().code, 'declined');
		assert.equal((await srv.req(L, '/api/checkout', { body: checkout({ payment: { method: 'card', card: { number: '1234', exp: '12/29', cvc: '1' } } }) })).status, 402);
	});
	test('delivery outside the ZIP list is refused with 422; inside works', async () => {
		const out = await srv.req(L, '/api/checkout', { body: checkout({ fulfil: 'delivery', address: { line1: '12 Main St', zip: '21014' } }) });
		assert.equal(out.status, 422);
		assert.equal(out.json().code, 'outside_zone');
		const inside = await srv.req(L, '/api/checkout', { body: checkout({ fulfil: 'delivery', address: { line1: '412 York Rd', zip: '21204' } }) });
		assert.equal(inside.status, 200, inside.body);
	});
	test('pickup-only store refuses delivery; missing phone is refused', async () => {
		const r = await srv.req(F, '/api/checkout', { body: { ...checkout(), lines: [{ kind: 'item', itemId: 'almond-croissant', opts: [], qty: 1 }], fulfil: 'delivery', when: when('fern'), address: { line1: '1 A St', zip: '21204' } } });
		assert.equal(r.status, 400);
		assert.equal((await srv.req(L, '/api/checkout', { body: checkout({ customer: { name: 'X', phone: '12' } }) })).json().code, 'phone');
	});
	test('live status reports sold-out items', async () => {
		const live = (await srv.req(L, '/api/live')).json();
		assert.ok(live.soldOut.includes('cheesy-bread-sticks'));
		assert.equal(typeof live.open, 'boolean');
	});
});

describe('admin, publishing and snapshots', () => {
	test('admin API needs the password', async () => {
		assert.equal((await srv.req(ADMIN, '/admin/api/stores')).status, 401);
		assert.equal((await srv.req(ADMIN, '/admin/api/stores', { headers: auth })).status, 200);
	});
	test('create a store from a CSV: draft is hidden until published, then served from snapshots', async () => {
		const csv = readFileSync(new URL('../../fixtures/menus/lombardis.csv', import.meta.url), 'utf8');
		const created = await srv.req(ADMIN, '/admin/api/stores', { headers: auth, body: { name: 'E2E Pizza', preset: 'pizzeria-loud', brand: '#C0392B', storeType: 'pizza_delivery', line1: '1 Test St', city: 'Towson', state: 'MD', zip: '21204', phone: '(410) 555-0100', csv } });
		assert.equal(created.status, 201, created.body);
		assert.equal(created.json().report.items, 258);
		assert.equal((await srv.req('e2e-pizza.localhost', '/')).status, 404);
		const pub = await srv.req(ADMIN, '/admin/api/stores/e2e-pizza/publish', { method: 'POST', headers: auth });
		assert.equal(pub.status, 200, pub.body);
		assert.ok(pub.json().pages > 250);
		const home = await srv.req('e2e-pizza.localhost', '/', { headers: { 'accept-encoding': 'br' } });
		assert.equal(home.status, 200);
		assert.equal(home.headers['x-quicc-snapshot'], '1');
		assert.equal(home.headers['content-encoding'], 'br');
		assert.match(brotliDecompressSync(home.raw).toString(), /E2E Pizza/);
		const reserved = await srv.req(ADMIN, '/admin/api/stores', { headers: auth, body: { name: 'Admin', slug: 'admin' } });
		assert.equal(reserved.status, 400);
	});
});
