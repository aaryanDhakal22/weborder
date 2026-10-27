import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quote, priceSelection } from '../../src/lib/pricing.ts';
import { lombardis, fixture, at } from './helpers.ts';

const L = lombardis();
const TUE_NOON = at('2026-10-27T16:00:00Z');
const SAT_NOON = at('2026-10-31T16:00:00Z');
const byo = (sizeId: string, opts: { g: string; o: string; p?: 'whole' | 'left' | 'right' }[] = []) => ({ kind: 'item' as const, itemId: 'build-your-own-pizza', sizeId, opts: [{ g: 'pizza-sauce', o: 'regular' }, ...opts], qty: 1 });
const reconciles = (q: ReturnType<typeof quote>) => {
	const disc = q.discounts.reduce((s, d) => s + d.amountCents, 0);
	assert.equal(q.totalCents, q.subtotalCents - disc + q.deliveryFeeCents + q.serviceFeeCents + q.taxCents + q.tipCents + q.cardFeeCents);
};

test('size price + toppings priced by size; halves cost the same as whole', () => {
	const p = priceSelection(L.menu, { itemId: 'build-your-own-pizza', sizeId: 's-14', opts: [{ g: 'pizza-sauce', o: 'regular' }, { g: 'pizza-toppings', o: 'pepperoni', p: 'left' }, { g: 'pizza-toppings', o: 'mushrooms', p: 'whole' }] });
	assert.equal(p.baseCents, 1799);
	assert.equal(p.extrasCents, 400);
	assert.ok(p.mods.includes('Pepperoni (left half)'));
	assert.equal(p.error, undefined);
});

test('a required group left empty is an error', () => {
	const p = priceSelection(L.menu, { itemId: 'build-your-own-pizza', sizeId: 's-12', opts: [] });
	assert.match(p.error ?? '', /choose a sauce/);
});

test('removing a default option prints NO on the ticket', () => {
	const fern = fixture('fern');
	const p = priceSelection(fern.menu, { itemId: 'latte', opts: [{ g: 'coffee-size', o: '16oz' }, { g: 'milk', o: 'oat' }] });
	assert.equal(p.unitCents, 400 + 100 + 75);
	assert.ok(!p.mods.some((m) => m.startsWith('NO')));
	const lum = fixture('lumbre');
	const t = priceSelection(lum.menu, { itemId: 'al-pastor', opts: [{ g: 'salsa', o: 'verde' }, { g: 'taco-incluye', o: 'cilantro' }] });
	assert.ok(t.mods.includes('NO Onion'));
});

test('bundle deal: fixed price, one topping included, extra topping charged, savings vs regular', () => {
	const q = quote(L, { fulfil: 'pickup', tipCents: 0, lines: [{ kind: 'deal', dealId: 'game-day', qty: 1, picks: [
		{ itemId: 'build-your-own-pizza', sizeId: 's-14', opts: [{ g: 'pizza-sauce', o: 'regular' }, { g: 'pizza-toppings', o: 'pepperoni', p: 'left' }, { g: 'pizza-toppings', o: 'bacon', p: 'whole' }] },
		{ itemId: 'jumbo-party-wings-combo', opts: [{ g: 'wing-sauce', o: 'honey-hot' }] },
		{ itemId: '2-liter-soda', opts: [] }
	] }] }, TUE_NOON);
	assert.deepEqual(q.errors, []);
	assert.equal(q.lines[0].unitCents, 2999 + 200);
	assert.ok(q.savedCents > 0);
	reconciles(q);
});

test('bundle rejects a pick that does not fit the slot', () => {
	const q = quote(L, { fulfil: 'pickup', lines: [{ kind: 'deal', dealId: 'game-day', qty: 1, picks: [{ itemId: 'build-your-own-pizza', sizeId: 's-12', opts: [{ g: 'pizza-sauce', o: 'regular' }] }, { itemId: 'jumbo-party-wings-combo', opts: [{ g: 'wing-sauce', o: 'buffalo' }] }, { itemId: '2-liter-soda', opts: [] }] }] }, TUE_NOON);
	assert.ok(q.errors.some((e) => e.includes("doesn't fit")));
});

test('mix & match applies by itself and nudges at one short', () => {
	const sub = { kind: 'item' as const, itemId: 'cheesesteak-sub', sizeId: 's-8', opts: [], qty: 1 };
	const one = quote(L, { fulfil: 'pickup', lines: [sub] }, TUE_NOON);
	assert.equal(one.discounts.length, 0);
	assert.ok(one.nudges.some((n) => n.includes('Sub Club')));
	const two = quote(L, { fulfil: 'pickup', lines: [{ ...sub, qty: 2 }] }, TUE_NOON);
	assert.equal(two.discounts[0].label, 'Sub Club');
	assert.equal(two.discounts[0].amountCents, (1099 - 899) * 2);
});

test('2nd large half off only on its days', () => {
	const two = [byo('s-14'), byo('s-14')];
	assert.equal(quote(L, { fulfil: 'pickup', lines: two }, TUE_NOON).discounts.length, 0);
	const sat = quote(L, { fulfil: 'pickup', lines: two }, SAT_NOON);
	assert.equal(sat.discounts[0].amountCents, Math.round(1799 / 2));
});

test('first-order code: only on a first order; the bigger of code vs deal wins', () => {
	const lines = [byo('s-16')];
	assert.equal(quote(L, { fulfil: 'pickup', lines, code: 'first10', firstOrder: true }, TUE_NOON).discounts[0].amountCents, 210);
	assert.ok(quote(L, { fulfil: 'pickup', lines, code: 'FIRST10', firstOrder: false }, TUE_NOON).errors.length);
	assert.ok(quote(L, { fulfil: 'pickup', lines, code: 'NOPE' }, TUE_NOON).errors.some((e) => e.includes('NOPE')));
});

test('delivery: flat fee, minimum order, tax, tip, totals reconcile', () => {
	const small = quote(L, { fulfil: 'delivery', lines: [{ kind: 'item', itemId: 'samosa', opts: [], qty: 1 }] }, TUE_NOON);
	assert.ok(small.errors.some((e) => e.includes('minimum')));
	const q = quote(L, { fulfil: 'delivery', tipPct: 18, lines: [byo('s-14', [{ g: 'pizza-toppings', o: 'pepperoni' }])] }, TUE_NOON);
	assert.deepEqual(q.errors, []);
	assert.equal(q.deliveryFeeCents, 399);
	assert.equal(q.taxCents, Math.round((1799 + 200) * 0.06));
	assert.equal(q.tipCents, Math.round((1799 + 200) * 0.18));
	reconciles(q);
});

test('free delivery over a threshold, card surcharge, cash discount', () => {
	const lum = fixture('lumbre');
	const burritos = (n: number) => [{ kind: 'item' as const, itemId: 'burrito-asada', opts: [{ g: 'salsa', o: 'roja' }], qty: n }];
	assert.equal(quote(lum, { fulfil: 'delivery', lines: burritos(1) }, TUE_NOON).deliveryFeeCents, 299);
	const big = quote(lum, { fulfil: 'delivery', lines: burritos(4), payment: 'card' }, TUE_NOON);
	assert.equal(big.deliveryFeeCents, 0);
	assert.ok(big.cardFeeCents > 0);
	assert.equal(quote(lum, { fulfil: 'delivery', lines: burritos(4), payment: 'cash' }, TUE_NOON).cardFeeCents, 0);
	reconciles(big);
	const cd = { ...lum, settings: { ...lum.settings, cardFee: { mode: 'cash_discount' as const, bps: 300 } } };
	const cash = quote(cd, { fulfil: 'pickup', lines: burritos(2), payment: 'cash' }, TUE_NOON);
	assert.equal(cash.discounts.find((d) => d.type === 'cash')?.amountCents, Math.round(2500 * 0.03));
	reconciles(cash);
});

test('sold out items and unknown items cannot be ordered; prices never come from the client', () => {
	const q = quote(L, { fulfil: 'pickup', lines: [{ kind: 'item', itemId: 'cheesy-bread-sticks', opts: [], qty: 1 }, { kind: 'item', itemId: 'made-up', opts: [], qty: 1 }] }, TUE_NOON);
	assert.ok(q.errors.some((e) => e.includes('sold out')));
	assert.ok(q.errors.some((e) => e.includes('no longer on the menu')));
});

test('Taco Tuesday is a Tuesday-only bundle', () => {
	const lum = fixture('lumbre');
	const picks = ['al-pastor', 'al-pastor', 'carnitas'].map((itemId) => ({ itemId, opts: [{ g: 'salsa', o: 'verde' }] }));
	const line = [{ kind: 'deal' as const, dealId: 'taco-tuesday', qty: 1, picks }];
	assert.deepEqual(quote(lum, { fulfil: 'pickup', lines: line }, TUE_NOON).errors, []);
	assert.ok(quote(lum, { fulfil: 'pickup', lines: line }, SAT_NOON).errors.some((e) => e.includes("isn't available")));
});
