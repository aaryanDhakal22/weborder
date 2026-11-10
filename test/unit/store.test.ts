// The store's look from Store › Website's settings, and menu shaping (slugs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lookFrom, shapeMenu, announcing, DEFAULT_LOOK, DEFAULT_BLOCKS } from '../../src/lib/look.ts';
import type { Menu } from '../../src/lib/types.ts';

test('the default look until Store › Website publishes one', () => {
	assert.deepEqual(lookFrom({}), DEFAULT_LOOK);
	assert.equal(DEFAULT_LOOK.preset, 'pizzeria-loud');
});

test('published settings win; bad values fall back', () => {
	const l = lookFrom({ preset: 'classic-paper', brand: '#12ab56', mascot: 'off', languages: ['en'], texts: { headline: ' Hi ', bogus: 'x' }, menu_layout: 'photo' });
	assert.equal(l.preset, 'classic-paper');
	assert.equal(l.brand, '#12AB56');
	assert.equal(l.menuLayout, 'photo');
	assert.deepEqual(l.miso, { pages: false, blocks: {} });
	assert.deepEqual(l.languages, ['en']);
	assert.equal(l.texts.headline, 'Hi');
	assert.equal(l.texts.lead, '');
	assert.ok(!('bogus' in l.texts));
	const bad = lookFrom({ brand: 'red', languages: ['fr'], preset: 'neon', menu_layout: 'grid', logo: 'http://x', picks: 'a' });
	assert.equal(bad.brand, DEFAULT_LOOK.brand);
	assert.equal(bad.preset, DEFAULT_LOOK.preset);
	assert.equal(bad.menuLayout, null);
	assert.equal(bad.logo, '');
	assert.deepEqual(bad.picks, []);
	assert.deepEqual(bad.languages, DEFAULT_LOOK.languages);
	assert.deepEqual(lookFrom({ languages: ['es'] }).languages, DEFAULT_LOOK.languages);
});

test('home blocks: the store order first, unlisted blocks keep their default; unknown and repeated ids dropped', () => {
	assert.deepEqual(lookFrom({}).blocks, DEFAULT_BLOCKS);
	const b = lookFrom({ blocks: [{ id: 'about', on: true }, { id: 'video', on: true }, { id: 'hero', on: false }, { id: 'about', on: false }] }).blocks;
	assert.deepEqual(b.slice(0, 2), [{ id: 'about', on: true }, { id: 'hero', on: false }]);
	assert.equal(b.length, DEFAULT_BLOCKS.length);
	assert.deepEqual(b.find((x) => x.id === 'install'), { id: 'install', on: false });
	assert.deepEqual(b.find((x) => x.id === 'deals'), { id: 'deals', on: true });
});

test('the announcement bar shows only with text, between its dates', () => {
	const l = lookFrom({ announcement: { on: true, text: 'Closed Thanksgiving', from: '2026-11-26', to: '2026-11-26' } });
	assert.equal(announcing(l, '2026-11-25'), false);
	assert.equal(announcing(l, '2026-11-26'), true);
	assert.equal(announcing(l, '2026-11-27'), false);
	assert.equal(announcing(lookFrom({ announcement: { on: true, text: 'Always' } }), '2030-01-01'), true);
	assert.equal(announcing(lookFrom({ announcement: { on: true, text: '' } }), '2030-01-01'), false);
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
