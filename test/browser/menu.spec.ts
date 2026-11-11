// The menu page: categories bar, the list (default), opening an item in the sheet (bottom on phones,
// a side panel on wide screens) with its own URL, Escape / scrim / back to close, the order panel,
// sold out, and the other layouts (tiles, printed).
import { test, expect, cartButton, publishLook } from './fixtures.ts';
import { soldOut } from './api.ts';

test('categories bar, list rows with from-prices, JSON-LD', async ({ page, go, isMobile }) => {
	await go('/menu');
	const bar = page.locator('nav.catbar');
	await expect(bar.getByRole('link')).toHaveText(['Pizza', 'Sides']);
	await expect(bar.locator('.chip.on')).toHaveCount(1); // the category in view
	await expect(page.locator('#pizza .row')).toHaveCount(1);
	await expect(page.locator('#sides .row')).toHaveCount(2);
	await expect(page.locator('#pizza .cat-title')).toContainText('1 items');
	const pizzaRow = page.locator('#pizza .row').first();
	await expect(pizzaRow).toContainText('Cheese Pizza');
	await expect(pizzaRow.locator('.pr')).toHaveText('from$11.99');
	if (isMobile) await expect(pizzaRow.locator('.sizes')).toBeHidden();
	else await expect(pizzaRow.locator('.sizes')).toContainText('$15.99');
	await expect(page.locator('#sides .row').nth(0)).toContainText('$10.99');
	await expect(page.locator('#sides .row').nth(1)).toContainText('Fries');
	await bar.getByRole('link', { name: 'Sides' }).click();
	await expect(page).toHaveURL(/#sides$/);
	await expect(page.locator('#sides')).toBeInViewport();
	await expect(bar.getByRole('link', { name: 'Sides' })).toHaveClass(/\bon\b/);
	expect(await page.locator('script[type="application/ld+json"]').nth(1).textContent()).toContain('"@type":"Menu"');
});

test('an item opens in the sheet with its own URL; Escape, the scrim, ✕ and Back close it', async ({ page, go, isMobile }) => {
	await go('/menu');
	const sheet = page.getByRole('dialog', { name: 'Cheese Pizza' });
	await page.locator('#pizza .row').first().click();
	await expect(sheet).toBeVisible();
	await expect(page).toHaveURL(/\/menu\/cheese-pizza$/);
	// a bottom sheet on phones, a side panel on wide screens
	const box = (await sheet.boundingBox())!;
	const vp = page.viewportSize()!;
	if (isMobile) {
		expect(Math.round(box.y + box.height)).toBeGreaterThanOrEqual(vp.height - 2);
		expect(box.x).toBeLessThanOrEqual(1);
	} else {
		expect(Math.round(box.x + box.width)).toBeGreaterThanOrEqual(vp.width - 2);
		expect(box.y).toBeLessThanOrEqual(1);
		expect(box.height).toBeGreaterThanOrEqual(vp.height - 2);
	}
	await page.keyboard.press('Escape');
	await expect(sheet).toBeHidden();
	await expect(page).toHaveURL(/\/menu$/);

	await page.locator('#pizza .row').first().click();
	await expect(sheet).toBeVisible();
	await sheet.getByRole('button', { name: 'Close' }).click();
	await expect(sheet).toBeHidden();

	await page.locator('#sides .row').first().click();
	const wings = page.getByRole('dialog', { name: 'Wings' });
	await expect(wings).toBeVisible();
	await page.locator('.scrim').click({ position: { x: 5, y: 5 } });
	await expect(wings).toBeHidden();

	await page.locator('#sides .row').nth(1).click();
	await expect(page.getByRole('dialog', { name: 'Fries' })).toBeVisible();
	await page.goBack();
	await expect(page.getByRole('dialog', { name: 'Fries' })).toBeHidden();
	await expect(page).toHaveURL(/\/menu$/);
	// a modified click still opens the item's own page (no sheet)
	await page.goto(page.url() + '/fries');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Fries');
});

test('adding from the sheet: toast, cart count, the order panel (wide) / the cart bar (phones)', async ({ page, go, isMobile }) => {
	await go('/menu');
	await page.locator('#sides .row').nth(1).click();
	const sheet = page.getByRole('dialog', { name: 'Fries' });
	await sheet.getByRole('button', { name: /Add to order/ }).click();
	await expect(sheet).toBeHidden();
	await expect(page.getByRole('status').filter({ hasText: 'Added: Fries' })).toBeVisible();
	await expect(cartButton(page)).toHaveAttribute('aria-label', 'Cart, 1');
	if (isMobile) {
		const bar = page.locator('.cartbar');
		await expect(bar).toContainText('View order');
		await expect(bar).toContainText('$3.99');
		await bar.getByRole('link').click();
		await expect(page).toHaveURL(/\/cart$/);
	} else {
		const panel = page.getByRole('complementary', { name: 'Your order' });
		await expect(panel).toContainText('1 items');
		await expect(panel.locator('.line')).toContainText('Fries');
		await expect(panel.locator('.totals')).toContainText('$3.99');
		await panel.getByRole('link', { name: 'Edit' }).click();
		await expect(page).toHaveURL(/\/cart$/);
		await page.goBack();
		await panel.getByRole('link', { name: /Checkout/ }).click();
		await expect(page).toHaveURL(/\/checkout$/);
	}
});

test('the order panel is empty to start (wide screens)', async ({ page, go, isMobile }) => {
	test.skip(isMobile, 'the panel shows from 1200 px');
	await go('/menu');
	const panel = page.getByRole('complementary', { name: 'Your order' });
	await expect(panel).toContainText('Nothing in it yet. Start with the menu.');
	await expect(panel.getByRole('link', { name: /Checkout/ })).toHaveCount(0);
});

test('sold out from the Pi: the row is marked and the item can\'t be added', async ({ page, freshStore, visit }) => {
	const s = await freshStore();
	await soldOut(s, 'item', s.menu.wings.id);
	await soldOut(s, 'option', s.menu.pep.id);
	await visit(s, '/menu');
	const row = page.locator('#sides .row').first();
	await expect(row).toHaveClass(/\bsold\b/);
	await expect(row).toContainText('Sold out');
	await row.click();
	const sheet = page.getByRole('dialog', { name: 'Wings' });
	await expect(sheet.locator('.sheet-foot .btn-p')).toBeDisabled();
	await expect(sheet.locator('.sheet-foot .btn-p')).toHaveText('Sold out');
	await page.keyboard.press('Escape');
	// a sold-out option is greyed and can't be picked
	await page.locator('#pizza .row').first().click();
	const pep = page.getByRole('checkbox', { name: /Pepperoni/ });
	await expect(pep).toBeDisabled();
	await expect(pep).toContainText('Sold out');
});

test('menu layouts: tiles (photo) and printed, from the Website settings', async ({ page, freshStore, visit }) => {
	const tiles = await freshStore();
	await publishLook(tiles, { menu_layout: 'photo' });
	await visit(tiles, '/menu');
	await expect(page.locator('#pizza .pcard')).toHaveCount(1);
	await expect(page.locator('#pizza .pcard')).toContainText('from $11.99');
	await page.locator('#sides .pcard').first().click();
	await expect(page.getByRole('dialog', { name: 'Wings' })).toBeVisible();

	const printed = await freshStore();
	await publishLook(printed, { menu_layout: 'printed' });
	await visit(printed, '/menu');
	await expect(page.locator('.printed #pizza .p-item')).toHaveCount(1);
	await expect(page.locator('.printed #sides .p-item')).toHaveText([/Wings.*\$10\.99/, /Fries.*\$3\.99/]);
	await page.locator('.printed #sides .p-item').nth(1).click();
	await expect(page.getByRole('dialog', { name: 'Fries' })).toBeVisible();
});
