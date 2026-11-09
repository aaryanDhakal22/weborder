// main's pricing engine copy (src/lib/engine.ts) against main's shared cases (test/pricing-cases,
// copied from main's internal/domain/pricing/testdata/cases by `npm run sync-engine`): every quote
// must equal the one main's Go engine recorded. main is the authority; this copy only previews.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { price } from '../../src/lib/engine.ts';

const dir = new URL('../pricing-cases/', import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();

test('there are shared cases', () => assert.ok(files.length >= 20, `only ${files.length}`));

for (const f of files) {
	const c = JSON.parse(readFileSync(new URL(f, dir), 'utf8'));
	test(c.name, () => {
		const got = JSON.parse(JSON.stringify(price(c.context, c.cart, new Date(c.at))));
		assert.deepEqual(got, c.quote);
	});
}
