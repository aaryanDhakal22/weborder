// Checkout: pickup / delivery, the address and the delivery check, ASAP / schedule (day + slot),
// details, payment (test card, fake Square cards incl. decline + 3-D Secure, cash), tips
// (presets / custom / none), promo code, main's totals, the refusals (missing fields, declined,
// outside the area, paused), signed-in shortcuts (saved address, saved card, save this card).
import type { Page } from '@playwright/test';
import { test, expect, cartButton, miso, addFromItemPage, pizza16PepLeft, wingsBbq, signIn, newPhone } from './fixtures.ts';
import { addDeals, closeToday, connectFakeSquare, pause } from './api.ts';

const place = (page: Page) => page.getByRole('button', { name: /Place order/ }).filter({ visible: true });

async function fillDetails(page: Page, phone = '(410) 555-0101') {
	await page.getByLabel('Name').fill('Ada Lovelace');
	await page.getByLabel('Phone (we call if something is wrong)').fill(phone);
}

async function cartOf(page: Page, url: (p: string) => string) {
	await addFromItemPage(page, url('/menu/cheese-pizza'), pizza16PepLeft);
	await addFromItemPage(page, url('/menu/wings'), wingsBbq);
	await page.goto(url('/checkout'));
	await expect(page.locator('.summary .totals')).toBeVisible();
}

test('empty checkout points back to the menu', async ({ page, go }) => {
	await go('/checkout');
	await expect(page.getByRole('heading', { name: 'Your order is empty' })).toBeVisible();
	await expect(miso(page, 'empty-cart')).toBeVisible();
	await page.getByRole('link', { name: 'Browse the menu' }).click();
	await expect(page).toHaveURL(/\/menu$/);
});

test('pickup, ASAP, test card with the default 18% tip: totals from main, placed, tracking page', async ({ page, site, shop }) => {
	await cartOf(page, (p) => site.url(shop, p));
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Checkout');
	await page.getByRole('radio', { name: 'Pickup', exact: true }).last().click();
	await expect(page.locator('section.co-sec').first().getByRole('heading')).toHaveText('1Pickup');
	await expect(page.getByLabel('Street address')).toHaveCount(0);
	// when: ASAP with the pickup estimate
	await expect(page.getByRole('radio', { name: /ASAP/ })).toHaveAttribute('aria-checked', 'true');
	await expect(page.getByRole('radio', { name: /ASAP/ })).toContainText('~20 min');
	// payment: card (the test card, no Square connected) is the default
	await expect(page.getByRole('radio', { name: 'Card' })).toHaveAttribute('aria-checked', 'true');
	const testCard = page.getByLabel('Test card (no Square connected)');
	await expect(testCard.locator('option')).toHaveText(['Test Visa · approved', 'Test card · declined']);
	await expect(page.getByText("Your card is held now and charged when your order is done")).toBeVisible();
	// tips: the store's presets in dollars, 18% by default
	const tips = page.locator('.tipchips');
	await expect(page.getByRole('heading', { name: '5 Tip the team' })).toBeVisible();
	await expect(tips.getByRole('radio')).toHaveText(['15%$4.46', '18%$5.35', '20%$5.95', 'Custom', 'No tip']);
	await expect(tips.getByRole('radio', { name: /18%/ })).toHaveAttribute('aria-checked', 'true');
	const totals = page.locator('.summary .totals');
	await expect(totals).toContainText('Subtotal$29.73');
	await expect(totals).toContainText('Tax$1.78');
	await expect(totals).toContainText('Tip$5.35');
	await expect(totals.locator('.grand')).toHaveText('Total$36.86');
	await expect(totals).not.toContainText('Delivery fee');
	await expect(place(page)).toContainText('$36.86');

	await fillDetails(page);
	await page.getByLabel('Email, for the receipt (optional)').fill('ada@example.com');
	await page.getByLabel('Notes for the order').fill('Extra napkins');
	await place(page).click();
	await expect(page).toHaveURL(/\/order\/[A-Za-z0-9_-]+$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText("Thanks, we're on it");
	await expect(miso(page, 'placed')).toBeVisible(); // the "placed" moment first
	await expect(miso(page, 'received')).toBeVisible({ timeout: 10_000 }); // then the step
	await expect(cartButton(page)).toHaveAttribute('aria-label', 'Cart, 0');
	// the back button doesn't return to a placed checkout
	await page.goBack();
	await expect(page).not.toHaveURL(/\/checkout$/);
});

test('tips: custom amount, no tip, and none at all for cash', async ({ page, site, shop }) => {
	await cartOf(page, (p) => site.url(shop, p));
	const totals = page.locator('.summary .totals');
	const tips = page.locator('.tipchips');
	await tips.getByRole('radio', { name: 'Custom' }).click();
	await page.getByLabel('Tip ($)').fill('4.00');
	await expect(totals).toContainText('Tip$4.00');
	await tips.getByRole('radio', { name: /15%/ }).click();
	await expect(totals).toContainText('Tip$4.46');
	await expect(page.getByLabel('Tip ($)')).toHaveCount(0);
	await tips.getByRole('radio', { name: 'No tip' }).click();
	await expect(totals).not.toContainText('Tip$');
	await page.getByRole('radio', { name: /Cash to the driver|Pay at pickup/ }).click();
	await expect(page.locator('.tipchips')).toHaveCount(0);
	await expect(page.getByLabel('Test card (no Square connected)')).toHaveCount(0);
});

test('missing details: the page says what to fill in, with Miso', async ({ page, site, shop }) => {
	await cartOf(page, (p) => site.url(shop, p));
	await page.getByRole('radio', { name: 'Pickup', exact: true }).last().click();
	await place(page).click();
	const fail = page.locator('#failure');
	await expect(fail).toContainText('Check this');
	await expect(fail).toContainText('Please fill in: Name');
	await expect(miso(fail, 'lost')).toBeVisible();
	await page.getByLabel('Name').fill('Ada');
	await page.getByLabel('Phone (we call if something is wrong)').fill('410 555');
	await place(page).click();
	await expect(fail).toContainText('Please fill in: Phone');
	await page.getByRole('radio', { name: 'Delivery', exact: true }).last().click();
	await page.getByLabel('Phone (we call if something is wrong)').fill('+1 (410) 555-0101');
	await place(page).click();
	await expect(fail).toContainText('Please fill in: Street address');
	await page.getByLabel('Street address').fill('1 Main St');
	await place(page).click();
	await expect(fail).toContainText('Please fill in: ZIP');
});

test('declined card: Miso, the reason, then pay at pickup instead', async ({ page, site, shop }) => {
	await cartOf(page, (p) => site.url(shop, p));
	await page.getByRole('radio', { name: 'Pickup', exact: true }).last().click();
	await fillDetails(page);
	await page.getByLabel('Test card (no Square connected)').selectOption({ label: 'Test card · declined' });
	await place(page).click();
	const fail = page.locator('#failure');
	await expect(fail).toContainText('Your card said no');
	await expect(miso(fail, 'declined')).toBeVisible();
	await fail.getByRole('button', { name: 'Pay at pickup' }).click();
	await expect(fail).toHaveCount(0);
	await expect(page.getByRole('radio', { name: 'Pay at pickup' })).toHaveAttribute('aria-checked', 'true');
	await place(page).click();
	await expect(page).toHaveURL(/\/order\//);
});

test('delivery with cash: address fields, driver notes, delivery fee line, placed', async ({ page, site, shop }) => {
	await cartOf(page, (p) => site.url(shop, p));
	await page.getByRole('radio', { name: 'Delivery', exact: true }).last().click();
	await expect(page.locator('section.co-sec').first().getByRole('heading')).toHaveText('1Delivery');
	await page.getByLabel('Street address').fill('1 Main St');
	await page.getByLabel('Apt, suite, floor').fill('2B');
	await page.getByLabel('ZIP').fill('21204');
	await page.getByLabel('City').fill('Towson');
	await expect(page.getByLabel('Notes for the driver')).toHaveAttribute('placeholder', 'Side door, ring twice');
	await page.getByLabel('Notes for the driver').fill('Ring twice');
	await expect(page.getByRole('radio', { name: /ASAP/ })).toContainText('~45 min');
	await page.getByRole('radio', { name: 'Cash to the driver' }).click();
	await expect(page.getByRole('heading', { name: /Tip your driver/ })).toHaveCount(0);
	await expect(page.locator('.summary .totals')).toContainText('Delivery fee$4.00'); // a new store's default (main)
	await fillDetails(page);
	await place(page).click();
	await expect(page).toHaveURL(/\/order\//);
	await expect(page.getByText('Delivered', { exact: true })).toBeVisible(); // the last step of a delivery
});

test('the delivery check as you type: inside, outside (switch to pickup), did you mean, not found', async ({ page, site, shop }) => {
	// main's answers come from its geocoder; here each answer is played back so every branch shows
	const answers: Record<string, unknown> = {
		'1 Inside St': { deliverable: true, result: 'inside', distance_m: 1200, radius_m: 8047, candidates: [] },
		'9 Far Rd': { deliverable: false, result: 'outside', distance_m: 26000, radius_m: 8047, candidates: [] },
		'5 Maybe Ave': { deliverable: false, result: 'check', distance_m: null, radius_m: 8047, candidates: [
			{ label: '5 MAYBE AVE, TOWSON, MD, 21204', line1: '5 Maybe Ave', city: 'Towson', state: 'MD', postal_code: '21204' },
			{ label: '5 MAYBE AVE, BALTIMORE, MD, 21286', line1: '5 Maybe Ave', city: 'Baltimore', state: 'MD', postal_code: '21286' }
		] },
		'0 Nowhere': { deliverable: false, result: 'not_found', distance_m: null, radius_m: 8047, candidates: [] }
	};
	await page.route('**/api/delivery-check', async (route) => {
		const line1 = route.request().postDataJSON().line1 as string;
		await route.fulfill({ json: answers[line1] ?? answers['0 Nowhere'] });
	});
	await cartOf(page, (p) => site.url(shop, p));
	await page.getByRole('radio', { name: 'Delivery', exact: true }).last().click();
	await page.getByLabel('ZIP').fill('21204');
	const street = page.getByLabel('Street address');
	await street.fill('1 Inside St');
	await expect(page.getByText('We deliver here.')).toBeVisible();
	await street.fill('9 Far Rd');
	await expect(page.getByText("That's outside our delivery area. Pickup works any time.")).toBeVisible();
	await street.fill('0 Nowhere');
	await expect(page.getByText("We couldn't find that address. Check the street and ZIP.")).toBeVisible();
	await street.fill('5 Maybe Ave');
	await expect(page.getByText('Did you mean one of these?')).toBeVisible();
	await page.getByRole('button', { name: '5 MAYBE AVE, BALTIMORE, MD, 21286' }).click();
	await expect(page.getByLabel('City')).toHaveValue('Baltimore');
	await expect(page.getByLabel('ZIP')).toHaveValue('21286');
	await street.fill('9 Far Rd');
	await page.locator('.banner.warn').getByRole('button', { name: 'Switch to pickup' }).click();
	await expect(page.getByRole('radio', { name: 'Pickup', exact: true }).last()).toHaveAttribute('aria-checked', 'true');
});

test('main says outside the area at Place order: Miso, Switch to pickup', async ({ page, site, shop }) => {
	await page.route('**/api/orders', (route) => route.fulfill({ status: 422, json: { code: 'outside_area', error: "That address is outside the delivery area." } }));
	await cartOf(page, (p) => site.url(shop, p));
	await page.getByRole('radio', { name: 'Delivery', exact: true }).last().click();
	await page.getByLabel('Street address').fill('9 Far Rd');
	await page.getByLabel('ZIP').fill('21204');
	await fillDetails(page);
	await place(page).click();
	const fail = page.locator('#failure');
	await expect(fail).toContainText("We can't reach that far… yet");
	await expect(fail).toContainText('That address is outside the delivery area.');
	await expect(miso(fail, 'outside')).toBeVisible();
	await fail.getByRole('button', { name: 'Switch to pickup' }).click();
	await expect(fail).toHaveCount(0);
	await expect(page.getByRole('radio', { name: 'Pickup', exact: true }).last()).toHaveAttribute('aria-checked', 'true');
});

test('schedule: day chips, the slot list from main, placed for later', async ({ page, site, shop }) => {
	await cartOf(page, (p) => site.url(shop, p));
	await page.getByRole('radio', { name: 'Pickup', exact: true }).last().click();
	await page.getByRole('radio', { name: 'Schedule' }).click();
	const days = page.getByRole('radiogroup', { name: 'Day' }).getByRole('radio');
	await expect(days).toHaveCount(8); // today + 7 days ahead
	await expect(days.nth(0)).toHaveText('today');
	await expect(days.nth(1)).toHaveText('tomorrow');
	await days.nth(1).click();
	await expect(days.nth(1)).toHaveAttribute('aria-checked', 'true');
	const slot = page.getByLabel('Choose a time');
	await expect(slot.locator('option').first()).toBeAttached();
	expect(await slot.locator('option').count()).toBeGreaterThan(10);
	await slot.selectOption({ index: 3 });
	const chosen = await slot.inputValue();
	expect(chosen).toMatch(/^\d{4}-\d\d-\d\dT/);
	await page.getByRole('radio', { name: /Cash|Pay at pickup/ }).click();
	await fillDetails(page);
	await place(page).click();
	await expect(page).toHaveURL(/\/order\//);
	// main holds it as received until the Pi confirms it; the page shows the time asked for
	await expect(page.locator('.track-hero .eta')).toContainText('Ready at');
});

test('promo code: main applies it and the summary shows the discount', async ({ page, freshStore, site }) => {
	const s = await freshStore();
	await addDeals(s);
	await cartOf(page, (p) => site.url(s, p));
	const promo = page.getByLabel('Promo code');
	await promo.fill('save10');
	await promo.blur();
	const totals = page.locator('.summary .totals');
	await expect(totals.locator('.disc')).toContainText('SAVE10');
	await expect(totals.locator('.disc')).toContainText('−$2.97');
	// remembered in the cart
	await page.reload();
	await expect(page.getByLabel('Promo code')).toHaveValue('save10');
});

test('fake Square: its test cards, a decline, and 3-D Secure (the bank asks)', async ({ page, freshStore, site }) => {
	const s = await freshStore();
	await connectFakeSquare(s);
	await cartOf(page, (p) => site.url(s, p));
	await page.getByRole('radio', { name: 'Pickup', exact: true }).last().click();
	await fillDetails(page);
	const card = page.getByLabel('Test card (fake Square)');
	await expect(card.locator('option')).toHaveCount(5);
	await card.selectOption({ label: 'Wrong CVV' });
	await place(page).click();
	await expect(page.locator('#failure')).toContainText('Your card said no');
	// 3-D Secure needs Square's own form to ask the bank; the fake has none, so the page says so
	await card.selectOption({ label: 'Bank asks to verify (3-D Secure)' });
	await place(page).click();
	await expect(page.locator('#failure')).toBeVisible();
	await expect(page.locator('#failure')).not.toContainText('Your card said no');
	await card.selectOption({ label: 'Visa 4111 · approved (tip can be raised)' });
	await place(page).click();
	await expect(page).toHaveURL(/\/order\//);
});

test('signed in: name and phone filled, saved address, save the card, then pay with the saved card', async ({ page, freshStore, site, customerIp }) => {
	const s = await freshStore();
	await connectFakeSquare(s);
	await page.goto(site.url(s, '/'));
	await signIn(page, s, customerIp, 'Grace Hopper');
	const origin = new URL(page.url()).origin;
	expect((await page.request.post(`${origin}/api/account/addresses`, { data: { label: 'Home', line1: '12 Oak St', line2: '', city: 'Towson', state: 'MD', zip: '21204', notes: 'Blue door', default: true }, headers: { origin } })).status()).toBe(201);
	await cartOf(page, (p) => site.url(s, p));
	await expect(page.getByText('Have an account?')).toHaveCount(0);
	await expect(page.getByLabel('Name')).toHaveValue('Grace Hopper');
	await expect(page.getByLabel('Phone (we call if something is wrong)')).not.toHaveValue('');
	await page.getByRole('radio', { name: 'Delivery', exact: true }).last().click();
	const saved = page.getByRole('radiogroup', { name: 'Saved addresses' });
	await expect(saved.getByRole('radio', { name: /Home/ })).toHaveAttribute('aria-checked', 'true');
	await expect(page.getByLabel('Street address')).toHaveCount(0);
	await expect(page.getByLabel('Notes for the driver')).toHaveAttribute('placeholder', 'Blue door');
	await saved.getByRole('radio', { name: 'Another address' }).click();
	await expect(page.getByLabel('Street address')).toBeVisible();
	await saved.getByRole('radio', { name: /Home/ }).click();
	// no saved card yet: a new card, with "Save this card"
	await expect(page.getByRole('radiogroup', { name: 'Saved cards' })).toHaveCount(0);
	await page.getByLabel('Save this card for next time').check();
	await place(page).click();
	await expect(page).toHaveURL(/\/order\//);

	await cartOf(page, (p) => site.url(s, p));
	const cards = page.getByRole('radiogroup', { name: 'Saved cards' });
	await expect(cards.getByRole('radio').first()).toHaveAttribute('aria-checked', 'true');
	await expect(cards.getByRole('radio').first()).toContainText('••••');
	await expect(page.getByLabel('Test card (fake Square)')).toHaveCount(0);
	await cards.getByRole('radio', { name: 'A new card' }).click();
	await expect(page.getByLabel('Test card (fake Square)')).toBeVisible();
	await cards.getByRole('radio').first().click();
	await place(page).click();
	await expect(page).toHaveURL(/\/order\//);
});

test('"Have an account? Sign in" goes to sign-in and comes back to checkout', async ({ page, site, shop }) => {
	await cartOf(page, (p) => site.url(shop, p));
	await page.locator('.banner.signin').getByRole('link', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/account\?next=checkout$/);
	const phone = newPhone();
	await page.getByLabel('Phone').fill(phone);
	await page.getByRole('button', { name: 'Text me a code' }).click();
	await expect(page.getByText(new RegExp(`We sent a code to .*${phone.slice(-4)}`))).toBeVisible();
	await page.getByLabel('Code').fill(await shop.signinCode(phone));
	await page.getByLabel('Your name (new accounts)').fill('Alan Turing');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/checkout$/);
	await expect(page.getByLabel('Name')).toHaveValue('Alan Turing');
});

test('paused while on the page: main refuses ASAP, Miso snowed under, the page switches to Schedule', async ({ page, freshStore, site }) => {
	const s = await freshStore();
	await cartOf(page, (p) => site.url(s, p));
	await page.getByRole('radio', { name: 'Pickup', exact: true }).last().click();
	await page.getByRole('radio', { name: /Pay at pickup/ }).click();
	await fillDetails(page);
	await pause(s, 'indefinite');
	await place(page).click();
	const fail = page.locator('#failure');
	await expect(fail).toContainText("Kitchen's slammed");
	await expect(miso(fail, 'paused')).toBeVisible();
	await expect(page.getByRole('radio', { name: 'Schedule' })).toHaveAttribute('aria-checked', 'true');
});

test('a paused store: ASAP is off, schedule for later', async ({ page, freshStore, site }) => {
	const s = await freshStore();
	await pause(s, 'indefinite');
	await cartOf(page, (p) => site.url(s, p));
	await expect(page.getByRole('radio', { name: /ASAP/ })).toBeDisabled();
	await expect(page.getByRole('radio', { name: 'Schedule' })).toHaveAttribute('aria-checked', 'true');
	await expect(page.getByText('Online orders are paused. You can schedule for later.')).toBeVisible();
});

test('a store closed today: ASAP is off, schedule for when it opens', async ({ page, freshStore, site }) => {
	const s = await freshStore();
	await closeToday(s);
	await cartOf(page, (p) => site.url(s, p));
	await expect(page.getByRole('radio', { name: /ASAP/ })).toBeDisabled();
	await expect(page.getByText("We're closed right now. Schedule it for when we open.")).toBeVisible();
	await expect(page.getByRole('radiogroup', { name: 'Day' })).toBeVisible();
});

test('Spanish checkout', async ({ page, site, shop }) => {
	await addFromItemPage(page, site.url(shop, '/menu/fries'));
	await page.goto(site.url(shop, '/es/checkout'));
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pagar');
	await expect(page.getByRole('heading', { name: /Tus datos/ })).toBeVisible();
	await expect(page.getByRole('button', { name: /Hacer pedido/ }).filter({ visible: true })).toBeVisible();
});

