// Builds the demo stores from fixtures/ on first start: Lombardi's from its real POS export
// (cleaned by the importer) and two demo stores from JSON.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Store } from '$lib/types';
import { importMenuCsv } from '$lib/menu-csv';

interface Fixture extends Omit<Store, 'menu' | 'publish' | 'kitchenNext' | 'createdAt'> {
	menu?: Store['menu'];
	menuCsv?: string;
	menuOverlay?: { order?: string[]; descriptions?: Record<string, string>; hide?: string[] };
}

export async function seedStores(): Promise<Store[]> {
	const dir = resolve('fixtures');
	const out: Store[] = [];
	for (const id of ['lombardis', 'fern', 'lumbre']) {
		const fx = JSON.parse(await readFile(resolve(dir, 'stores', `${id}.json`), 'utf8')) as Fixture;
		let menu = fx.menu ?? { categories: [], groups: {} };
		if (fx.menuCsv) {
			menu = importMenuCsv(await readFile(resolve(dir, fx.menuCsv), 'utf8')).menu;
			const ov = fx.menuOverlay ?? {};
			if (ov.order) menu.categories.sort((a, b) => (ov.order!.indexOf(a.id) + 1 || 99) - (ov.order!.indexOf(b.id) + 1 || 99));
			for (const c of menu.categories)
				for (const it of c.items) {
					if (ov.descriptions?.[it.name]) it.desc = ov.descriptions[it.name];
					if (ov.hide?.includes(it.name)) it.online = false;
				}
		}
		const { menuCsv: _c, menuOverlay: _o, ...rest } = fx;
		out.push({ ...rest, menu, publish: { version: 0, current: 0, history: [] }, kitchenNext: 1100, createdAt: new Date().toISOString() });
	}
	return out;
}
