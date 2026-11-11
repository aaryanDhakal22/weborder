// The cart: empty state (Miso), lines priced by main's quote, quantity steppers and remove,
// delivery / pickup, "Goes well with", deals applied, line errors from main, on to checkout.
import { test, expect, cartButton, miso, addFromItemPage, pizza16PepLeft, wingsBbq, publishLook } from './fixtures.ts';
import { addDeals, soldOut } from './api.ts';

test('empty cart: Miso, Browse the menu; back goes to the menu', async ({ page, go }) => {
	await go('/cart');
	await expect(page.getByRole('heading', { name: 'Your order is empty' })).toBeVisible();
	await expect(miso(page, 'empty-cart')).toBeVisible();
	await expect(page.locator('.backbar .muted')).toHaveText('0 items');
	await page.getByRole('link', { name: 'Browse the menu' }).click();
	await expect(page).toHaveURL(/\/menu$/);
	await go('/cart');
	await page.getByRole('link', { name: 'Back' }).click();
	await expect(page).toHaveURL(/\/menu$/);
});

test('empty cart with deals offers them first; no Miso when the store turns cart Miso off', async ({ page, freshStore, visit }) => {
	const s = await freshStore();
	await addDeals(s);
	await publishLook(s, { miso_pages: false });
	await visit(s, '/cart');
	await expect(page.getByRole('heading', { name: 'Your order is empty' })).toBeVisible();
	await expect(miso(page, 'empty-cart')).toHaveCount(0);
	await expect(page.locator('.state .actions a')).toHaveText(['See deals', 'Browse the menu']);
	await page.getByRole('link', { name: 'See deals' }).click();
	await expect(page).toHaveURL(/\/deals$/);
});

test('lines, main\'s prices, steppers, remove, suggestions, delivery / pickup, checkout', async ({ page, site, shop, isMobile }) => {
	await addFromItemPage(page, site.url(shop, '/menu/cheese-pizza'), pizza16PepLeft);
	await addFromItemPage(page, site.url(shop, '/menu/wings'), wingsBbq);
	await cartButton(page).click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your order');
	await expect(page.locator('.backbar .muted')).toHaveText('2 items');
	const lines = page.locator('.lines .line');
	await expect(lines).toHaveCount(2);
	await expect(lines.nth(0)).toContainText('Cheese Pizza');
	await expect(lines.nth(0).locator('.pr')).toHaveText('$18.24');
	await expect(lines.nth(1)).toContainText('Wings');
	await expect(lines.nth(1).locator('.mods')).toContainText('BBQ');
	await expect(lines.nth(1).locator('.pr')).toHaveText('$11.49');
	const totals = page.locator('.totals');
	await expect(totals).toContainText('Subtotal$29.73');

	// steppers: one more wings, then back, then remove the pizza (trash at 1)
	await lines.nth(1).getByRole('button', { name: 'One more' }).click();
	await expect(lines.nth(1).locator('.stepper b')).toHaveText('2');
	await expect(lines.nth(1).locator('.pr')).toHaveText('$22.98');
	await expect(totals).toContainText('Subtotal$41.22');
	await expect(cartButton(page)).toHaveAttribute('aria-label', 'Cart, 3');
	await lines.nth(1).getByRole('button', { name: 'One less' }).click();
	await expect(lines.nth(1).locator('.stepper b')).toHaveText('1');
	await expect(lines.nth(0).getByRole('button', { name: 'Remove' })).toBeVisible();
	await lines.nth(0).getByRole('button', { name: 'Remove' }).click();
	await expect(lines).toHaveCount(1);
	await expect(lines.nth(0)).toContainText('Wings');

	// goes well with: fries (quick sides only; wings need a sauce)
	const sugg = page.locator('.sugg-wrap');
	await expect(sugg).toContainText('Goes well with');
	await expect(sugg.locator('.nm')).toHaveText(['Fries']);
	await sugg.getByRole('button', { name: 'Add Fries' }).click();
	await expect(lines).toHaveCount(2);
	await expect(lines.nth(1)).toContainText('Fries');
	await expect(sugg).toHaveCount(0); // nothing left to suggest
	await expect(totals).toContainText('Subtotal$15.48');

	// delivery / pickup
	const seg = page.getByRole('radiogroup', { name: 'Delivery / Pickup' }).last();
	await seg.getByRole('radio', { name: 'Pickup' }).click();
	await expect(seg.getByRole('radio', { name: 'Pickup' })).toHaveAttribute('aria-checked', 'true');
	await seg.getByRole('radio', { name: 'Delivery' }).click();
	await expect(seg.getByRole('radio', { name: 'Delivery' })).toHaveAttribute('aria-checked', 'true');

	// on to checkout (a bar at the bottom on phones, a button under the totals on wide screens)
	const go = isMobile ? page.locator('.placebar a') : page.locator('a.go');
	await expect(go).toContainText('Go to checkout');
	await expect(go).toContainText('$15.48');
	await go.click();
	await expect(page).toHaveURL(/\/checkout$/);
	// the cart survives a reload (kept in the browser)
	await page.reload();
	await expect(page.locator('.summary .line')).toHaveCount(2);
});

test('deals in the cart: the discount line, the savings note, checkout total after deals', async ({ page, freshStore, site, isMobile }) => {
	const s = await freshStore();
	await addDeals(s);
	await addFromItemPage(page, site.url(s, '/menu/wings'), async (p) => {
		await wingsBbq(p);
		await p.getByRole('button', { name: 'One more' }).click();
	});
	await page.goto(site.url(s, '/cart'));
	const disc = page.locator('.totals .disc');
	await expect(disc).toContainText('2nd wings half off');
	await expect(disc).toContainText('−$5.75');
	await expect(page.locator('.totals .note')).toHaveText('Deals saved you $5.75');
	await expect(isMobile ? page.locator('.placebar a') : page.locator('a.go')).toContainText('$17.23');
});

test('a line main refuses (sold out after it was added) shows main\'s reason', async ({ page, freshStore, site }) => {
	const s = await freshStore();
	await addFromItemPage(page, site.url(s, '/menu/fries'));
	await soldOut(s, 'item', s.menu.fries.id);
	await page.goto(site.url(s, '/cart'));
	await expect(page.locator('.lines .line .err')).not.toHaveText('');
	await expect(page.locator('.lines .line .err')).toBeVisible();
});

test('Spanish cart', async ({ page, site, shop }) => {
	await addFromItemPage(page, site.url(shop, '/menu/fries'));
	await page.goto(site.url(shop, '/es/cart'));
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tu pedido');
	await expect(page.locator('.totals')).toContainText('Subtotal');
	await expect(page.locator('.sugg-wrap')).toHaveCount(0);
	await expect(page.getByRole('link', { name: /Ir a pagar/ }).first()).toBeAttached();
});
