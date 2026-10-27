import { readFileSync } from 'node:fs';
import { importMenuCsv } from '../../src/lib/menu-csv.ts';
import type { Store } from '../../src/lib/types.ts';

/** Lombardi's as the seed builds it: real CSV menu + fixture settings and deals. */
export function lombardis(): Store {
	const fx = JSON.parse(readFileSync(new URL('../../fixtures/stores/lombardis.json', import.meta.url), 'utf8'));
	const menu = importMenuCsv(readFileSync(new URL('../../fixtures/menus/lombardis.csv', import.meta.url), 'utf8')).menu;
	return { ...fx, menu, publish: { version: 0, current: 0, history: [] }, kitchenNext: 1100, createdAt: '2026-10-27T00:00:00Z' };
}
export function fixture(id: string): Store {
	const fx = JSON.parse(readFileSync(new URL(`../../fixtures/stores/${id}.json`, import.meta.url), 'utf8'));
	return { ...fx, publish: { version: 0, current: 0, history: [] }, kitchenNext: 1100, createdAt: '2026-10-27T00:00:00Z' };
}
/** 2026-10-27 is a Tuesday; 2026-10-31 a Saturday. Times are New York (EDT, UTC-4). */
export const at = (iso: string) => new Date(iso);
