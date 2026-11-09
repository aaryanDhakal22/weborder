// The store's look (Store › Website's published settings over the defaults) and the menu as the
// pages use it (URL slugs). Pure, so unit tests run it directly.
import type { Look, Menu } from './types.ts';
import { slugify } from './util.ts';

/** Until Store › Website exists: the Quibase look (theme zero) in Lombardi's red. */
export const DEFAULT_LOOK: Look = { preset: 'pizzeria-loud', brand: '#E2363B', mascot: 'miso', languages: ['en', 'es'], texts: {} };

export function lookFrom(settings: Record<string, unknown>): Look {
	const s = settings ?? {};
	const str = (k: string) => (typeof s[k] === 'string' ? (s[k] as string) : undefined);
	const langs = Array.isArray(s.languages) ? (s.languages as string[]).filter((l): l is 'en' | 'es' => l === 'en' || l === 'es') : [];
	const texts = (typeof s.texts === 'object' && s.texts) || {};
	return {
		preset: str('preset') ?? DEFAULT_LOOK.preset,
		brand: /^#[0-9a-f]{6}$/i.test(str('brand') ?? '') ? (str('brand') as string) : DEFAULT_LOOK.brand,
		mascot: str('mascot') === 'off' ? 'off' : 'miso',
		languages: langs.length ? langs : DEFAULT_LOOK.languages,
		texts: texts as Look['texts']
	};
}

/** Gives every category and item a URL slug (unique in the menu) and tags each item with its category. */
export function shapeMenu(menu: Menu): Menu {
	const taken = new Set<string>();
	const catTaken = new Set<string>();
	const uniq = (base: string, set: Set<string>) => {
		let s = base || 'item';
		for (let n = 2; set.has(s); n++) s = `${base}-${n}`;
		set.add(s);
		return s;
	};
	return {
		...menu,
		categories: [...menu.categories]
			.sort((a, b) => a.position - b.position)
			.map((c) => ({
				...c,
				slug: uniq(slugify(c.name), catTaken),
				items: c.items.map((i) => ({ ...i, slug: uniq(slugify(i.name), taken), category: c.key }))
			}))
	};
}

