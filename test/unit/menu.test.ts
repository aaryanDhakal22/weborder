// Menu shaping and helpers on main's shapes (pure).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eligibleItems, fromPrice, initials, needsChoices, optionPrice, priceLine, suggestions, contextOf } from '../../src/lib/menu.ts';
import type { Menu, MenuItem, StoreView } from '../../src/lib/types.ts';

const item = (id: string, name: string, extra: Partial<MenuItem> = {}): MenuItem => ({
	id, name, description: '', photo: '', anchor: { item_ids: [id] }, price_cents: 500, sizes: [], sold_out: false, modifier_group_ids: [], slug: id, category: '', ...extra
});
const menu: Menu = {
	view: { id: 'v', kind: 'web', name: 'Website' },
	version: 1,
	currency: 'USD',
	sizes: [{ id: 's12', name: '12 Medium', short: '12"' }, { id: 's16', name: '16 X-Large', short: '16"' }],
	categories: [
		{ key: 'pz', name: 'Pizza', position: 0, slug: 'pizza', items: [item('pizza', 'Cheese Pizza', { price_cents: 0, sizes: [{ size_id: 's12', name: '12 Medium', price_cents: 1199 }, { size_id: 's16', name: '16 X-Large', price_cents: 1599 }], modifier_group_ids: ['top'] })] },
		{ key: 'sd', name: 'Sides', position: 1, slug: 'sides', items: [item('fries', 'Fries', { price_cents: 399 }), item('wings', 'Wings', { price_cents: 1099, modifier_group_ids: ['sauce'] })] },
		{ key: 'dr', name: 'Drinks', position: 2, slug: 'drinks', items: [item('soda', '2 Liter Soda', { price_cents: 349 })] }
	],
	modifier_groups: [
		{ id: 'top', name: 'Toppings', required: false, min_select: 0, max_select: 5, allow_multiple: false, portions: true, options: [{ id: 'pep', name: 'Pepperoni', price_cents: 150, prices: [{ size_id: 's16', price_cents: 225 }], is_default: false, sold_out: false }] },
		{ id: 'sauce', name: 'Sauce', required: true, min_select: 1, max_select: 1, allow_multiple: false, portions: false, options: [{ id: 'bbq', name: 'BBQ', price_cents: 50, prices: [], is_default: false, sold_out: false }] }
	]
};
const store = {
	menu,
	pricing: {
		items: { pizza: { category_id: 'pz', tax_bps: 0 }, fries: { category_id: 'sd', tax_bps: 0 }, wings: { category_id: 'sd', tax_bps: 0 }, soda: { category_id: 'dr', tax_bps: 0 } },
		settings: { tax_bps: 600, service_fee_cents: 0, service_fee_bps: 0, delivery_fee_cents: 0, free_delivery_over_cents: null, delivery_min_cents: 0, tips: { enabled: true, presets: [15, 18, 20], default_pct: 18 }, card_fee: { mode: 'none', bps: 0 }, stacking: 'best' },
		deals: [],
		timezone: 'America/New_York',
		types: { pickup: true, delivery: true }
	}
} as unknown as Pick<StoreView, 'menu' | 'pricing'>;

test('from-price and option price by size', () => {
	assert.equal(fromPrice(menu.categories[0].items[0]), 1199);
	assert.equal(fromPrice(menu.categories[1].items[0]), 399);
	const pep = menu.modifier_groups[0].options[0];
	assert.equal(optionPrice(pep, 's16'), 225);
	assert.equal(optionPrice(pep, 's12'), 150);
	assert.equal(optionPrice(pep), 150);
});

test('needsChoices: sizes or groups open the configurator; a plain item adds in one tap', () => {
	assert.equal(needsChoices(menu, menu.categories[0].items[0]), true);
	assert.equal(needsChoices(menu, menu.categories[1].items[0]), false);
	assert.equal(needsChoices(menu, menu.categories[1].items[1]), true);
});

test("priceLine prices with main's engine (a half topping, per-size price)", () => {
	const ctx = contextOf(store);
	const p = priceLine(ctx, { item_id: 'pizza', size_id: 's16', options: [{ group_id: 'top', option_id: 'pep', portion: 'left' }] });
	assert.equal(p.unit, 1599 + 225);
	assert.ok(p.mods.some((m) => /Pepperoni/.test(m)));
	assert.equal(p.error, null);
	const bad = priceLine(ctx, { item_id: 'wings', options: [] });
	assert.ok(bad.error, 'the required sauce is missing');
});

test('deal eligibility by bank item, category and size', () => {
	assert.deepEqual(eligibleItems(store, { items: null, categories: ['sd'], sizes: null }).map((i) => i.id), ['fries', 'wings']);
	assert.deepEqual(eligibleItems(store, { items: ['pizza'], categories: null, sizes: ['s16'] }).map((i) => i.id), ['pizza']);
	assert.deepEqual(eligibleItems(store, { items: ['pizza'], categories: null, sizes: ['nope'] }), []);
	assert.deepEqual(eligibleItems(store, null), []);
});

test('suggestions: one-tap sides and drinks not already in the cart', () => {
	assert.deepEqual(suggestions(store, new Set(), []).map((i) => i.id), ['fries', 'soda']);
	assert.deepEqual(suggestions(store, new Set(['fries']), ['soda']).map((i) => i.id), []);
});

test('initials skip numbers', () => {
	assert.equal(initials('2 Liter Soda'), 'L');
	assert.equal(initials('Cheese Pizza'), 'C');
});
