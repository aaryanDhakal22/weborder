// Accounts: sign in by text code (wrong code, change number, "Call me instead" after the wait),
// details, past orders (track, reorder, items gone from the menu), saved addresses (add, edit,
// default, remove), saved cards (forget), sign out, delete.
import { test, expect, cartButton, miso, signIn, apiOrder, newPhone } from './fixtures.ts';
import { connectFakeSquare } from './api.ts';

test('signed out: why sign in, the phone form, guests welcome', async ({ page, go }) => {
	await go('/account');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sign in');
	await expect(miso(page, 'wave')).toBeVisible();
	await expect(page.getByText('Sign in with your phone to keep your addresses and cards')).toBeVisible();
	await expect(page.getByText('No account needed: you can always order as a guest.')).toBeVisible();
	const send = page.getByRole('button', { name: 'Text me a code' });
	await expect(send).toBeDisabled();
	await page.getByLabel('Phone').fill('410 555');
	await expect(send).toBeDisabled();
	await page.getByLabel('Phone').fill('(410) 555-0199');
	await expect(send).toBeEnabled();
});

test('sign in by code: wrong code, change number, the right code, then Hi + the header', async ({ page, go, shop }) => {
	await go('/account');
	const phone = newPhone();
	await page.getByLabel('Phone').fill(phone);
	await page.getByRole('button', { name: 'Text me a code' }).click();
	await expect(page.getByText(new RegExp(`We sent a code to .*${phone.slice(-4)}`))).toBeVisible();
	const signInBtn = page.getByRole('button', { name: 'Sign in', exact: true });
	await expect(signInBtn).toBeDisabled();
	await page.getByLabel('Code').fill('000000');
	await signInBtn.click();
	await expect(page.getByRole('alert')).toBeVisible();
	await page.getByRole('button', { name: 'Change number' }).click();
	await expect(page.getByLabel('Phone')).toHaveValue(phone);
	await page.getByRole('button', { name: 'Text me a code' }).click();
	// the second send replaces the first code: wait for it to land, or main still has the old one
	await expect(page.getByText(new RegExp(`We sent a code to .*${phone.slice(-4)}`))).toBeVisible();
	await page.getByLabel('Code').fill(await shop.signinCode(phone));
	await page.getByLabel('Your name (new accounts)').fill('Grace Hopper');
	await signInBtn.click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hi Grace');
	await expect(page.locator('header a.acct')).toHaveAttribute('aria-label', 'Account');
	await expect(page.locator('header a.acct')).toHaveClass(/\bon\b/);
	const dl = page.locator('dl');
	await expect(dl).toContainText('Grace Hopper');
	await expect(dl).toContainText(phone.slice(-4));
	// the session lives in an httpOnly cookie: the page's JavaScript never sees it
	expect(await page.evaluate(() => document.cookie)).not.toContain('qcs');
	await page.reload();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hi Grace');
});

test('"Call me instead" unlocks after the wait and calls', async ({ page, go }) => {
	await page.clock.install();
	await go('/account');
	await page.getByLabel('Phone').fill(newPhone());
	await page.getByRole('button', { name: 'Text me a code' }).click();
	const call = page.getByRole('button', { name: /Call me instead/ });
	await expect(call).toBeDisabled();
	await expect(call).toHaveText(/Call me instead \(\d+s\)/);
	await page.clock.runFor(120_000);
	await expect(call).toHaveText('Call me instead');
	await expect(call).toBeEnabled();
	await call.click();
	await expect(page.getByText(/We sent a code to/)).toBeVisible();
	await expect(call).toHaveText('Call me instead'); // a call has no second wait
});

test('details: edit name and email, cancel', async ({ page, go, shop, customerIp }) => {
	await go('/');
	await signIn(page, shop, customerIp, 'Grace Hopper');
	await go('/account');
	await page.getByRole('button', { name: 'Edit' }).first().click();
	await page.getByLabel('Name').fill('Grace B. Hopper');
	await page.getByLabel('Email, for receipts').fill('grace@example.com');
	await page.getByRole('button', { name: 'Save' }).click();
	const dl = page.locator('dl');
	await expect(dl).toContainText('Grace B. Hopper');
	await expect(dl).toContainText('grace@example.com');
	await page.getByRole('button', { name: 'Edit' }).first().click();
	await page.getByLabel('Name').fill('Nobody');
	await page.getByRole('button', { name: 'Cancel' }).click();
	await expect(dl).toContainText('Grace B. Hopper');
	await page.reload();
	await expect(dl).toContainText('grace@example.com');
});

test('orders: none yet (Miso), then the order with Track and Reorder', async ({ page, go, shop, customerIp }) => {
	await go('/');
	await signIn(page, shop, customerIp);
	await go('/account');
	await expect(page.getByText('No orders yet.')).toBeVisible();
	await expect(miso(page, 'no-orders')).toBeVisible();
	const o = await apiOrder(page, shop);
	await page.reload();
	const row = page.locator('.orders li');
	await expect(row).toHaveCount(1);
	await expect(row).toContainText('Pickup · Order received');
	await expect(row).toContainText('1× Cheese Pizza, 2× Wings');
	await expect(row.getByRole('link', { name: 'Track' })).toHaveAttribute('href', `/order/${o.track_token}`);
	await row.getByRole('button', { name: 'Reorder' }).click();
	await expect(page).toHaveURL(/\/cart$/);
	await expect(cartButton(page)).toHaveAttribute('aria-label', 'Cart, 3');
});

test('reorder when an item left the menu: the rest goes in, the page says what\'s gone', async ({ page, freshStore, visit, customerIp }) => {
	const s = await freshStore();
	await visit(s, '/');
	await signIn(page, s, customerIp);
	await apiOrder(page, s, { lines: [{ item_id: s.menu.fries.id, qty: 1, options: [] }, { item_id: s.menu.wings.id, qty: 1, options: [{ group_id: s.menu.sauce.id, option_id: s.menu.bbq.id }] }] });
	await s.me('DELETE', `/menu/items/${s.menu.fries.id}`, undefined, 204);
	await visit(s, '/account');
	await page.locator('.orders li').getByRole('button', { name: 'Reorder' }).click();
	const banner = page.locator('.banner.warn');
	await expect(banner).toContainText('Not on the menu any more: Fries. The rest is in your cart.');
	await banner.getByRole('link', { name: 'View order' }).click();
	await expect(page).toHaveURL(/\/cart$/);
	await expect(page.locator('.lines .line')).toHaveCount(1);
	await expect(page.locator('.lines .line')).toContainText('Wings');
});

test('saved addresses: add (default), edit, add another, remove', async ({ page, go, shop, customerIp }) => {
	await go('/');
	await signIn(page, shop, customerIp);
	await go('/account');
	const sec = page.locator('section', { has: page.getByRole('heading', { name: 'Saved addresses' }) });
	await expect(sec).toContainText('No saved addresses yet.');
	await sec.getByRole('button', { name: 'Add' }).click();
	await expect(sec.getByLabel('Use this address by default')).toBeChecked();
	await sec.getByLabel('Label').fill('Home');
	await sec.getByLabel('Street address').fill('12 Oak St');
	await sec.getByLabel('Apt, suite, floor').fill('3');
	await sec.getByLabel('ZIP').fill('21204');
	await sec.getByLabel('City').fill('Towson');
	await sec.getByLabel('Notes for the driver').fill('Blue door');
	await sec.getByRole('button', { name: 'Save' }).click();
	const items = sec.locator('.item');
	await expect(items).toHaveCount(1);
	await expect(items.first()).toContainText('Home Default');
	await expect(items.first()).toContainText('12 Oak St, 3, Towson, 21204');
	await expect(items.first()).toContainText('Blue door');
	await items.first().getByRole('button', { name: 'Edit' }).click();
	await expect(sec.getByLabel('Street address')).toHaveValue('12 Oak St');
	await sec.getByLabel('Label').fill('Home sweet home');
	await sec.getByRole('button', { name: 'Save' }).click();
	await expect(items.first()).toContainText('Home sweet home');
	await sec.getByRole('button', { name: 'Add' }).click();
	await expect(sec.getByLabel('Use this address by default')).not.toBeChecked();
	await sec.getByLabel('Street address').fill('400 Work Pl');
	await sec.getByLabel('ZIP').fill('21286');
	await sec.getByRole('button', { name: 'Cancel' }).click();
	await expect(items).toHaveCount(1);
	await sec.getByRole('button', { name: 'Add' }).click();
	await sec.getByLabel('Label').fill('Work');
	await sec.getByLabel('Street address').fill('400 Work Pl');
	await sec.getByLabel('ZIP').fill('21286');
	await sec.getByRole('button', { name: 'Save' }).click();
	await expect(items).toHaveCount(2);
	await items.filter({ hasText: 'Work' }).getByRole('button', { name: 'Remove' }).click();
	await expect(items).toHaveCount(1);
	await expect(items.first()).toContainText('Home sweet home');
});

test('saved cards: none yet, then one saved at checkout, forget it (with a confirm)', async ({ page, freshStore, visit, customerIp }) => {
	const s = await freshStore();
	await connectFakeSquare(s);
	await visit(s, '/');
	await signIn(page, s, customerIp);
	await visit(s, '/account');
	const sec = page.locator('section', { has: page.getByRole('heading', { name: 'Saved cards' }) });
	await expect(sec).toContainText('Cards you save at checkout show up here.');
	await apiOrder(page, s, { payment: { method: 'card', token: 'cnon:card-nonce-ok', save_card: true } });
	await page.reload();
	await expect(sec.locator('.item')).toHaveCount(1);
	await expect(sec.locator('.item')).toContainText('••••');
	await expect(sec.locator('.item')).toContainText(/expires \d\d\/\d\d/);
	page.once('dialog', (d) => d.dismiss());
	await sec.getByRole('button', { name: 'Forget' }).click();
	await expect(sec.locator('.item')).toHaveCount(1);
	page.once('dialog', (d) => {
		expect(d.message()).toBe('Forget this card?');
		void d.accept();
	});
	await sec.getByRole('button', { name: 'Forget' }).click();
	await expect(sec.locator('.item')).toHaveCount(0);
});

test('sign out, then delete (cancel first, then confirm)', async ({ page, go, shop, customerIp }) => {
	await go('/');
	await signIn(page, shop, customerIp);
	await go('/account');
	await page.getByRole('button', { name: 'Sign out' }).click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sign in');
	await page.reload();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sign in');

	await signIn(page, shop, customerIp, 'Temp Person');
	await page.reload();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hi Temp');
	page.once('dialog', (d) => d.dismiss());
	await page.getByRole('button', { name: 'Delete my account' }).click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hi Temp');
	page.once('dialog', (d) => {
		expect(d.message()).toContain('Delete your account');
		void d.accept();
	});
	await page.getByRole('button', { name: 'Delete my account' }).click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sign in');
	await page.reload();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sign in');
});

test('Spanish account page', async ({ page, go }) => {
	await go('/es/account');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Entrar');
	await expect(page.getByRole('button', { name: 'Envíame un código' })).toBeVisible();
});
