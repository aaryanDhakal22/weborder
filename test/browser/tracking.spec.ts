// The tracking page, live: the Pi's floor events (through main) move the steps and Miso without a
// reload — received → accepted (kitchen #) → ready → out with the driver's first name → done;
// cancelled; the install sheet; another store's or an unknown link is a 404.
import { test, expect, miso, apiOrder } from './fixtures.ts';
import { floor } from './api.ts';

test('pickup: received → accepted (#) → ready → picked up, live', async ({ page, go, shop }) => {
	await go('/');
	const o = await apiOrder(page, shop);
	await go(`/order/${o.track_token}`);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText("Thanks, we're on it");
	const hero = page.locator('.track-hero');
	await expect(miso(hero, 'received')).toBeVisible();
	await expect(hero.locator('.kitchen-no')).toHaveText('Your order—');
	await expect(hero.locator('.eta')).toHaveText('Waiting for the kitchen to accept it.');
	const steps = page.locator('.stages .stage');
	await expect(steps.locator('.l1')).toHaveText(['Order received', 'Accepted', 'Ready for pickup', 'Picked up']);
	await expect(steps.nth(0)).toHaveClass(/\bnow\b/);
	await expect(steps.nth(0).locator('.l2')).toHaveText('Sent to the kitchen');
	await expect(page).toHaveTitle(/^Your order · Test Pizza$/);

	const ready = new Date(Date.now() + 20 * 60_000).toISOString();
	await floor(shop, o.id, 'accepted', { kitchen_number: 1101, estimated_ready_at: ready });
	await expect(miso(hero, 'cooking')).toBeVisible();
	await expect(hero.locator('.kitchen-no')).toHaveText('Your order#1101');
	await expect(hero.locator('.eta')).toContainText('Ready at');
	await expect(steps.nth(0)).toHaveClass(/\bdone\b/);
	await expect(steps.nth(1)).toHaveClass(/\bnow\b/);
	await expect(steps.nth(1).locator('.l2')).toHaveText('Kitchen #1101');
	await expect(page).toHaveTitle(/#1101/);

	await floor(shop, o.id, 'ready');
	await expect(miso(hero, 'ready')).toBeVisible();
	await expect(steps.nth(2)).toHaveClass(/\bnow\b/);
	await expect(steps.nth(2).locator('.l2')).toHaveText('Come to the counter');

	await floor(shop, o.id, 'delivered');
	await expect(miso(hero, 'done')).toBeVisible();
	await expect(hero.locator('.eta')).toHaveText('Picked up');
	await expect(steps.locator('.dot svg')).toHaveCount(4);
	// a finished order opens finished (no live feed needed)
	await page.reload();
	await expect(miso(hero, 'done')).toBeVisible();
});

test('delivery: out with the driver\'s first name, then delivered', async ({ page, go, shop }) => {
	await go('/');
	const o = await apiOrder(page, shop, { type: 'delivery', address: { line1: '1 Main St', line2: '', city: 'Towson', state: 'MD', zip: '21204', notes: '' } });
	await go(`/order/${o.track_token}`);
	const steps = page.locator('.stages .stage');
	await expect(steps.locator('.l1')).toHaveText(['Order received', 'Accepted', 'Ready', 'Out for delivery', 'Delivered']);
	await floor(shop, o.id, 'accepted', { kitchen_number: 1102 });
	await expect(steps.nth(1).locator('.l2')).toHaveText('Kitchen #1102');
	// accepted without an estimate: no time to show, and no "waiting for the kitchen" any more
	await expect(page.locator('.track-hero .eta')).toHaveCount(0);
	await floor(shop, o.id, 'accepted', { kitchen_number: 1102, estimated_ready_at: new Date(Date.now() + 30 * 60_000).toISOString() });
	await floor(shop, o.id, 'ready');
	await expect(steps.nth(2).locator('.l2')).toHaveText('Waiting for a driver');
	await floor(shop, o.id, 'on_delivery', { driver_name: 'Sam Smith' });
	const hero = page.locator('.track-hero');
	await expect(miso(hero, 'out')).toBeVisible();
	await expect(hero.locator('.driver')).toHaveText('Sam is on the way');
	await expect(steps.nth(3).locator('.l2')).toHaveText('Sam is on the way');
	await expect(hero.locator('.eta')).toContainText('Arrives around');
	await floor(shop, o.id, 'delivered');
	await expect(hero.locator('.eta')).toHaveText('Delivered');
	await expect(hero.locator('.driver')).toHaveCount(0);
});

test('cancelled: the cancelled title, Miso lost, no steps', async ({ page, go, shop }) => {
	await go('/');
	const o = await apiOrder(page, shop);
	await go(`/order/${o.track_token}`);
	await floor(shop, o.id, 'cancelled');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Order cancelled');
	await expect(page.locator('.track-hero .eta')).toHaveText('This order was cancelled. Any card hold is released.');
	await expect(miso(page.locator('.track-hero'), 'lost')).toBeVisible();
	await expect(page.locator('.stages')).toHaveCount(0);
});

test('install: Show me opens the steps, Got it and Back close them', async ({ page, go, shop }) => {
	await go('/');
	const o = await apiOrder(page, shop);
	await go(`/order/${o.track_token}`);
	const card = page.locator('.install');
	await expect(card).toContainText('Put Test Pizza on your Home Screen');
	await card.getByRole('button', { name: 'Show me' }).click();
	const sheet = page.getByRole('dialog', { name: 'Test Pizza on your phone' });
	await expect(sheet).toBeVisible();
	await expect(sheet.locator('.steps li')).toHaveCount(2);
	await expect(sheet).toContainText('Tap Share');
	await expect(miso(sheet, 'wave')).toBeVisible();
	await sheet.getByRole('button', { name: 'Got it' }).click();
	await expect(sheet).toBeHidden();
	await card.getByRole('button', { name: 'Show me' }).click();
	await expect(sheet).toBeVisible();
	await page.goBack();
	await expect(sheet).toBeHidden();
	await expect(page.getByText('Keep this page: it updates by itself.')).toBeVisible();
});

test('an unknown link, or another store\'s order, is a 404', async ({ page, go, shop, freshStore, visit }) => {
	await go('/order/not-a-real-token-123');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Miso got lost in the menu');
	await go('/');
	const o = await apiOrder(page, shop);
	const other = await freshStore();
	const r = await page.request.get(page.url().replace(shop.host, other.host) + `order/${o.track_token}`);
	expect(r.status()).toBe(404);
	await visit(other, `/order/${o.track_token}`);
	await expect(miso(page, 'lost')).toBeVisible();
});

test('Spanish tracking', async ({ page, go, shop }) => {
	await go('/');
	const o = await apiOrder(page, shop);
	await go(`/es/order/${o.track_token}`);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Gracias, ya lo estamos haciendo');
	await expect(page.locator('.stages .l1').first()).toHaveText('Pedido recibido');
	await expect(page.locator('.track-hero .eta')).toHaveText('Esperando que la cocina lo acepte.');
});
