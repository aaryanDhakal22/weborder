import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTheme, contrast, ensureContrast, PRESETS } from '../../src/lib/theme.ts';

test('theme zero is Quibase exactly', () => {
	const t = buildTheme('pizzeria-loud', '#AC94F4');
	assert.equal(t.palette.canvas, '#0F0D1A');
	assert.equal(t.palette.brand, '#AC94F4');
	assert.equal(t.palette['on-brand'], '#241B47');
});

test('every preset with any brand color stays readable (WCAG AA)', () => {
	const brands = ['#AC94F4', '#C0392B', '#1F5A3F', '#FFC233', '#000000', '#FFFFFF', '#00B3B3', '#F2C94C', '#7A1FA2'];
	for (const id of Object.keys(PRESETS))
		for (const b of brands) {
			const t = buildTheme(id, b);
			for (const c of t.checks) assert.ok(c.ok, `${id} ${b} ${c.pair} = ${c.ratio}`);
		}
});

test('the contrast guard fixes a failing pair', () => {
	assert.ok(contrast('#F4F1FB', '#AC94F4') < 4.5);
	assert.ok(contrast(ensureContrast('#F4F1FB', '#AC94F4'), '#AC94F4') >= 4.5);
});

test('only the preset fonts are loaded, with two preloads', () => {
	const t = buildTheme('cafe-calm', '#1F5A3F');
	assert.match(t.fontFaces, /Young Serif/);
	assert.doesNotMatch(t.fontFaces, /Barlow/);
	assert.equal(t.preloads.length, 2);
});
