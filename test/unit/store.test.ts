// The store's look from Store › Website's settings, and menu shaping (slugs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lookFrom, shapeMenu, DEFAULT_LOOK } from '../../src/lib/look.ts';
import type { Menu } from '../../src/lib/types.ts';

test('the default look until Store › Website publishes one', () => {
	assert.deepEqual(lookFrom({}), DEFAULT_LOOK);
	assert.equal(DEFAULT_LOOK.preset, 'pizzeria-loud');
});

test('published settings win; bad values fall back', () => {
	const l = lookFrom({ preset: 'classic-paper', brand: '#123456', mascot: 'off', languages: ['en'], texts: { headline: 'Hi' } });
	assert.equal(l.preset, 'classic-paper');
	assert.equal(l.brand, '#123456');
	assert.equal(l.mascot, 'off');
	assert.deepEqual(l.languages, ['en']);
	assert.equal(l.texts.headline, 'Hi');
	const bad = lookFrom({ brand: 'red', languages: ['fr'] });
	assert.equal(bad.brand, DEFAULT_LOOK.brand);
	assert.deepEqual(bad.languages, DEFAULT_LOOK.languages);
});

test('slugs are unique across the menu, categories ordered by position', () => {
	const it = (id: string, name: string) => ({ id, name, description: '', photo: '', anchor: { item_ids: [id] }, price_cents: 1, sizes: [], sold_out: false, modifier_group_ids: [] });
	const m = shapeMenu({
		view: { id: 'v', kind: 'web', name: 'W' }, version: 1, currency: 'USD', sizes: [], modifier_groups: [],
		categories: [
			{ key: 'b', name: 'Subs & Wraps', position: 2, items: [it('3', 'Cheesesteak')] },
			{ key: 'a', name: 'Pizza', position: 1, items: [it('1', 'Cheese Pizza'), it('2', 'Cheese Pizza')] }
		]
	} as unknown as Menu);
	assert.deepEqual(m.categories.map((c) => c.slug), ['pizza', 'subs-and-wraps']);
	assert.deepEqual(m.categories.flatMap((c) => c.items.map((i) => i.slug)), ['cheese-pizza', 'cheese-pizza-2', 'cheesesteak']);
	assert.equal(m.categories[0].items[0].category, 'a');
});
