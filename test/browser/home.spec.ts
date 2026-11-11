// The home page with the default blocks (hero, categories, from the menu, hours; order again for a
// signed-in customer with past orders; deals once the store has some) and the closed / paused states.
import { test, expect, cartButton, miso, signIn, apiOrder } from './fixtures.ts';
import { addDeals, closeToday, pause } from './api.ts';

test('default blocks: hero, categories, from the menu, hours (no deals, no about / install)', async ({ page, go, isMobile }) => {
	await go('/');
	const hero = page.locator('section.hero');
	await expect(hero.locator('.eyebrow').first()).toHaveText('Test Pizza');
	await expect(hero.getByRole('heading', { level: 1 })).toHaveText('Test Pizza');
	await expect(hero.locator('.lead')).toHaveText('Delivered to your door, or pick up at Test Pizza.');
	await expect(hero.locator('.status-line')).toContainText('Open now');
	await expect(hero.locator('.status-line')).toContainText('Delivery ~45 min');
	await expect(hero.locator('.status-line')).toContainText('Pickup ~20 min');
	await expect(hero.getByRole('link', { name: 'See deals' })).toHaveCount(0);
	// the order card beside the headline (wide screens), with Miso peeking by default
	if (isMobile) await expect(page.locator('.hero-card')).toBeHidden();
	else {
		const card = page.locator('.hero-card');
		await expect(card.getByText('How do you want it?')).toBeVisible();
		await expect(miso(card, 'peek')).toBeVisible();
		await card.getByRole('radio', { name: 'Pickup' }).click();
		await expect(card.getByRole('radio', { name: 'Pickup' })).toHaveAttribute('aria-checked', 'true');
		await expect(card.locator('.etas')).toContainText('~45 min');
		await expect(card.getByRole('link', { name: 'See the menu' })).toHaveAttribute('href', '/menu');
	}
	await expect(page.getByRole('heading', { name: 'What are you in the mood for?' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'From the menu' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Hours', exact: true })).toBeVisible();
	await expect(page.locator('.hours .num')).toHaveCount(7);
	await expect(page.locator('.hours .num').first()).toContainText('Open · today');
	await expect(page.getByRole('heading', { name: 'Deals' })).toHaveCount(0);
	await expect(page.getByRole('heading', { name: 'Order again' })).toHaveCount(0);
	await expect(page.getByRole('heading', { name: 'About us' })).toHaveCount(0);
	await expect(page.getByRole('heading', { name: 'Get the app' })).toHaveCount(0);
	// the delivery-area card (delivery on, 5 mi)
	await expect(page.getByRole('img', { name: 'Delivery area · 5 mi' })).toBeVisible();
	// JSON-LD + meta
	await expect(page.locator('head meta[name="description"]')).toHaveAttribute('content', /Order online for delivery or pickup\./);
	expect(await page.locator('script[type="application/ld+json"]').first().textContent()).toContain('"@type":"Restaurant"');
});

test('hero: Start an order opens the menu', async ({ page, go }) => {
	await go('/');
	await page.locator('section.hero').getByRole('link', { name: 'Start an order' }).click();
	await expect(page).toHaveURL(/\/menu$/);
	await expect(page.getByRole('heading', { name: 'Pizza', level: 2 })).toBeVisible();
});

test('categories: a chip jumps to that category on the menu', async ({ page, go }) => {
	await go('/');
	const chips = page.locator('.cats a');
	await expect(chips).toHaveText(['Pizza', 'Sides']);
	await chips.filter({ hasText: 'Sides' }).click();
	await expect(page).toHaveURL(/\/menu#sides$/);
	await expect(page.locator('#sides')).toBeInViewport();
});

test('from the menu: tiles open the item, Full menu opens the menu', async ({ page, go }) => {
	await go('/');
	const tiles = page.locator('.tiles a');
	// no picks yet: a sampler, the first item of each category
	await expect(tiles).toHaveCount(2);
	await expect(tiles.nth(1)).toContainText('Wings');
	await expect(tiles.first()).toContainText('Cheese Pizza');
	await expect(tiles.first()).toContainText('from $11.99');
	await tiles.first().click();
	await expect(page).toHaveURL(/\/menu\/cheese-pizza$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cheese Pizza');
	await go('/');
	await page.getByRole('link', { name: 'Full menu →' }).click();
	await expect(page).toHaveURL(/\/menu$/);
});

test('deals block: the store\'s deals with See deals and All deals', async ({ page, freshStore, visit }) => {
	const s = await freshStore();
	await addDeals(s);
	await visit(s, '/');
	await expect(page.locator('section.hero').getByRole('link', { name: 'See deals' })).toBeVisible();
	const block = page.locator('section', { has: page.getByRole('heading', { name: 'Deals', exact: true }) });
	await expect(block.locator('a.deal')).toHaveCount(2); // codes stay off the home page
	await expect(block.locator('a.deal').first()).toContainText('Pizza + Wings');
	await expect(block.locator('a.deal').first()).toContainText('$22.99');
	await block.locator('a.deal').first().click();
	await expect(page).toHaveURL(/\/deals\/[0-9a-f-]{36}$/);
	await visit(s, '/');
	await page.getByRole('link', { name: 'All deals →' }).click();
	await expect(page).toHaveURL(/\/deals$/);
});

test('order again: a signed-in customer with past orders reorders in one tap', async ({ page, go, shop, customerIp }) => {
	await go('/');
	await signIn(page, shop, customerIp);
	await apiOrder(page, shop);
	await page.reload();
	const block = page.locator('section', { has: page.getByRole('heading', { name: 'Order again' }) });
	await expect(block.locator('.again-card')).toHaveCount(1);
	await expect(block.locator('.again-card')).toContainText('1× Cheese Pizza, 2× Wings');
	await expect(block.locator('.again-card')).toContainText('Pickup');
	await expect(block.getByRole('link', { name: 'Account →' })).toHaveAttribute('href', '/account');
	await block.getByRole('button', { name: 'Reorder' }).click();
	await expect(page).toHaveURL(/\/cart$/);
	await expect(cartButton(page)).toHaveAttribute('aria-label', 'Cart, 3');
	await expect(page.locator('.lines .line')).toHaveCount(2);
});

test('paused: the status bar with the note, Miso snowed under, Order ahead', async ({ page, freshStore, visit }) => {
	const s = await freshStore();
	await pause(s, 'indefinite', 'Oven repair');
	await visit(s, '/');
	await expect(page.locator('.statusbar')).toHaveText('Online ordering is paused · Oven repair');
	const hero = page.locator('section.hero');
	await expect(miso(hero, 'paused')).toBeVisible();
	await expect(hero.locator('.status-line')).toContainText('Online ordering is paused');
	await expect(hero.getByRole('link', { name: 'Order ahead' })).toBeVisible();
	// the blocks' own cats wait while it's away
	await expect(miso(page, 'peek')).toHaveCount(0);
});

test('closed today: the status bar says when it opens, Miso asleep', async ({ page, freshStore, visit }) => {
	const s = await freshStore();
	await closeToday(s);
	await visit(s, '/');
	await expect(page.locator('.statusbar')).toContainText('Closed');
	await expect(miso(page.locator('section.hero'), 'closed')).toBeVisible();
	await expect(page.locator('section.hero .status-line')).toContainText('Closed');
	await expect(page.locator('.hours .num').first()).toContainText('Closed · today · Private event');
});

test('closed with the hero off: Miso asleep at the top of the page', async ({ page, freshStore, visit }) => {
	const s = await freshStore();
	await closeToday(s);
	await s.me('PUT', '/site/website/draft', { blocks: [{ id: 'hero', on: false }] }, 200);
	await s.me('POST', '/site/website/publish', undefined, 200);
	await visit(s, '/');
	await expect(page.locator('section.hero')).toHaveCount(0);
	await expect(page.locator('.away')).toContainText('Closed');
	await expect(miso(page.locator('.away'), 'closed')).toBeVisible();
});
