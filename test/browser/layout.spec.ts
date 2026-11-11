// The frame every page shares: header (brand, nav, delivery/pickup switch, language, account, cart),
// skip link, footer (privacy, quicc), the 404 page, manifest + icon.
import { test, expect, cartButton, miso } from './fixtures.ts';

test('header: brand goes home, nav links reach every page (desktop), account and cart', async ({ page, go, isMobile }) => {
	await go('/menu');
	const header = page.locator('header.top');
	await expect(header.getByRole('link', { name: 'Test Pizza — Home' })).toBeVisible();
	await expect(header.locator('.wordmark')).toHaveText('Test Pizza');
	await expect(cartButton(page)).toHaveAttribute('aria-label', 'Cart, 0');
	const nav = header.getByRole('navigation', { name: 'Main' });
	if (isMobile) {
		await expect(nav).toBeHidden(); // phones: the brand, account and cart only
	} else {
		await expect(nav.getByRole('link', { name: 'Menu' })).toHaveClass(/\bon\b/);
		for (const [name, path, h1] of [
			['Deals', '/deals', 'Deals'],
			['Visit us', '/contact', 'Visit us'],
			['Menu', '/menu', null],
			['Home', '/', null]
		] as const) {
			await nav.getByRole('link', { name, exact: true }).click();
			await expect(page).toHaveURL(new RegExp(`${path.replace('/', '\\/')}$`));
			await expect(nav.getByRole('link', { name, exact: true })).toHaveClass(/\bon\b/);
			if (h1) await expect(page.getByRole('heading', { level: 1 })).toHaveText(h1);
		}
	}
	await header.getByRole('link', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/account$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sign in');
	await cartButton(page).click();
	await expect(page).toHaveURL(/\/cart$/);
	await header.getByRole('link', { name: 'Test Pizza — Home' }).click();
	await expect(page).toHaveURL(/:\d+\/$/);
});

test('header delivery / pickup switch (wide screens) remembers the choice', async ({ page, go, isMobile }) => {
	test.skip(isMobile, 'the header switch shows from 1100 px');
	await go('/');
	const seg = page.locator('header').getByRole('radiogroup', { name: 'Delivery / Pickup' });
	await expect(seg.getByRole('radio', { name: 'Delivery' })).toHaveAttribute('aria-checked', 'true');
	await seg.getByRole('radio', { name: 'Pickup' }).click();
	await expect(seg.getByRole('radio', { name: 'Pickup' })).toHaveAttribute('aria-checked', 'true');
	// the hero card follows the same choice
	await expect(page.locator('.hero-card').getByRole('radio', { name: 'Pickup' })).toHaveAttribute('aria-checked', 'true');
	await page.reload();
	await expect(seg.getByRole('radio', { name: 'Pickup' })).toHaveAttribute('aria-checked', 'true');
});

test('language: EN / ES switches every page and back, keeping the path', async ({ page, go }) => {
	await go('/menu');
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	await page.locator('header a.lang').click();
	await expect(page).toHaveURL(/\/es\/menu$/);
	await expect(page.locator('html')).toHaveAttribute('lang', 'es');
	await expect(page.locator('header a.lang')).toContainText('ES');
	await expect(page.locator('.catbar').getByRole('link', { name: 'Pizza' })).toBeVisible();
	await expect(page.locator('header').getByRole('link', { name: 'Entrar' })).toBeVisible();
	// links inside the Spanish site stay Spanish
	await page.locator('header').getByRole('link', { name: 'Entrar' }).click();
	await expect(page).toHaveURL(/\/es\/account$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Entrar');
	await page.locator('header a.lang').click();
	await expect(page).toHaveURL(/:\d+\/account$/);
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	// the Spanish home is /es; the default language never gets a prefix
	await go('/es');
	await expect(page.locator('html')).toHaveAttribute('lang', 'es');
	await page.locator('header a.lang').click();
	await expect(page).toHaveURL(/:\d+\/$/);
	expect((await page.request.get(page.url().replace(/\/$/, '/en/menu'))).status()).toBe(404);
});

test('keyboard: skip link first, then brand, nav and header controls are reachable', async ({ page, go, isMobile }) => {
	await go('/');
	await page.keyboard.press('Tab');
	const skip = page.getByRole('link', { name: 'Skip to content' });
	await expect(skip).toBeFocused();
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/#main$/);
	await go('/');
	const want = isMobile ? ['Test Pizza — Home', 'Language', 'Sign in', 'Cart, 0'] : ['Test Pizza — Home', 'Home', 'Menu', 'Deals', 'Visit us', 'Delivery', 'Pickup', 'Language', 'Sign in', 'Cart, 0'];
	const seen: string[] = [];
	for (let i = 0; i < want.length + 1; i++) {
		await page.keyboard.press('Tab');
		seen.push(await page.evaluate(() => {
			const el = document.activeElement as HTMLElement | null;
			return el?.getAttribute('aria-label') || el?.textContent?.trim() || '';
		}));
	}
	expect(seen.slice(1, want.length + 1).map((x) => x.replace(/\s+/g, ' '))).toEqual(want.map((w) => expect.stringContaining(w)));
});

test('footer: privacy link and the quicc link', async ({ page, go }) => {
	await go('/');
	const foot = page.locator('footer.foot');
	await expect(foot.getByRole('link', { name: /ordering by quicc/ })).toHaveAttribute('href', 'https://quiccpos.com');
	await foot.getByRole('link', { name: 'Privacy' }).click();
	await expect(page).toHaveURL(/\/privacy$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy policy');
});

test('an unknown page: 404 with Miso lost, back to the menu or home', async ({ page, go }) => {
	await go('/no-such-page');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Miso got lost in the menu');
	await expect(miso(page, 'lost')).toBeVisible();
	await page.getByRole('link', { name: 'Back to the menu' }).click();
	await expect(page).toHaveURL(/\/menu$/);
	await go('/menu/no-such-item');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Miso got lost in the menu');
	await page.getByRole('link', { name: 'Home', exact: true }).last().click();
	await expect(page).toHaveURL(/:\d+\/$/);
});

test('install: manifest, icon and robots for the store host', async ({ page, go }) => {
	await go('/');
	await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest');
	await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', /\/icon\.svg$/);
	const base = page.url().replace(/\/$/, '');
	const mf = await (await page.request.get(`${base}/manifest.webmanifest`)).json();
	expect(mf.name).toBe('Test Pizza');
	const icon = await page.request.get(`${base}/icon.svg`);
	expect(icon.headers()['content-type']).toContain('image/svg+xml');
	expect(await icon.text()).toContain('<svg');
	expect(await (await page.request.get(`${base}/robots.txt`)).text()).toContain('Sitemap:');
});
