import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { importMenuCsv } from '../../src/lib/menu-csv.ts';
import { parseCsv, slugify } from '../../src/lib/util.ts';
import { sanitizeHtml } from '../../src/lib/server/sanitize.ts';

const csv = readFileSync(new URL('../../fixtures/menus/lombardis.csv', import.meta.url), 'utf8');

test("Lombardi's export: POS leftovers dropped, sizes first-class, popular marked", () => {
	const r = importMenuCsv(csv);
	assert.equal(r.stats.rows, 282);
	assert.equal(r.stats.items, 258);
	assert.ok(r.notes.some((n) => n.kind === 'dropped' && n.item.startsWith('(1st)')));
	assert.ok(r.notes.some((n) => n.kind === 'dropped' && n.item.startsWith('(14 Large)')));
	const all = r.menu.categories.flatMap((c) => c.items);
	assert.ok(!all.some((i) => i.name.startsWith('(')));
	const cheese = all.find((i) => i.name === 'Regular Tomato Cheese Pizza')!;
	assert.deepEqual(cheese.sizes!.map((s) => [s.id, s.priceCents]), [['s-10', 699], ['s-12', 999], ['s-14', 1199], ['s-16', 1299]]);
	assert.ok(cheese.popular);
	assert.deepEqual(all.find((i) => i.name === 'Catfish')!.sizes!.map((s) => s.name), ['2 pc', '3 pc']);
	assert.ok(r.menu.groups['pizza-toppings'].portions);
	for (const i of all) assert.ok(i.priceCents > 0, i.name);
});

test('CSV parser handles quotes, commas and CRLF', () => {
	assert.deepEqual(parseCsv('a,b\r\n"x, y","say ""hi"""\r\n'), [['a', 'b'], ['x, y', 'say "hi"']]);
});

test('slugs are URL-safe', () => {
	assert.equal(slugify("Lombardi's Pizza & Subs"), 'lombardis-pizza-and-subs');
	assert.equal(slugify('Jalapeño Poppers'), 'jalapeno-poppers');
});

test('custom homepage sanitizer strips scripts, handlers and javascript URLs', () => {
	const out = sanitizeHtml('<h1 onclick="steal()">Hi</h1><script>alert(1)</script><a href="javascript:alert(1)">x</a><iframe src="//evil"></iframe><style>@import url(x.css); .a{color:red}</style>');
	assert.doesNotMatch(out, /script|onclick|javascript:|iframe|@import/i);
	assert.match(out, /<h1>Hi<\/h1>/);
	assert.match(out, /\.a\{color:red\}/);
});
