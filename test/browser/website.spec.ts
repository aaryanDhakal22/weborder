// What Store › Website publishes, as the storefront shows it: presets (fonts, nav: top / side /
// bottom tabs), the brand colour, the home page blocks in order and on/off, Miso around blocks,
// texts + Spanish twins, the announcement bar's dates, logo + cover, privacy, languages, and the
// private /p/<token> preview of the draft. Each test publishes on a store of its own.
import { test, expect, miso, publishLook, reloadUntil } from './fixtures.ts';
import { LOGO_SVG, png, upload } from './api.ts';

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
const shift = (days: number) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date(Date.now() + days * 86_400_000));

test('presets: the side nav (café), the bottom tab bar (taquería, phones), classic paper', async ({ page, freshStore, visit, isMobile }) => {
	const cafe = await freshStore();
	await publishLook(cafe, { preset: 'cafe-calm' });
	await visit(cafe, '/');
	await expect(page.locator('.sf')).toHaveClass(/theme-cafe-calm/);
	await expect(page.locator('.sf')).toHaveClass(/nav-side/);
	if (!isMobile) {
		const side = page.locator('aside.side');
		await expect(side).toBeVisible();
		await side.getByRole('link', { name: 'Deals' }).click();
		await expect(page).toHaveURL(/\/deals$/);
		await expect(side.getByRole('link', { name: 'Deals' })).toHaveClass(/\bon\b/);
		await expect(side.locator('.status-line')).toContainText('Open now');
	}
	// café menus are photo tiles
	await visit(cafe, '/menu');
	await expect(page.locator('.pcard')).toHaveCount(3);

	const taq = await freshStore();
	await publishLook(taq, { preset: 'taqueria-bold' });
	await visit(taq, '/menu');
	await expect(page.locator('.sf')).toHaveClass(/nav-bottom/);
	await expect(page.locator('.printed')).toBeVisible();
	const tabs = page.locator('nav.tabbar');
	if (isMobile) {
		await expect(tabs).toBeVisible();
		await expect(tabs.getByRole('link')).toHaveText(['Home', 'Menu', 'Deals', 'Cart', 'Account']);
		await expect(tabs.getByRole('link', { name: 'Menu' })).toHaveClass(/\bon\b/);
		await tabs.getByRole('link', { name: 'Account' }).click();
		await expect(page).toHaveURL(/\/account$/);
		await expect(tabs.getByRole('link', { name: 'Account' })).toHaveClass(/\bon\b/);
	} else await expect(tabs).toBeHidden();

	const paper = await freshStore();
	await publishLook(paper, { preset: 'classic-paper' });
	await visit(paper, '/menu');
	await expect(page.locator('.sf')).toHaveClass(/theme-classic-paper/);
	await expect(page.locator('.printed')).toBeVisible();
});

test('brand colour: the theme follows it, and the browser bar colour too', async ({ page, freshStore, visit }) => {
	const s = await freshStore();
	await publishLook(s, { brand: '#1F6FEB' });
	await visit(s, '/');
	const brand = await page.locator('.sf').evaluate((el) => getComputedStyle(el).getPropertyValue('--q-brand').trim().toLowerCase());
	expect(brand).toBe('#1f6feb');
	await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', /.+/);
});

test('blocks: the store\'s order and on/off, about us and install the app', async ({ page, freshStore, visit }) => {
	const s = await freshStore();
	await publishLook(s, {
		blocks: [{ id: 'about', on: true }, { id: 'hours', on: true }, { id: 'install', on: true }, { id: 'picks', on: true }, { id: 'hero', on: false }, { id: 'categories', on: false }],
		texts: { about_title: 'Our story', about: 'Since 1985.\n\nFamily run.' }
	});
	await visit(s, '/');
	await expect(page.locator('section.hero')).toHaveCount(0);
	const order = await page.locator('main > section').evaluateAll((els) => els.map((e) => e.getAttribute('aria-labelledby') ?? e.getAttribute('aria-label')));
	expect(order).toEqual(['about-h', 'Hours', 'app-h', 'pop-h']);
	const about = page.locator('section[aria-labelledby="about-h"]');
	await expect(about.getByRole('heading', { name: 'Our story' })).toBeVisible();
	await expect(about.locator('p')).toHaveText(['Since 1985.', 'Family run.']);
	const app = page.locator('section[aria-labelledby="app-h"]');
	await expect(app).toContainText('Get the app');
	await expect(app).toContainText('Free, no app store: tap Share, then Add to Home Screen.');
	await expect(app.locator('.appicon')).toHaveText('T');
	await expect(page.getByRole('heading', { name: 'What are you in the mood for?' })).toHaveCount(0);
	// about us with no text stays hidden even when on
	const empty = await freshStore();
	await publishLook(empty, { blocks: [{ id: 'about', on: true }] });
	await visit(empty, '/');
	await expect(page.locator('section[aria-labelledby="about-h"]')).toHaveCount(0);
});

test('picks: the store\'s own "From the menu" items in its order', async ({ page, freshStore, visit }) => {
	const s = await freshStore();
	await publishLook(s, { picks: [s.menu.fries.id, s.menu.pizza.id] });
	await visit(s, '/');
	await expect(page.locator('.tiles a .nm')).toHaveText(['Fries', 'Cheese Pizza']);
});

test('Miso around blocks: peeking over one, sitting beside another, none in the hero when off', async ({ page, freshStore, visit, isMobile }) => {
	const s = await freshStore();
	await publishLook(s, { miso_blocks: { picks: 'peek', hours: 'side', hero: 'off' } });
	await visit(s, '/');
	await expect(miso(page.locator('section[aria-labelledby="pop-h"] .blk-miso.peek'), 'peek')).toBeVisible();
	await expect(miso(page.locator('section[aria-label="Hours"] .blk-miso.beside'), 'side')).toBeVisible();
	await expect(page.locator('.hero-card .miso')).toHaveCount(0);
	// the default: the hero card peeking (wide screens)
	const d = await freshStore();
	await visit(d, '/');
	if (!isMobile) await expect(miso(page.locator('.hero-card'), 'peek')).toBeVisible();
	await expect(page.locator('.blk-miso')).toHaveCount(0);
	// a side-sit on the hero card
	const side = await freshStore();
	await publishLook(side, { miso_blocks: { hero: 'side' } });
	await visit(side, '/');
	if (!isMobile) await expect(miso(page.locator('.hero-card .miso.beside'), 'side')).toBeVisible();
});

test('texts: the store\'s words, their Spanish twins, our Spanish when a twin is empty', async ({ page, freshStore, visit }) => {
	const s = await freshStore();
	await publishLook(s, { texts: { eyebrow: 'Since 1985', headline: 'Real NY slices', lead: 'Hand tossed.', headline_es: 'Rebanadas de NY', lead_es: '' } });
	await visit(s, '/');
	const hero = page.locator('section.hero');
	await expect(hero.locator('.eyebrow').first()).toHaveText('Since 1985');
	await expect(hero.getByRole('heading', { level: 1 })).toHaveText('Real NY slices');
	await expect(hero.locator('.lead')).toHaveText('Hand tossed.');
	await visit(s, '/es');
	await expect(hero.getByRole('heading', { level: 1 })).toHaveText('Rebanadas de NY');
	await expect(hero.locator('.lead')).toHaveText('Entrega a domicilio, o recoge en Test Pizza.'); // never the English lead
	await expect(hero.locator('.eyebrow').first()).toHaveText('Test Pizza');
});

test('announcement bar: shown between its dates, Spanish text, gone after its last day', async ({ page, freshStore, visit }) => {
	const s = await freshStore();
	await publishLook(s, { announcement: { on: true, text: 'Closed Thanksgiving', text_es: 'Cerrado el Día de Acción de Gracias', from: shift(-1), to: shift(1) } });
	await visit(s, '/');
	await expect(page.getByRole('note')).toHaveText('Closed Thanksgiving');
	await visit(s, '/es/menu');
	await expect(page.getByRole('note')).toHaveText('Cerrado el Día de Acción de Gracias');
	const past = await freshStore();
	await publishLook(past, { announcement: { on: true, text: 'Old news', from: shift(-5), to: shift(-1) } });
	await visit(past, '/');
	await expect(page.getByRole('note')).toHaveCount(0);
	const later = await freshStore();
	await publishLook(later, { announcement: { on: true, text: 'Soon', from: shift(2), to: '' } });
	await visit(later, '/');
	await expect(page.getByRole('note')).toHaveCount(0);
	const off = await freshStore();
	await publishLook(off, { announcement: { on: false, text: 'Hidden', from: today(), to: today() } });
	await visit(off, '/');
	await expect(page.getByRole('note')).toHaveCount(0);
});

test('logo and cover: the header, the icon, the manifest, the hero photo, about us, install', async ({ page, freshStore, visit }) => {
	const s = await freshStore();
	const logo = await upload(s, 'logo', LOGO_SVG, 'image/svg+xml');
	const cover = await upload(s, 'cover', png(160, 90), 'image/png');
	await publishLook(s, { logo, cover, blocks: [{ id: 'hero', on: true }, { id: 'about', on: true }, { id: 'install', on: true }], texts: { about: 'Hello.' } });
	await visit(s, '/');
	const img = page.locator('header img.logo');
	await expect(img).toHaveAttribute('src', `/media/${logo}`);
	await expect(img).toHaveAttribute('alt', 'Test Pizza');
	expect(await img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
	await expect(page.locator('header .wordmark')).toHaveCount(0);
	await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', new RegExp(`/media/${logo}$`));
	const hero = page.locator('section.hero');
	await expect(hero).toHaveClass(/has-cover/);
	await expect(hero).toHaveAttribute('style', new RegExp(`/media/${cover}`));
	await expect(hero.locator('.lava')).toHaveCount(0);
	const aboutImg = page.locator('section[aria-labelledby="about-h"] img.about-img');
	await expect(aboutImg).toHaveAttribute('src', `/media/${cover}`);
	await expect(page.locator('section[aria-labelledby="app-h"] img.appimg')).toHaveAttribute('src', `/media/${logo}`);
	const base = new URL(page.url()).origin;
	const mf = await (await page.request.get(`${base}/manifest.webmanifest`)).json();
	expect(JSON.stringify(mf.icons)).toContain(`/media/${logo}`);
	const media = await page.request.get(`${base}/media/${cover}`);
	expect(media.headers()['content-type']).toBe('image/png');
	expect(media.headers()['cache-control']).toContain('immutable');
});

test('privacy: our default from the store\'s details, or the store\'s own text', async ({ page, go, freshStore, visit }) => {
	await go('/privacy');
	const p = page.locator('.policy p');
	await expect(p.first()).toHaveText('Test Pizza');
	await expect(p.first()).toHaveClass(/\blead\b/);
	await expect(page.locator('.policy')).toContainText('card numbers go straight to Square');
	await expect(page.locator('.policy')).toContainText('delete it any time from Account › Delete my account.');
	await go('/es/privacy');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Política de privacidad');
	await expect(page.locator('.policy')).toContainText('Nunca los vemos ni los guardamos.');
	const s = await freshStore();
	await publishLook(s, { privacy: 'We keep your order.\n\nAsk us anything.' });
	await visit(s, '/privacy');
	await expect(p).toHaveText(['We keep your order.', 'Ask us anything.']);
	await expect(p.first()).not.toHaveClass(/\blead\b/);
});

test('languages: English only drops the switch and the /es pages', async ({ page, freshStore, visit }) => {
	const s = await freshStore();
	await publishLook(s, { languages: ['en'] });
	await visit(s, '/');
	await expect(page.locator('header a.lang')).toHaveCount(0);
	await expect(page.locator('link[hreflang]')).toHaveCount(0);
	expect((await page.request.get(new URL(page.url()).origin + '/es/menu')).status()).toBe(404);
});

test('a newly published change shows up on its own within seconds', async ({ page, freshStore, visit }) => {
	const s = await freshStore();
	await visit(s, '/');
	await expect(page.locator('section.hero h1')).toHaveText('Test Pizza');
	await publishLook(s, { texts: { headline: 'Fresh out of the oven' } });
	await reloadUntil(page, async () => (await page.locator('section.hero h1').textContent()) === 'Fresh out of the oven');
});

test('the preview link: the draft with a bar, links that stay in the preview, the live site unchanged, a stale link', async ({ page, freshStore, visit }) => {
	const s = await freshStore();
	await s.me('PUT', '/site/website/draft', { texts: { headline: 'Draft headline' }, announcement: { on: true, text: 'Draft news' }, preset: 'cafe-calm' }, 200);
	const w = (await s.me('GET', '/site/website', undefined, 200)).data;
	const root = new URL(w.preview_url).pathname;
	await visit(s, root);
	await expect(page.getByRole('status').filter({ hasText: 'Preview of your draft' })).toBeVisible();
	await expect(page.locator('section.hero h1')).toHaveText('Draft headline');
	await expect(page.getByRole('note')).toHaveText('Draft news');
	await expect(page.locator('.sf')).toHaveClass(/theme-cafe-calm/);
	// every link keeps the prefix; the menu, an item and the language switch stay in the preview
	await page.locator('section.hero').getByRole('link', { name: 'Start an order' }).click();
	await expect(page).toHaveURL(new RegExp(`${root}/menu$`));
	await expect(page.getByRole('status').filter({ hasText: 'Preview of your draft' })).toBeVisible();
	await page.locator('.pcard').first().click();
	await expect(page).toHaveURL(new RegExp(`${root}/menu/cheese-pizza$`));
	await page.keyboard.press('Escape');
	await page.locator('header a.lang').click();
	await expect(page).toHaveURL(new RegExp(`${root}/es/menu$`));
	await expect(page.getByRole('status').filter({ hasText: 'Vista previa del borrador' })).toBeVisible();
	await page.getByRole('link', { name: /^(Test Pizza — )?Inicio$/ }).filter({ visible: true }).first().click();
	await expect(page).toHaveURL(new RegExp(`${root}/es$`));
	// the live site never shows the draft
	await visit(s, '/');
	await expect(page.locator('section.hero h1')).toHaveText('Test Pizza');
	await expect(page.locator('.preview-bar')).toHaveCount(0);
	// a stale link drops the prefix and shows the live page
	await visit(s, '/p/qpv_00000000000000000000/menu');
	await expect(page).toHaveURL(/:\d+\/menu$/);
	await expect(page.locator('.preview-bar')).toHaveCount(0);
});
