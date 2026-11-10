// The store's look (Store › Website's published settings over the defaults) and the menu as the
// pages use it (URL slugs). Pure, so unit tests run it directly.
import type { BlockId, Lang, Look, Menu, MenuLayout, MisoSpot, Texts } from './types.ts';
import { slugify } from './util.ts';

const TEXT_KEYS = ['eyebrow', 'headline', 'lead', 'about_title', 'about', 'eyebrow_es', 'headline_es', 'lead_es', 'about_title_es', 'about_es'] as const;
const EMPTY_TEXTS = Object.fromEntries(TEXT_KEYS.map((k) => [k, ''])) as unknown as Texts;

/** The home page's blocks in their default order, with the owner's defaults: hero, order again (only
 *  signed-in customers with past orders see it), categories, deals (hides itself without deals),
 *  from the menu and hours on; about us and install the app off. */
export const DEFAULT_BLOCKS: Look['blocks'] = [
	{ id: 'hero', on: true },
	{ id: 'again', on: true },
	{ id: 'categories', on: true },
	{ id: 'deals', on: true },
	{ id: 'picks', on: true },
	{ id: 'hours', on: true },
	{ id: 'about', on: false },
	{ id: 'install', on: false }
];
const BLOCK_IDS = DEFAULT_BLOCKS.map((b) => b.id);

/** Before Store › Website publishes anything: the Quibase look (theme zero) in Lombardi's red. */
export const DEFAULT_LOOK: Look = {
	preset: 'pizzeria-loud',
	brand: '#E2363B',
	menuLayout: null,
	languages: ['en', 'es'],
	logo: '',
	cover: '',
	texts: EMPTY_TEXTS,
	blocks: DEFAULT_BLOCKS,
	picks: [],
	announcement: { on: false, text: '', text_es: '', from: '', to: '' },
	miso: { pages: true, blocks: { hero: 'peek' } },
	privacy: ''
};

const PRESETS = ['pizzeria-loud', 'cafe-calm', 'taqueria-bold', 'classic-paper'];
const LAYOUTS: MenuLayout[] = ['compact', 'photo', 'printed'];
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const id = (v: unknown) => (typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v) ? v : '');

/** Store › Website's settings over the defaults; anything malformed falls back field by field. */
export function lookFrom(settings: Record<string, unknown>): Look {
	const s = obj(settings);
	const preset = text(s.preset);
	const brand = text(s.brand);
	const langs = Array.isArray(s.languages) ? (s.languages as unknown[]).filter((l): l is Lang => l === 'en' || l === 'es') : [];
	const t = obj(s.texts);
	const a = obj(s.announcement);
	return {
		preset: PRESETS.includes(preset) ? preset : DEFAULT_LOOK.preset,
		brand: /^#[0-9a-f]{6}$/i.test(brand) ? brand.toUpperCase() : DEFAULT_LOOK.brand,
		menuLayout: LAYOUTS.includes(s.menu_layout as MenuLayout) ? (s.menu_layout as MenuLayout) : null,
		languages: langs.includes('en') ? (['en', ...(langs.includes('es') ? (['es'] as const) : [])] as Lang[]) : DEFAULT_LOOK.languages,
		logo: id(s.logo),
		cover: id(s.cover),
		texts: Object.fromEntries(TEXT_KEYS.map((k) => [k, text(t[k])])) as unknown as Texts,
		blocks: blocksFrom(s.blocks),
		picks: Array.isArray(s.picks) ? (s.picks as unknown[]).filter((p): p is string => typeof p === 'string').slice(0, 8) : [],
		announcement: { on: a.on === true && !!text(a.text), text: text(a.text), text_es: text(a.text_es), from: text(a.from), to: text(a.to) },
		miso: misoFrom(s),
		privacy: text(s.privacy)
	};
}

/** The store's block order; blocks it doesn't list keep their default state, after its own. */
function blocksFrom(raw: unknown): Look['blocks'] {
	if (!Array.isArray(raw)) return DEFAULT_BLOCKS;
	const out: Look['blocks'] = [];
	for (const b of raw as unknown[]) {
		const o = obj(b);
		const bid = o.id as BlockId;
		if (BLOCK_IDS.includes(bid) && !out.some((x) => x.id === bid)) out.push({ id: bid, on: o.on === true });
	}
	for (const d of DEFAULT_BLOCKS) if (!out.some((x) => x.id === d.id)) out.push(d);
	return out;
}

/** Miso's optional places: `miso_pages` (default on) and `miso_blocks` ({block: peek|side|off}, default
 *  the hero peeking). The old `mascot: 'off'` turns all of them off. */
function misoFrom(s: Record<string, unknown>): Look['miso'] {
	if (s.mascot === 'off') return { pages: false, blocks: {} };
	const spots: MisoSpot[] = ['peek', 'side', 'off'];
	const raw = s.miso_blocks;
	const blocks =
		raw && typeof raw === 'object'
			? Object.fromEntries(Object.entries(raw as Record<string, unknown>).filter((e): e is [string, MisoSpot] => BLOCK_IDS.includes(e[0] as BlockId) && spots.includes(e[1] as MisoSpot)))
			: { ...DEFAULT_LOOK.miso.blocks };
	return { pages: s.miso_pages !== false, blocks };
}

/** Is the announcement bar showing on this store-local date (YYYY-MM-DD)? */
export function announcing(l: Look, today: string): boolean {
	const a = l.announcement;
	return a.on && (!a.from || a.from <= today) && (!a.to || today <= a.to);
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

