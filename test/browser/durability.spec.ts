// Ordering durability on the page (DURABILITY-PLAN.md): "Still confirming" while main hasn't
// answered (it survives a reload and ends on the tracking page), "Not placed — you weren't charged"
// (then a new key for the next attempt), and the kitchen-offline bar + checkout banner.
import type { Page, Request } from '@playwright/test';
import { test, expect, miso, dynamic, addFromItemPage, pizza16PepLeft, wingsBbq, reloadUntil } from './fixtures.ts';
import { connectFakeSquare, deviceKey, piOnline } from './api.ts';

const place = (page: Page) => page.getByRole('button', { name: /Place order/ }).filter({ visible: true });

async function readyToPlace(page: Page, url: (p: string) => string) {
	await addFromItemPage(page, url('/menu/cheese-pizza'), pizza16PepLeft);
	await addFromItemPage(page, url('/menu/wings'), wingsBbq);
	await page.goto(url('/checkout'));
	await expect(page.locator('.summary .totals')).toBeVisible();
	await page.getByRole('radio', { name: 'Pickup', exact: true }).last().click();
	await page.getByLabel('Name').fill('Ada Lovelace');
	await page.getByLabel('Phone (we call if something is wrong)').fill('(410) 555-0101');
}

const keyOf = (r: Request) => (r.postDataJSON() as { client_order_id: string }).client_order_id;

test('main answers after the page stops waiting: Still confirming, kept over a reload, then the tracking page', async ({ page, freshStore, site }) => {
	test.setTimeout(90_000);
	const s = await freshStore();
	await connectFakeSquare(s);
	await readyToPlace(page, (p) => site.url(s, p));
	await page.getByLabel('Test card (fake Square)').selectOption({ label: 'Visa 4111 · approved (tip can be raised)' });
	// main's slow test card (9 s) outlasts the test server's 6 s wait (ORDER_WAIT_MS)
	await page.route('**/api/orders', async (route) => {
		const b = route.request().postDataJSON();
		await route.continue({ postData: JSON.stringify({ ...b, payment: { ...b.payment, token: 'cnon:card-nonce-slow-9' } }) });
	});
	await place(page).click();
	const confirming = page.getByRole('heading', { name: 'Still confirming your order' });
	await expect(confirming).toBeVisible({ timeout: 15_000 });
	await expect(page.getByText("Don't place it again")).toBeVisible();
	await expect(miso(page, 'loading')).toBeVisible();
	await expect(place(page)).toHaveCount(0);
	await page.reload(); // the cart remembers the key: still confirming, never a second order
	await expect(confirming).toBeVisible();
	await expect(page).toHaveURL(/\/order\//, { timeout: 40_000 });
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test("not placed: nothing charged, back to checkout, and the next attempt is a new order (a new key)", async ({ page, site, shop }) => {
	await readyToPlace(page, (p) => site.url(shop, p));
	await page.getByRole('radio', { name: 'Pay at pickup' }).click();
	const keys: string[] = [];
	let answer: 'pending' | 'real' = 'pending';
	await page.route('**/api/orders', async (route) => {
		keys.push(keyOf(route.request()));
		if (answer === 'pending') return route.fulfill({ status: 202, json: { state: 'pending', client_order_id: keys.at(-1) } });
		return route.continue();
	});
	await page.route('**/api/orders/by-key/*', (route) =>
		route.fulfill({ json: { state: 'expired', error: { code: 'expired', message: "We couldn't reach the restaurant in time. Your order wasn't placed and your card wasn't charged." } } })
	);
	await place(page).click();
	const notPlaced = page.getByRole('heading', { name: "Not placed — you weren't charged" });
	await expect(notPlaced).toBeVisible({ timeout: 15_000 });
	await expect(page.getByText("We couldn't reach the restaurant in time.")).toBeVisible();
	await expect(miso(page, 'lost')).toBeVisible();
	await page.getByRole('button', { name: 'Back to checkout' }).click();
	await expect(place(page)).toBeVisible();
	answer = 'real';
	await place(page).click();
	await expect(page).toHaveURL(/\/order\//);
	expect(keys).toHaveLength(2);
	expect(keys[1]).not.toBe(keys[0]);
});

test('a final refusal renews the key; an unanswered attempt keeps it', async ({ page, site, shop }) => {
	await readyToPlace(page, (p) => site.url(shop, p));
	await page.getByRole('radio', { name: 'Pay at pickup' }).click();
	const keys: string[] = [];
	let mode: 'drop' | 'refuse' | 'real' = 'drop';
	await page.route('**/api/orders', async (route) => {
		keys.push(keyOf(route.request()));
		if (mode === 'drop') return route.abort('connectionreset'); // the browser never hears back
		if (mode === 'refuse') return route.fulfill({ status: 409, json: { code: 'price_changed', error: 'Prices changed — refresh and check your order.' } });
		return route.continue();
	});
	await page.route('**/api/orders/by-key/*', (route) => route.fulfill({ status: 404, json: { code: 'unknown_key' } }));
	await place(page).click();
	await expect(page.locator('#failure')).toBeVisible();
	mode = 'refuse';
	await place(page).click();
	await expect(page.locator('#failure')).toContainText('Prices changed');
	mode = 'real';
	await place(page).click();
	await expect(page).toHaveURL(/\/order\//);
	expect(keys).toHaveLength(3);
	expect(keys[1]).toBe(keys[0]); // the dropped attempt's key, asked about first, then sent again
	expect(keys[2]).not.toBe(keys[1]); // after the refusal: a new order
});

test('the kitchen is offline: the bar, the checkout banner, no ASAP; back when the Pi is', async ({ page, freshStore, site }) => {
	const s = await freshStore();
	await deviceKey(s, { stream: false }); // a Pi is set up and isn't connected
	await page.goto(site.url(s, '/'));
	const bar = page.locator('.statusbar');
	// main counts a Pi away 30 s after its stream closed, or after main started for a store it never saw:
	// a main air just rebuilt after a sync (any main change on a gate stack) needs up to 30 s more, and the
	// storefront re-reads a store's status at most every 10 s (the e2e test waits the same way)
	await reloadUntil(page, async () => ((await bar.textContent()) ?? '').includes("The kitchen can't take online orders right now"), 50_000);
	await expect(bar).toContainText("The kitchen can't take online orders right now");
	await readyToPlace(page, (p) => site.url(s, p));
	const banner = page.locator('.kitchen-off');
	await expect(banner).toContainText('The kitchen is offline.');
	await expect(banner).toContainText('You can still order for later');
	await expect(page.getByRole('radio', { name: /ASAP/ })).toBeDisabled();
	await expect(page.getByRole('radio', { name: 'Schedule' })).toHaveAttribute('aria-checked', 'true');
	// only times an hour or more away are offered (main refuses sooner ones while the kitchen is offline)
	const times = await page.getByLabel('Choose a time').locator('option').evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
	for (const t of times) expect(Date.parse(t)).toBeGreaterThanOrEqual(Date.now() + 3600_000 - 60_000);
	await expect(place(page)).toBeEnabled(); // a later order is still taken
	// from the top: the sticky header and the floating Place order bar follow the scroll, and the steps
	// above leave it wherever their last click did (17 px apart between machines)
	await page.evaluate(() => window.scrollTo(0, 0));
	await expect(page).toHaveScreenshot('checkout-kitchen-offline.png', { fullPage: true, mask: dynamic(page) });
	await piOnline(s);
	await reloadUntil(page, async () => (await banner.count()) === 0, 20_000);
	await expect(page.getByRole('radio', { name: /ASAP/ })).toBeEnabled();
	await page.getByRole('radio', { name: /ASAP/ }).click();
	await expect(place(page)).toBeEnabled();
});

test('screenshots: Still confirming and Not placed', async ({ page, site, shop }) => {
	await readyToPlace(page, (p) => site.url(shop, p));
	await page.getByRole('radio', { name: 'Pay at pickup' }).click();
	let state = 'pending';
	await page.route('**/api/orders', (route) => route.fulfill({ status: 202, json: { state: 'pending', client_order_id: keyOf(route.request()) } }));
	await page.route('**/api/orders/by-key/*', (route) =>
		route.fulfill({ json: state === 'pending' ? { state: 'pending' } : { state: 'voided', error: { code: 'voided', message: "We couldn't finish your order, so the hold on your card was released." } } })
	);
	await place(page).click();
	await expect(page.getByRole('heading', { name: 'Still confirming your order' })).toBeVisible();
	await page.evaluate(() => document.fonts.ready);
	await expect(page).toHaveScreenshot('still-confirming.png', { fullPage: true, mask: dynamic(page) });
	state = 'voided';
	await expect(page.getByRole('heading', { name: "Not placed — you weren't charged" })).toBeVisible({ timeout: 10_000 });
	await expect(page).toHaveScreenshot('not-placed.png', { fullPage: true, mask: dynamic(page) });
});
