// Playwright fixtures: per worker, one throwaway store on main (test/e2e/main.ts), one platform key
// and one storefront server (the production build) on a free port. Pages open at
// http://<store host>:<port>/ — Chromium resolves *.localhost to 127.0.0.1 by itself.
// Tests that change the store's settings or state use `freshStore()` (their own store, deleted
// after the test) so the worker's shared store stays as created.
import { test as base, expect, type Locator, type Page } from '@playwright/test';
import { MAIN, TestStore, adminKey, mainUp, platformKey } from '../e2e/main.ts';
import { TestServer } from '../e2e/server.ts';
import { piOffline } from './api.ts';

export { expect };

type Json = Record<string, any>;

export interface Site {
	srv: TestServer;
	/** The store's origin on the test server. */
	url(store: TestStore, path?: string): string;
}

const admin = adminKey();

type WorkerFixtures = { site: Site; shop: TestStore };
type TestFixtures = {
	/** A store of the test's own (deleted afterwards). */
	freshStore: (name?: string) => Promise<TestStore>;
	/** Opens a path on the worker's shared store. */
	go: (path?: string) => Promise<void>;
	/** Opens a path on any store (a `freshStore()` one). */
	visit: (store: TestStore, path?: string) => Promise<void>;
	/** A random customer IP for this test (main's sign-in limits are per IP and outlive runs). */
	customerIp: string;
};

export const test = base.extend<TestFixtures, WorkerFixtures>({
	site: [
		async ({}, use) => {
			test.skip(!admin || !(await mainUp()), `main isn't reachable at ${MAIN} (or no admin key)`);
			const pk = await platformKey(admin);
			const srv = new TestServer();
			// TRUST_PROXY: each test names its own customer IP. REFRESH_SECONDS=1: a published change
			// shows within a second or two. ORDER_WAIT_MS=6000: main's slow test card (9 s) outlasts
			// the page's wait, so "Still confirming" can be reached (durability.spec.ts).
			await srv.start({ MAIN_URL: MAIN, PLATFORM_KEY: pk.key, TRUST_PROXY: '1', REFRESH_SECONDS: '1', ORDER_WAIT_MS: '6000' });
			await use({ srv, url: (s, path = '/') => `http://${s.host}:${srv.port}${path}` });
			srv.stop();
			await pk.revoke();
		},
		{ scope: 'worker', timeout: 60_000 }
	],
	shop: [
		async ({ site }, use) => {
			void site;
			const s = await new TestStore(admin).create('Test Pizza');
			await use(s);
			piOffline(s);
			await s.destroy();
		},
		{ scope: 'worker', timeout: 60_000 }
	],
	customerIp: async ({}, use) => {
		await use(`10.${(Math.random() * 255) | 0}.${(Math.random() * 255) | 0}.${1 + ((Math.random() * 250) | 0)}`);
	},
	page: async ({ page, customerIp }, use) => {
		await page.setExtraHTTPHeaders({ 'x-forwarded-for': customerIp });
		const errors: string[] = [];
		page.on('pageerror', (e) => errors.push(String(e)));
		await use(page);
		expect(errors, 'uncaught errors in the page').toEqual([]);
	},
	go: async ({ page, site, shop }, use) => {
		await use(async (path = '/') => {
			await page.goto(site.url(shop, path));
		});
	},
	visit: async ({ page, site }, use) => {
		await use(async (store, path = '/') => {
			await page.goto(site.url(store, path));
		});
	},
	freshStore: async ({ site }, use) => {
		void site;
		const made: TestStore[] = [];
		await use(async (name = 'Test Pizza') => {
			const s = await new TestStore(admin).create(name);
			made.push(s);
			return s;
		});
		made.forEach(piOffline);
		await Promise.allSettled(made.map((s) => s.destroy()));
	}
});

/** Publishes a settings document on a store through main's Website API, as its manager would. */
export async function publishLook(s: TestStore, look: Json) {
	await s.me('PUT', '/site/website/draft', look, 200);
	await s.me('POST', '/site/website/publish', undefined, 200);
}

/** Waits until the storefront serves the store's newest published version. */
export async function reloadUntil(page: Page, check: () => Promise<boolean>, ms = 8000) {
	const end = Date.now() + ms;
	for (;;) {
		await page.reload();
		if (await check()) return;
		if (Date.now() > end) throw new Error('the storefront never showed the change');
		await page.waitForTimeout(400); // polling main's refresh; not a fixed wait for an outcome
	}
}

/** A Miso scene on the page (`svg.miso-<scene>`, from prepare()). */
export const miso = (scope: Page | Locator, scene: string) => scope.locator(`svg.miso-${scene}`);

/** The header's cart button ("Cart, n"). */
export const cartButton = (page: Page) => page.locator('header a.cartbtn');

/**
 * Adds an item from its own page (/menu/<slug>): `pick` sets it up first. The page goes back to the
 * menu once it's in the cart.
 */
export async function addFromItemPage(page: Page, url: string, pick: (p: Page) => Promise<void> = async () => {}) {
	await page.goto(url);
	await pick(page);
	await page.getByRole('button', { name: /Add to order/ }).click();
	await page.waitForURL(/\/menu(#|$)/);
}

/** A 16" Cheese Pizza with Pepperoni on the left half ($15.99 + $2.25). */
export async function pizza16PepLeft(page: Page) {
	await page.getByRole('radiogroup', { name: 'Size' }).getByRole('radio', { name: /16/ }).click();
	await page.getByRole('checkbox', { name: /Pepperoni/ }).click();
	await page.getByRole('radio', { name: 'Left half' }).click();
}

/** Wings with BBQ sauce. */
export async function wingsBbq(page: Page) {
	await page.getByRole('radio', { name: /BBQ/ }).click();
}

/** Masks for anything that changes between runs: times, dates, ETAs, numbers from main, phones. */
export function dynamic(page: Page): Locator[] {
	return [page.locator('.hours'), page.locator('.tm'), page.locator('.track-hero .eta'), page.locator('.kitchen-no'), page.locator('[data-mask]')];
}

/** A fresh US phone number no other test uses. */
export const newPhone = () => '410' + String(1000000 + Math.floor(Math.random() * 8999999));

/** Signs the page's browser in as a new customer (through the storefront's API, like the page does). */
export async function signIn(page: Page, store: TestStore, ip: string, name = 'Grace Hopper'): Promise<string> {
	const origin = new URL(page.url()).origin;
	const phone = newPhone();
	const h = { origin, 'x-forwarded-for': ip };
	expect((await page.request.post(`${origin}/api/account/code`, { data: { phone }, headers: h })).status()).toBe(202);
	const code = await store.signinCode(phone);
	expect((await page.request.post(`${origin}/api/account/verify`, { data: { phone, code, name }, headers: h })).status()).toBe(200);
	return phone;
}

/** Places an order through the storefront's API (cash pickup unless told otherwise); signed-in pages' orders join the account. */
export async function apiOrder(page: Page, store: TestStore, extra: Json = {}): Promise<Json> {
	const origin = new URL(page.url()).origin;
	const m = store.menu;
	const body = {
		client_order_id: `pw-${Math.random().toString(36).slice(2, 12)}`,
		type: 'pickup',
		lines: [
			{ item_id: m.pizza.id, size_id: m.s16.id, qty: 1, options: [{ group_id: m.top.id, option_id: m.pep.id, portion: 'left' }] },
			{ item_id: m.wings.id, qty: 2, options: [{ group_id: m.sauce.id, option_id: m.bbq.id }] }
		],
		payment: { method: 'cash' },
		customer: { name: 'Ada Lovelace', phone: '(410) 555-0101' },
		promised_at: null,
		...extra
	};
	const r = await page.request.post(`${origin}/api/orders`, { data: body, headers: { origin } });
	expect(r.status(), await r.text()).toBe(201);
	return r.json();
}
