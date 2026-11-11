// An item's own page (and the same configurator in the sheet): sizes, options priced per size,
// halves, a required group, notes, quantity, the add button's price, keyboard use, Spanish.
import { test, expect, cartButton, addFromItemPage, pizza16PepLeft, wingsBbq } from './fixtures.ts';

test('pizza: breadcrumb, sizes, a topping priced per size, halves, quantity, notes, add', async ({ page, go }) => {
	await go('/menu/cheese-pizza');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cheese Pizza');
	const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
	await expect(crumbs.getByRole('link', { name: 'Menu' })).toHaveAttribute('href', '/menu');
	await expect(crumbs.getByRole('link', { name: 'Pizza' })).toHaveAttribute('href', '/menu#pizza');
	await expect(page.getByText('Tap a topping, then whole or half.')).toBeVisible();
	await expect(page.getByRole('img', { name: 'Cheese pizza' })).toBeVisible(); // the pie

	const sizes = page.getByRole('radiogroup', { name: 'Size' }).getByRole('radio');
	await expect(sizes).toHaveCount(2);
	await expect(sizes.nth(0)).toHaveAttribute('aria-checked', 'true');
	await expect(sizes.nth(0)).toContainText('$11.99');
	await expect(sizes.nth(1)).toContainText('$15.99');
	const add = page.getByRole('button', { name: /Add to order/ });
	await expect(add).toContainText('$11.99');

	const toppings = page.getByRole('group', { name: /Toppings/ });
	await expect(toppings).toContainText('Up to 5');
	const pep = page.getByRole('checkbox', { name: /Pepperoni/ });
	await expect(pep).toHaveAttribute('aria-checked', 'false');
	await expect(toppings.locator('.pr')).toHaveText('+$1.50'); // 12": the option's own price
	await sizes.nth(1).click();
	await expect(sizes.nth(1)).toHaveAttribute('aria-checked', 'true');
	await expect(toppings.locator('.pr')).toHaveText('+$2.25'); // 16": the bank's size price
	await expect(add).toContainText('$15.99');

	await pep.click();
	await expect(pep).toHaveAttribute('aria-checked', 'true');
	await expect(add).toContainText('$18.24');
	const halves = page.getByRole('radiogroup', { name: /Pepperoni:/ });
	await expect(halves.getByRole('radio', { name: 'Whole' })).toHaveAttribute('aria-checked', 'true');
	await expect(page.getByRole('img', { name: 'Pizza with Pepperoni' })).toBeVisible();
	await halves.getByRole('radio', { name: 'Left half' }).click();
	await expect(halves.getByRole('radio', { name: 'Left half' })).toHaveAttribute('aria-checked', 'true');
	await expect(page.getByRole('img', { name: 'Pizza with Pepperoni on the left half' })).toBeVisible();
	await halves.getByRole('radio', { name: 'Right half' }).click();
	await expect(halves.getByRole('radio', { name: 'Right half' })).toHaveAttribute('aria-checked', 'true');
	// unticking the topping drops its halves control
	await pep.click();
	await expect(halves).toHaveCount(0);
	await pep.click();
	await page.getByRole('radio', { name: 'Left half' }).click();

	await page.getByRole('button', { name: 'One more' }).click();
	await page.getByRole('button', { name: 'One more' }).click();
	await expect(page.locator('.stepper b')).toHaveText('3');
	await expect(add).toContainText('$54.72');
	await page.getByRole('button', { name: 'One less' }).click();
	await expect(page.locator('.stepper b')).toHaveText('2');
	await page.getByRole('button', { name: 'One less' }).click();
	await page.getByRole('button', { name: 'One less' }).click(); // never below 1
	await expect(page.locator('.stepper b')).toHaveText('1');

	const notes = page.getByLabel('Notes for the kitchen');
	await expect(notes).toHaveAttribute('maxlength', '140');
	await expect(notes).toHaveAttribute('placeholder', 'Well done, please');
	await notes.fill('Extra crispy');
	await add.click();
	await expect(page).toHaveURL(/\/menu#pizza$/);
	await expect(cartButton(page)).toHaveAttribute('aria-label', 'Cart, 1');
	await cartButton(page).click();
	const line = page.locator('.lines .line').first();
	await expect(line).toContainText('Cheese Pizza');
	await expect(line.locator('.mods')).toContainText('Pepperoni');
	await expect(line.locator('.mods')).toContainText('“Extra crispy”');
	await expect(line.locator('.pr')).toHaveText('$18.24');
});

test('a required group blocks the add button until picked; a single choice can\'t be unpicked', async ({ page, go }) => {
	await go('/menu/wings');
	const add = page.locator('.sheet-foot .btn-p');
	await expect(add).toBeDisabled();
	await expect(add).toContainText('Pick 1: Sauce');
	const sauce = page.getByRole('group', { name: /Sauce/ });
	await expect(sauce).toContainText('Required');
	await expect(sauce).toContainText('Pick 1');
	const bbq = page.getByRole('radio', { name: /BBQ/ });
	await expect(sauce.locator('.pr')).toHaveText('+$0.50');
	await bbq.click();
	await expect(bbq).toHaveAttribute('aria-checked', 'true');
	await expect(add).toBeEnabled();
	await expect(add).toContainText('Add to order');
	await expect(add).toContainText('$11.49');
	await bbq.click(); // required: stays picked
	await expect(bbq).toHaveAttribute('aria-checked', 'true');
	await add.click();
	await expect(page).toHaveURL(/\/menu#sides$/);
});

test('an item with one size and no options: just quantity and add', async ({ page, go }) => {
	await go('/menu/fries');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Fries');
	await expect(page.getByRole('radiogroup', { name: 'Size' })).toHaveCount(0);
	await expect(page.locator('fieldset.grp')).toHaveCount(0);
	await expect(page.getByRole('button', { name: /Add to order/ })).toContainText('$3.99');
});

test('adding the same thing twice merges the lines', async ({ page, site, shop }) => {
	const url = site.url(shop, '/menu/cheese-pizza');
	await addFromItemPage(page, url, pizza16PepLeft);
	await addFromItemPage(page, url, pizza16PepLeft);
	await addFromItemPage(page, site.url(shop, '/menu/wings'), wingsBbq);
	await expect(cartButton(page)).toHaveAttribute('aria-label', 'Cart, 3');
	await cartButton(page).click();
	await expect(page.locator('.lines .line')).toHaveCount(2);
	await expect(page.locator('.lines .line').first().locator('.stepper b')).toHaveText('2');
});

test('keyboard: sizes, toppings, halves, quantity and add work without a mouse', async ({ page, go }) => {
	await go('/menu/cheese-pizza');
	await page.getByRole('radiogroup', { name: 'Size' }).getByRole('radio').nth(1).focus();
	await page.keyboard.press('Enter');
	await expect(page.getByRole('radiogroup', { name: 'Size' }).getByRole('radio').nth(1)).toHaveAttribute('aria-checked', 'true');
	await page.getByRole('checkbox', { name: /Pepperoni/ }).focus();
	await page.keyboard.press('Space');
	await expect(page.getByRole('checkbox', { name: /Pepperoni/ })).toHaveAttribute('aria-checked', 'true');
	await page.keyboard.press('Tab'); // → the halves
	await expect(page.getByRole('radio', { name: 'Left half' })).toBeFocused();
	await page.keyboard.press('Enter');
	await expect(page.getByRole('radio', { name: 'Left half' })).toHaveAttribute('aria-checked', 'true');
	await page.getByRole('button', { name: 'One more' }).focus();
	await page.keyboard.press('Enter');
	await expect(page.locator('.stepper b')).toHaveText('2');
	await page.keyboard.press('Tab');
	await expect(page.getByRole('button', { name: /Add to order/ })).toBeFocused();
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/\/menu#pizza$/);
	await expect(cartButton(page)).toHaveAttribute('aria-label', 'Cart, 2');
});

test('Spanish item page: labels in Spanish, menu names as written', async ({ page, go }) => {
	await go('/es/menu/wings');
	await expect(page.locator('html')).toHaveAttribute('lang', 'es');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Wings');
	await expect(page.locator('.sheet-foot .btn-p')).toContainText('Elige 1: Sauce');
	await expect(page.getByRole('group', { name: /Sauce/ })).toContainText('Requerido');
	await expect(page.getByLabel('Notas para la cocina')).toBeVisible();
	await page.getByRole('radio', { name: /BBQ/ }).click();
	await page.locator('.sheet-foot .btn-p').click();
	await expect(page).toHaveURL(/\/es\/menu#sides$/);
});
