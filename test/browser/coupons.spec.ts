// Coupons on the website (the owner, 2026-11-12: coupons work everywhere, applied the same way as the
// counter): the cart lists the coupons the order fully fits (main's coupon_offers); Apply re-prices its
// lines (the lines show the coupon prices, Subtotal = the lines, no discount row, no "saved"); the
// applied coupon can be removed; checkout sends it, and a line change that breaks it takes it off.
import { test, expect, addFromItemPage, pizza16PepLeft, wingsBbq } from './fixtures.ts';
import { addCoupon } from './api.ts';

test('a coupon in the cart: offered, applied (lines re-priced, no discount row), removed, sent at checkout', async ({ page, freshStore, site, isMobile }, info) => {
	const s = await freshStore();
	await addCoupon(s); // 16" Pizza + Wings $19.99
	await addFromItemPage(page, site.url(s, '/menu/cheese-pizza'), pizza16PepLeft); // $15.99 + $2.25 (no family: charged)
	await addFromItemPage(page, site.url(s, '/menu/wings'), wingsBbq); // $10.99 + $0.50
	await page.goto(site.url(s, '/cart'));

	const offer = page.getByTestId('coupon-offer');
	await expect(offer).toHaveCount(1);
	await expect(offer).toContainText('16" Pizza + Wings');
	await expect(offer).toContainText('16" pizza · Wings');
	await expect(offer).toContainText('$19.99');
	await expect(page.locator('.totals')).toContainText('$29.73'); // the lines at their own prices
	await offer.getByRole('button', { name: 'Apply' }).click();

	const applied = page.getByTestId('coupon-applied');
	await expect(applied).toHaveCount(1);
	await expect(page.getByTestId('coupon-offer')).toHaveCount(0);
	// the pizza carries the coupon price + its charged half pepperoni; the wings $0 + their sauce
	const prices = page.locator('.lines .line .pr');
	await expect(prices.nth(0)).toHaveText('$22.24');
	await expect(prices.nth(1)).toHaveText('$0.50');
	await expect(page.locator('.lines .line .tag', { hasText: 'Coupon' })).toHaveCount(2);
	await expect(applied).toContainText('$22.74');
	const totals = page.locator('.totals');
	await expect(totals).toContainText('$22.74'); // Subtotal = the lines
	await expect(totals.locator('.disc')).toHaveCount(0); // never a discount row
	await expect(totals.locator('.note')).toHaveCount(0); // no "saved you"
	await expect(isMobile ? page.locator('.placebar a') : page.locator('a.go')).toContainText('$22.74');
	await page.screenshot({ path: info.outputPath(`coupon-ui-${info.project.name}.png`), fullPage: true });

	// remove → offered again; apply again for checkout
	await applied.getByRole('button', { name: 'Remove coupon' }).click();
	await expect(page.getByTestId('coupon-applied')).toHaveCount(0);
	await page.getByTestId('coupon-offer').getByRole('button', { name: 'Apply' }).click();
	await expect(page.getByTestId('coupon-applied')).toHaveCount(1);

	// checkout quotes with the coupon (and would send it with the order)
	await page.goto(site.url(s, '/checkout'));
	await expect(page.locator('.summary .totals .cpn')).toContainText('16" Pizza + Wings');
	await expect(page.locator('.summary .totals')).toContainText('$22.74');
	await expect(page.locator('.summary .line .tag', { hasText: 'Coupon' })).toHaveCount(2);

	// back in the cart, taking the wings out breaks the coupon: it comes off
	await page.goto(site.url(s, '/cart'));
	await page.locator('.lines .line').nth(1).getByRole('button', { name: 'Remove' }).click();
	await expect(page.getByTestId('coupon-applied')).toHaveCount(0);
	await expect(page.getByTestId('coupon-offer')).toHaveCount(0);
	await expect(page.locator('.totals')).toContainText('$18.24');
});

test('a coupon that ended after it was applied comes off with a note', async ({ page, freshStore, site }) => {
	const s = await freshStore();
	const c = await addCoupon(s);
	await addFromItemPage(page, site.url(s, '/menu/cheese-pizza'), pizza16PepLeft);
	await addFromItemPage(page, site.url(s, '/menu/wings'), wingsBbq);
	await page.goto(site.url(s, '/cart'));
	await page.getByTestId('coupon-offer').getByRole('button', { name: 'Apply' }).click();
	await expect(page.getByTestId('coupon-applied')).toHaveCount(1);
	await s.me('PUT', `/deals/${c.id}`, { ...c, active: false }, 200);
	await page.reload();
	await expect(page.getByTestId('coupon-applied')).toHaveCount(0);
	await expect(page.locator('.banner.warn')).toContainText('A coupon no longer fits your order');
	await expect(page.locator('.totals')).toContainText('$29.73');
});
