// What the browser tests change on main for a store, the way its manager, its Pi or an admin would:
// deals, pause, a closed day, ordering settings, sold out, the fake Square, floor events (the
// order's status on tracking pages). All through main's own APIs, never the database.
import { randomUUID } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import { MAIN, type TestStore } from '../e2e/main.ts';

type Json = Record<string, any>;

async function call(method: string, url: string, headers: Record<string, string>, body?: unknown, expect?: number) {
	const r = await fetch(url, { method, headers: { ...headers, ...(body === undefined ? {} : { 'content-type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body) });
	const text = await r.text();
	if (expect !== undefined && r.status !== expect) throw new Error(`${method} ${url}: ${r.status} ${text.slice(0, 300)}`);
	return text ? JSON.parse(text) : null;
}

const keys = new WeakMap<TestStore, string>();

/** The store's agent key (an admin-minted device), made once per store. */
async function deviceKey(s: TestStore): Promise<string> {
	let k = keys.get(s);
	if (!k) {
		k = (await s.adminCall('POST', '/devices', { location_id: s.locationId, name: 'browser-test-agent' }, 201)).data.api_key as string;
		keys.set(s, k);
	}
	return k;
}

/** An RPC from the store's "Pi" (main answers on the same request). */
export async function rpc(s: TestStore, type: string, payload: Json = {}): Promise<Json> {
	const env = { type, id: randomUUID(), payload };
	const r = await call('POST', `${MAIN}/store/v1/agent/rpc`, { 'X-STORE-API-KEY': await deviceKey(s) }, env, 200);
	return r.payload;
}

/** Floor events as the Pi sends them: accepted (kitchen #), ready, on_delivery (driver), delivered, cancelled. */
export async function floor(s: TestStore, orderId: string, status: string, extra: Json = {}) {
	const ev = { event_id: randomUUID(), type: 'order.status', at: new Date().toISOString(), order_id: orderId, status, ...extra };
	const res = await rpc(s, 'floor.events', { events: [ev] });
	const result = res.results?.[0]?.result;
	if (result !== 'applied') throw new Error(`floor event ${status}: ${JSON.stringify(res)}`);
}

/** A bundle (16" pizza + wings), a "2nd wings half off" and a code deal on the store's menu. */
export async function addDeals(s: TestStore) {
	const m = s.menu;
	const post = (d: Json) => s.me('POST', '/deals', d, 201).then((r) => r.data);
	const bundle = await post({ kind: 'bundle', name: 'Pizza + Wings', active: true, price_cents: 2299, slots: [
		{ label: 'Pizza', eligible: { items: [m.pizza.id], sizes: [m.s16.id] }, included_options: 1 },
		{ label: 'Wings', eligible: { items: [m.wings.id] }, included_options: 0 }
	] });
	const nth = await post({ kind: 'nth', name: '2nd wings half off', active: true, eligible: { items: [m.wings.id] }, n: 2, pct: 50 });
	const code = await post({ kind: 'code', name: 'Ten off', active: true, code: 'SAVE10', pct: 10 });
	return { bundle, nth, code };
}

export const pause = (s: TestStore, preset = 'indefinite', note = '') => s.me('POST', '/pause', { preset, note }, 200);

/** Closed all day today (store-local), so the store reads "closed" with a next opening. */
export async function closeToday(s: TestStore) {
	const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
	await s.me('POST', '/hours-exceptions', { date: today, closed: true, note: 'Private event' }, 200);
}

export const ordering = (s: TestStore, body: Json) =>
	s.me('PUT', '/ordering', { pickup_enabled: true, delivery_enabled: true, pickup_eta_minutes: 20, delivery_eta_minutes: 45, schedule_days: 7, ...body }, 200);

/** Sold out from the Pi (menu.stock.set). */
export const soldOut = (s: TestStore, kind: 'item' | 'option', id: string) => rpc(s, 'menu.stock.set', { kind, id, in_stock: false, hold: true });

/** Connects main's fake Square (dev, SQUARE_ENV=fake): the connect link → the fake's page → main. */
export async function connectFakeSquare(s: TestStore) {
	const { url } = (await s.me('POST', '/square/connect', undefined, 200)).data;
	const r = await fetch(url, { redirect: 'follow' });
	if (!r.url.includes('square=connected')) throw new Error(`fake Square didn't connect: ${r.url}`);
	await r.text();
}

/** A store's own web channel: what the storefront's pages read (for a second look at main's view). */
export async function websiteVersion(s: TestStore): Promise<number> {
	return (await s.me('GET', '/site/website', undefined, 200)).data.version;
}

/** Uploads a logo (SVG) or a cover (PNG) as the store's manager; returns the image id. */
export async function upload(s: TestStore, kind: 'logo' | 'cover', body: string | Uint8Array<ArrayBuffer>, type: string): Promise<string> {
	const r = await fetch(`${MAIN}/store/v1/me/site/images?kind=${kind}`, { method: 'POST', headers: { cookie: s.cookie, 'content-type': type }, body });
	if (r.status !== 201) throw new Error(`upload ${kind}: ${r.status} ${await r.text()}`);
	return (await r.json()).id;
}

export const LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40"><rect width="120" height="40" rx="8" fill="#1F6FEB"/><text x="60" y="27" font-size="18" text-anchor="middle" fill="#fff" font-family="sans-serif">TP</text></svg>';

/** A small valid PNG in one colour (built here, so the tests carry no binary files). */
export function png(w = 160, h = 90, rgb: [number, number, number] = [200, 120, 60]): Uint8Array<ArrayBuffer> {
	const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: w }, () => rgb).flat())]);
	const raw = Buffer.concat(Array.from({ length: h }, () => row));
	const table = Array.from({ length: 256 }, (_, n) => {
		let c = n;
		for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		return c >>> 0;
	});
	const crc = (b: Buffer) => {
		let c = 0xffffffff;
		for (const x of b) c = table[(c ^ x) & 0xff] ^ (c >>> 8);
		return (c ^ 0xffffffff) >>> 0;
	};
	const chunk = (type: string, data: Buffer) => {
		const len = Buffer.alloc(4);
		len.writeUInt32BE(data.length);
		const td = Buffer.concat([Buffer.from(type), data]);
		const c = Buffer.alloc(4);
		c.writeUInt32BE(crc(td));
		return Buffer.concat([len, td, c]);
	};
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(w, 0);
	ihdr.writeUInt32BE(h, 4);
	ihdr[8] = 8;
	ihdr[9] = 2;
	return new Uint8Array(Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}
