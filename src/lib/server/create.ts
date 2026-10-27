// One function behind the New store wizard, the CLI and the admin API: validate, build defaults,
// import the menu CSV with its cleanup report, save as a draft (publish is a separate, explicit step).
import type { Hours, Lang, Store } from '$lib/types';
import { importMenuCsv, type ImportResult } from '$lib/menu-csv';
import { PRESETS } from '$lib/theme';
import { isHex, slugify } from '$lib/util';
import { RESERVED } from './config';
import { source } from './source';
import { DEFAULT_HOURS, newStore } from './stores';

export const HOUR_PRESETS: Record<string, { label: string; hours: Hours }> = {
	'lunch-dinner': { label: 'Lunch & dinner (11 AM – 10 PM, later on weekends)', hours: DEFAULT_HOURS },
	late: {
		label: 'Late night (11 AM – 2 AM)',
		hours: Object.fromEntries(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((d) => [d, [{ open: '11:00', close: '02:00' }]]))
	},
	breakfast: {
		label: 'Breakfast & lunch (6:30 AM – 3 PM)',
		hours: Object.fromEntries(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((d) => [d, [{ open: d === 'sat' || d === 'sun' ? '07:30' : '06:30', close: '15:00' }]]))
	}
};

export interface CreateInput {
	name: string;
	slug?: string;
	storeType?: string;
	preset?: string;
	brand?: string;
	line1?: string;
	city?: string;
	state?: string;
	zip?: string;
	phone?: string;
	timezone?: string;
	cuisine?: string;
	languages?: string[];
	hours?: string;
	zips?: string;
	csv?: string;
}

export async function createStore(input: CreateInput): Promise<{ ok: true; store: Store; report: ImportResult | null } | { ok: false; error: string }> {
	const name = String(input.name ?? '').trim();
	if (name.length < 2) return { ok: false, error: 'Give the store a name.' };
	const slug = slugify(input.slug || name);
	if (slug.length < 2) return { ok: false, error: 'The web address needs at least two letters.' };
	if (RESERVED.has(slug)) return { ok: false, error: `“${slug}” is reserved. Pick another web address.` };
	if (await source.getStore(slug)) return { ok: false, error: `${slug} is taken. Pick another web address.` };
	const brand = String(input.brand ?? '').trim();
	if (brand && !isHex(brand)) return { ok: false, error: 'Brand color must look like #AC94F4.' };
	const type = (['pizza_delivery', 'pickup_only', 'restaurant'].includes(String(input.storeType)) ? input.storeType : 'restaurant') as Store['storeType'];
	const langs = (input.languages ?? ['en']).filter((l): l is Lang => l === 'en' || l === 'es');
	let report: ImportResult | null = null;
	if (input.csv?.trim()) {
		try {
			report = importMenuCsv(input.csv);
		} catch (e) {
			return { ok: false, error: `Menu CSV: ${(e as Error).message}` };
		}
	}
	const store = newStore({
		name,
		slug,
		storeType: type,
		preset: PRESETS[String(input.preset)] ? String(input.preset) : type === 'pickup_only' ? 'cafe-calm' : 'pizzeria-loud',
		brand: brand.toUpperCase(),
		address: { line1: String(input.line1 ?? '').trim(), city: String(input.city ?? '').trim(), state: String(input.state ?? '').trim().toUpperCase().slice(0, 2), zip: String(input.zip ?? '').trim().slice(0, 5) },
		phone: String(input.phone ?? '').trim(),
		timezone: String(input.timezone || 'America/New_York'),
		cuisine: String(input.cuisine ?? '').split(',').map((s) => s.trim()).filter(Boolean),
		languages: langs.length ? langs : ['en'],
		hours: HOUR_PRESETS[String(input.hours)]?.hours,
		deliveryZips: String(input.zips ?? '').split(/[\s,]+/).map((z) => z.trim()).filter((z) => /^\d{5}$/.test(z)),
		menu: report?.menu
	});
	if (!store.settings.deliveryZips.length && store.address.zip) store.settings.deliveryZips = [store.address.zip];
	store.deals = starterDeals(store);
	await source.saveStore(store);
	return { ok: true, store, report };
}

/** Deals a new store starts with: a first-order code (on) and a suggested bundle (off until the owner turns it on). */
export function starterDeals(store: Store): Store['deals'] {
	const deals: Store['deals'] = [{ id: 'first10', slug: 'first10', kind: 'code', name: '10% off your first order', desc: 'Use code FIRST10 at checkout.', sticker: 'Code', active: true, code: 'FIRST10', pct: 10, firstOrderOnly: true }];
	const cats = store.menu.categories;
	const main = cats.find((c) => c.items.some((i) => i.popular && i.sizes?.length)) ?? cats[0];
	const side = cats.find((c) => c !== main && c.items.some((i) => i.popular));
	const top = main?.items.find((i) => i.popular) ?? main?.items[0];
	const extra = side?.items.find((i) => i.popular);
	if (top && extra) {
		const size = top.sizes?.find((s) => !s.default) ?? top.sizes?.[0];
		const regular = (size?.priceCents ?? top.priceCents) + (extra.sizes?.[0]?.priceCents ?? extra.priceCents);
		deals.push({
			id: 'combo', slug: 'combo', kind: 'bundle', name: `${top.name.replace(/ (Pizza|Sub)$/, '')} Combo`, desc: `${size ? size.name + ' ' : ''}${top.name} with ${extra.name}.`,
			sticker: 'Suggested', active: false, home: true, priceCents: Math.round((regular * 0.88) / 100) * 100 - 1, regularCents: regular,
			slots: [{ label: top.name, eligible: { items: [top.id], ...(size ? { sizes: [size.name] } : {}) }, includedOptions: 1 }, { label: extra.name, eligible: { items: [extra.id] } }]
		});
	}
	return deals;
}
