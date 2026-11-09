// Miso: every scene the illustrator delivered prepares for a page (store colour, whisker ink,
// sticker edge, motion held for the starter, ids per instance).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { prepare, type Scene } from '../../src/lib/miso/index.ts';

const dir = new URL('../../src/lib/miso/art/', import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith('.svg'));
const SCENES: Scene[] = ['received', 'cooking', 'ready', 'out', 'done', 'placed', 'closed', 'paused', 'loading', 'empty-cart', 'no-deals', 'no-orders', 'wave', 'lost', 'declined', 'outside', 'idle', 'peek', 'side'];

test('all 19 scenes are delivered', () => {
	assert.deepEqual(files.map((f) => f.slice(5, -4)).sort(), [...SCENES].sort());
});

for (const f of files) {
	test(`prepares ${f}`, () => {
		const raw = readFileSync(new URL(f, dir), 'utf8');
		const m = prepare(raw, 'x:1', 'Miso');
		const scene = f.slice(5, -4);
		assert.equal(m.scene, scene);
		assert.ok(m.w > 0 && m.h > 0);
		assert.equal(m.svg.match(/<svg\b/g)?.length, 1);
		assert.ok(m.svg.includes('role="img" aria-label="Miso"'));
		// the store colour and the whiskers follow the page
		assert.ok(!/#E2363B"/i.test(m.svg), 'no fixed store colour left');
		assert.ok(m.svg.includes('var(--miso-brand,#E2363B)'));
		assert.ok(m.svg.includes('stroke:var(--miso-ink,'), 'whiskers inked');
		assert.ok(!/<[^>]*\sstyle="[^"]*"[^>]*\sstyle=/.test(m.svg), 'one style attribute per tag');
		// motion waits for the starter; every animation hangs off it
		const begins = [...m.svg.matchAll(/\sbegin="([^"]+)"/g)].map((x) => x[1]);
		assert.ok(begins.includes('indefinite'));
		for (const b of begins.filter((x) => x !== 'indefinite')) assert.match(b, new RegExp(`^${scene}-x1-go\\.begin\\+[0-9.]+s$`));
		// every id carries the instance prefix and every reference resolves
		const ids = new Set([...m.svg.matchAll(/\sid="([^"]+)"/g)].map((x) => x[1]));
		for (const id of ids) assert.ok(id.startsWith(`${scene}-x1-`), id);
		for (const [, ref] of m.svg.matchAll(/url\(#([^)]+)\)/g)) assert.ok(ids.has(ref), `url(#${ref})`);
		// the sticker edge wraps the drawing; the shadow (when first) stays outside it
		assert.ok(m.svg.includes(`<g filter="url(#${scene}-x1-edge)">`));
		// balanced groups
		assert.equal((m.svg.match(/<g\b[^>]*[^/]>|<g>/g) ?? []).length, (m.svg.match(/<\/g>/g) ?? []).length);
	});
}

test('decorative Miso is hidden from screen readers', () => {
	const raw = readFileSync(new URL('miso-idle.svg', dir), 'utf8');
	assert.ok(prepare(raw, 'a', null).svg.includes('aria-hidden="true"'));
	assert.notEqual(prepare(raw, 'a', null).svg, prepare(raw, 'b', null).svg);
});
