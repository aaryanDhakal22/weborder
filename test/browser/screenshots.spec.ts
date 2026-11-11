// Pixel baselines of the key pages, phone and desktop, in the default look and the café preset, so
// a restructure can't move the look unnoticed. Times, dates, ETAs and numbers from main are masked.
// Re-approve after a deliberate change: npx playwright test screenshots --update-snapshots
import type { Page } from '@playwright/test';
import { test, expect, dynamic, apiOrder, addFromItemPage, pizza16PepLeft, wingsBbq, publishLook } from './fixtures.ts';
import type { TestStore } from '../e2e/main.ts';

async function settle(page: Page) {
	await page.evaluate(() => document.fonts.ready);
	await page.waitForLoadState('networkidle');
}

async function shoot(page: Page, name: string) {
	await settle(page);
	await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true, mask: dynamic(page) });
}

async function walk(page: Page, s: TestStore, url: (p: string) => string, look: string) {
	await page.goto(url('/'));
	await shoot(page, `${look}-home`);
	await page.goto(url('/menu'));
	await shoot(page, `${look}-menu`);
	await page.locator('#pizza a').first().click();
	await expect(page.getByRole('dialog', { name: 'Cheese Pizza' })).toBeVisible();
	await page.getByRole('checkbox', { name: /Pepperoni/ }).click();
	await page.getByRole('radio', { name: 'Left half' }).click();
	await settle(page);
	await expect(page).toHaveScreenshot(`${look}-item-sheet.png`);
	await page.goto(url('/contact'));
	await shoot(page, `${look}-contact`);
	await page.goto(url('/privacy'));
	await shoot(page, `${look}-privacy`);
	await page.goto(url('/account'));
	await expect(page.getByRole('button', { name: 'Text me a code' })).toBeVisible();
	await shoot(page, `${look}-account`);

	await addFromItemPage(page, url('/menu/cheese-pizza'), pizza16PepLeft);
	await addFromItemPage(page, url('/menu/wings'), wingsBbq);
	await page.goto(url('/cart'));
	await expect(page.locator('.totals')).toContainText('$29.73');
	await shoot(page, `${look}-cart`);
	await page.goto(url('/checkout'));
	await expect(page.locator('.summary .grand')).toContainText('$36.86');
	await shoot(page, `${look}-checkout`);

	const o = await apiOrder(page, s);
	await page.goto(url(`/order/${o.track_token}`));
	await expect(page.locator('.stages')).toBeVisible();
	await shoot(page, `${look}-tracking`);
}

test('the default look: home, menu, item sheet, contact, privacy, account, cart, checkout, tracking', async ({ page, freshStore, site }) => {
	test.setTimeout(90_000);
	const s = await freshStore();
	await walk(page, s, (p) => site.url(s, p), 'default');
});

test('the café preset: the same pages', async ({ page, freshStore, site }) => {
	test.setTimeout(90_000);
	const s = await freshStore();
	await publishLook(s, { preset: 'cafe-calm' });
	await walk(page, s, (p) => site.url(s, p), 'cafe');
});
