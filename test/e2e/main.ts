// A throwaway store on a running main (dev by default): a tenant with a small menu, a manager
// session, a platform key and a verified host — the storefront's whole world. Every run makes its
// own and deletes it, so runs never share rows (parallel-safe).
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

export const MAIN = (process.env.MAIN_BASE_URL ?? 'http://localhost:1323').replace(/\/+$/, '');

/** The admin key: ADMIN_API_KEY, else dev main's Doppler token file (like the pytest suites). */
export function adminKey(): string {
	if (process.env.ADMIN_API_KEY) return process.env.ADMIN_API_KEY;
	const tokenFile = new URL('../../../main/.doppler-dev-main', import.meta.url).pathname;
	if (!existsSync(tokenFile)) return '';
	try {
		return execFileSync('doppler', ['secrets', 'get', 'ADMIN_API_KEY', '--plain'], { env: { ...process.env, DOPPLER_TOKEN: readFileSync(tokenFile, 'utf8').trim() } }).toString().trim();
	} catch {
		return '';
	}
}

export async function mainUp(): Promise<boolean> {
	try {
		return (await fetch(`${MAIN}/health`, { signal: AbortSignal.timeout(2000) })).ok;
	} catch {
		return false;
	}
}

type Json = Record<string, any>;

async function req(method: string, url: string, headers: Record<string, string>, body?: unknown, expect?: number): Promise<{ status: number; data: any; headers: Headers }> {
	const r = await fetch(url, { method, headers: { ...headers, ...(body === undefined ? {} : { 'content-type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body) }).catch((e) => {
		// name the call and the socket errors (a bare "fetch failed" says neither)
		const errs = (e?.cause?.errors ?? [e?.cause]).filter(Boolean).map((x: Error & { code?: string }) => x.code ?? x.message);
		throw new Error(`${method} ${url}: ${e?.message} (${errs.join(', ')})`);
	});
	const text = await r.text();
	const data = text ? JSON.parse(text) : null;
	if (expect !== undefined && r.status !== expect) throw new Error(`${method} ${url}: ${r.status} ${text.slice(0, 300)}`);
	return { status: r.status, data, headers: r.headers };
}

export class TestStore {
	tag = randomBytes(4).toString('hex');
	host = `t-${this.tag}.localhost`;
	tenantId = '';
	locationId = '';
	cookie = '';
	menu: Json = {};
	admin: string;
	constructor(admin: string) {
		this.admin = admin;
	}
	private get A() {
		return { authorization: `Bearer ${this.admin}` };
	}
	adminCall(method: string, path: string, body?: unknown, expect?: number) {
		return req(method, `${MAIN}/admin/v1${path}`, this.A, body, expect);
	}
	me(method: string, path: string, body?: unknown, expect?: number) {
		return req(method, `${MAIN}/store/v1/me${path}`, { cookie: this.cookie }, body, expect);
	}

	async create(name = `${this.tag} Test Pizza`) {
		const t = (await this.adminCall('POST', '/tenants', { slug: `t-${this.tag}`, name }, 201)).data;
		this.tenantId = t.id;
		this.locationId = t.location.id;
		const user = `mgr${this.tag}`, pass = randomBytes(9).toString('base64url');
		await this.adminCall('PATCH', `/tenants/${this.tenantId}/credentials`, { username: user, password: pass }, 204);
		const s = await req('POST', `${MAIN}/store/v1/session`, {}, { username: user, password: pass }, 200);
		this.cookie = (s.headers.get('set-cookie') ?? '').split(';')[0];
		await this.buildMenu();
		await this.adminCall('POST', `/locations/${this.locationId}/site-domains`, { host: this.host }, 201);
		await this.adminCall('PATCH', `/site-domains/${this.host}`, { verified: true }, 200);
		const chans = (await this.adminCall('GET', `/channels?location_id=${this.locationId}`, undefined, 200)).data as Json[];
		const web = chans.find((c) => c.kind === 'web' && c.builtin)!;
		await this.adminCall('PATCH', `/channels/${web.id}`, { permissions: { menu: true, quote: true, orders: true, track: true, payments: ['card', 'cash'] } }, 200);
		return this;
	}

	/** Pizza (12"/16", toppings on halves, priced per size) and Wings (a required sauce). */
	private async buildMenu() {
		const M = (m: string, p: string, b?: unknown, e?: number) => this.me(m, `/menu${p}`, b, e).then((r) => r.data);
		const printer = (await this.me('POST', '/printers', { name: 'Kitchen', ip: '10.0.0.2' }, 201)).data;
		const menu = await M('POST', '/menus', { name: 'Main' }, 201);
		const pz = await M('POST', `/menus/${menu.id}/categories`, { name: 'Pizza', default_printer_id: printer.id }, 201);
		const sd = await M('POST', `/menus/${menu.id}/categories`, { name: 'Sides', default_printer_id: printer.id }, 201);
		const pizza = await M('POST', `/categories/${pz.id}/items`, { name: 'Cheese Pizza', price_cents: 0 }, 201);
		const wings = await M('POST', `/categories/${sd.id}/items`, { name: 'Wings', price_cents: 1099 }, 201);
		const fries = await M('POST', `/categories/${sd.id}/items`, { name: 'Fries', price_cents: 399 }, 201);
		const s12 = await M('POST', '/sizes', { name: '12 Medium' }, 201);
		const s16 = await M('POST', '/sizes', { name: '16 X-Large' }, 201);
		await M('PUT', `/items/${pizza.id}/bank`, { sizes: [{ size_id: s12.id, price_cents: 1199 }, { size_id: s16.id, price_cents: 1599 }] }, 204);
		const top = await M('POST', '/modifier-groups', { name: 'Toppings', max_select: 5 }, 201);
		const pep = await M('POST', `/modifier-groups/${top.id}/options`, { name: 'Pepperoni', price_delta_cents: 150 }, 201);
		await M('PUT', `/modifier-groups/${top.id}/bank`, { portions: true, options: [{ option_id: pep.id, is_default: false, kitchen_name: '', prices: [{ size_id: s16.id, price_cents: 225 }] }] }, 204);
		await M('POST', `/items/${pizza.id}/modifier-groups`, { group_id: top.id }, 204);
		const sauce = await M('POST', '/modifier-groups', { name: 'Sauce', required: true, min_select: 1, max_select: 1 }, 201);
		const bbq = await M('POST', `/modifier-groups/${sauce.id}/options`, { name: 'BBQ', price_delta_cents: 50 }, 201);
		await M('POST', `/items/${wings.id}/modifier-groups`, { group_id: sauce.id }, 204);
		this.menu = { pizza, wings, fries, s12, s16, top, pep, sauce, bbq };
	}

	/** The fake sign-in code main logged for a phone (dev only). */
	async signinCode(phone: string): Promise<string> {
		return (await this.adminCall('GET', `/dev/signin-code?phone=${phone}`, undefined, 200)).data.code;
	}

	async destroy() {
		if (this.tenantId) {
			const r = await this.adminCall('DELETE', `/tenants/${this.tenantId}`).catch(() => null);
			if (r && ![200, 204, 404].includes(r.status)) throw new Error(`deleting test store ${this.tag}: ${r.status}`);
		}
	}
}

/** One storefront server's platform key for the run (every test store's host answers to it). */
export async function platformKey(admin: string): Promise<{ key: string; revoke: () => Promise<void> }> {
	const pk = (await req('POST', `${MAIN}/admin/v1/platform-keys`, { authorization: `Bearer ${admin}` }, { name: `storefront e2e ${randomBytes(3).toString('hex')}` }, 201)).data;
	return { key: pk.key, revoke: async () => void (await req('POST', `${MAIN}/admin/v1/platform-keys/${pk.platform_key.id}/revoke`, { authorization: `Bearer ${admin}` }).catch(() => null)) };
}
