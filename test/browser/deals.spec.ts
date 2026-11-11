// Deals: the empty state, the list with its filters, the bundle builder (steps, sizes the slot
// allows, change a pick, the celebration, the cart line), an automatic deal and a code deal.
import { test, expect, cartButton, miso, publishLook } from './fixtures.ts';
import { addDeals } from './api.ts';

test('no deals: Miso and the menu', async ({ page, go }) => {
	await go('/deals');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Deals');
	await expect(page.getByRole('heading', { name: 'No deals right now' })).toBeVisible();
	await expect(miso(page, 'no-deals')).toBeVisible();
	await page.getByRole('link', { name: 'See the menu' }).click();
	await expect(page).toHaveURL(/\/menu$/);
});

test('no deals, Miso off for pages: no cat', async ({ page, freshStore, visit }) => {
	const s = await freshStore();
	await publishLook(s, { miso_pages: false });
	await visit(s, '/deals');
	await expect(page.getByRole('heading', { name: 'No deals right now' })).toBeVisible();
	await expect(miso(page, 'no-deals')).toHaveCount(0);
});

test('the list: cards, filters (all, bundles, automatic, codes), the code note', async ({ page, freshStore, visit }) => {
	const s = await freshStore();
	await addDeals(s);
	await visit(s, '/deals');
	const cards = page.locator('a.deal');
	await expect(cards).toHaveCount(3);
	await expect(cards.nth(0)).toContainText('Pizza + Wings');
	await expect(cards.nth(0)).toContainText('$22.99');
	await expect(cards.nth(1)).toContainText('2nd wings half off');
	await expect(cards.nth(1)).toContainText('50% off');
	await expect(cards.nth(2)).toContainText('Ten off');
	await expect(cards.nth(2)).toContainText('Code: SAVE10');
	const filters = page.getByRole('radiogroup', { name: 'Filter' });
	await expect(filters.getByRole('radio')).toHaveText(['All', 'Bundles', 'Automatic', 'Codes']);
	await filters.getByRole('radio', { name: 'Bundles' }).click();
	await expect(cards).toHaveText([/Pizza \+ Wings/]);
	await filters.getByRole('radio', { name: 'Automatic' }).click();
	await expect(cards).toHaveText([/2nd wings half off/]);
	await filters.getByRole('radio', { name: 'Codes' }).click();
	await expect(cards).toHaveText([/Ten off/]);
	await filters.getByRole('radio', { name: 'All' }).click();
	await expect(cards).toHaveCount(3);
	await expect(page.getByText('Have a code? Add it at checkout.')).toBeVisible();
	expect(await page.locator('script[type="application/ld+json"]').nth(1).textContent()).toContain('Pizza + Wings');
});

test('bundle builder: two steps, the slot\'s size only, change a pick, celebrate, the cart line', async ({ page, freshStore, visit }) => {
	const s = await freshStore();
	await addDeals(s);
	await visit(s, '/deals');
	await page.locator('a.deal', { hasText: 'Pizza + Wings' }).click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pizza + Wings');
	await expect(page.locator('.backbar .big')).toHaveText('$22.99');
	await expect(page.locator('.progress-wrap .eyebrow')).toHaveText('Step 1 of 2');
	await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
	const slots = page.locator('.slots .slot');
	await expect(slots.locator('.l1')).toHaveText(['Pizza', 'Wings']);
	await expect(slots.nth(0).locator('.l2')).toHaveText('1 included');
	const picker = page.locator('.picker');
	await expect(picker.getByRole('heading', { name: 'Pizza' })).toBeVisible();
	await expect(picker.locator('.choice')).toHaveText([/Cheese Pizza.*usually \$11\.99/]);
	await picker.getByRole('button', { name: /Cheese Pizza/ }).click();
	// the slot allows the 16" only: no size choice, the price follows the deal
	await expect(picker.getByRole('radiogroup', { name: 'Size' })).toHaveCount(0);
	await expect(picker.locator('.stepper')).toHaveCount(0);
	await picker.getByRole('checkbox', { name: /Pepperoni/ }).click();
	await picker.getByRole('button', { name: 'Next' }).click();
	await expect(slots.nth(0)).toHaveClass(/\bdone\b/);
	await expect(slots.nth(0).locator('.l2')).toContainText('Cheese Pizza');
	await expect(slots.nth(0).locator('.change')).toHaveText('Change');
	await expect(page.locator('.progress-wrap .eyebrow')).toHaveText('Step 2 of 2');
	await expect(picker.getByRole('heading', { name: 'Wings' })).toBeVisible();
	// change the first pick: back to step 1, then close the configurator
	await slots.nth(0).click();
	await expect(picker.getByRole('heading', { name: 'Pizza' })).toBeVisible();
	await picker.getByRole('button', { name: /Cheese Pizza/ }).click();
	await picker.getByRole('button', { name: 'Close' }).click();
	await expect(picker.getByRole('heading', { name: 'Pizza' })).toBeVisible();
	await slots.nth(1).click();
	await picker.getByRole('button', { name: /Wings/ }).click();
	const add = picker.getByRole('button', { name: /Add deal to order|Pick 1/ });
	await expect(add).toBeDisabled();
	await picker.getByRole('radio', { name: /BBQ/ }).click();
	await picker.getByRole('button', { name: 'Add deal to order' }).click();

	const done = page.getByRole('status').filter({ hasText: 'Deal complete!' });
	await expect(done).toBeVisible();
	await expect(miso(done, 'done')).toBeVisible();
	await expect(done).toContainText('Pizza + Wings · Deals saved you');
	await expect(cartButton(page)).toHaveAttribute('aria-label', 'Cart, 1');
	await done.getByRole('button', { name: 'Build another' }).click();
	await expect(page.locator('.progress-wrap .eyebrow')).toHaveText('Step 1 of 2');
	await expect(slots.nth(0)).not.toHaveClass(/\bdone\b/);
	await visit(s, '/cart');
	const line = page.locator('.lines .line');
	await expect(line).toHaveCount(1);
	await expect(line.locator('.nm')).toHaveText('Pizza + Wings Deal');
	await expect(line.locator('.mods')).toContainText('Cheese Pizza');
	await expect(line.locator('.mods')).toContainText('Wings');
	// the deal's price plus the sauce (the wings slot includes no options); the regular price struck
	await expect(line.locator('.pr')).toHaveText('$23.49$29.73');
	await expect(line.locator('.pr .was')).toHaveText('$29.73');
});

test('an automatic deal lists what counts; a code deal says the code', async ({ page, freshStore, visit }) => {
	const s = await freshStore();
	const d = await addDeals(s);
	await visit(s, `/deals/${d.nth.id}`);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('2nd wings half off');
	await expect(page.getByText('It applies by itself in your cart. These count:')).toBeVisible();
	await expect(page.locator('.auto-deal .choice')).toHaveText([/Wings.*\$10\.99/]);
	await page.locator('.auto-deal .choice').click();
	await expect(page).toHaveURL(/\/menu\/wings$/);
	await visit(s, `/deals/${d.code.id}`);
	await expect(page.getByText('Use code SAVE10 at checkout.')).toBeVisible();
	await page.getByRole('link', { name: 'Back' }).click();
	await expect(page).toHaveURL(/\/deals$/);
	expect((await page.request.get(page.url() + '/00000000-0000-0000-0000-000000000000')).status()).toBe(404);
});
