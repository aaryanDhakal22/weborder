// Imports a POS menu export (columns: menu, category, item, price, printer, description, sizes,
// times_ordered, last_ordered) into the v2 menu, cleaning POS leftovers and reporting every change.
// Pure module (used by the admin wizard, the CLI and tests).
import type { Art, Category, Group, Item, Menu, Size } from './types.ts';
import { parseCsv, slugify, uniqueSlug } from './util.ts';

export interface ImportNote {
	kind: 'dropped' | 'merged' | 'hidden' | 'grouped' | 'popular';
	item: string;
	reason: string;
}
export interface ImportResult {
	menu: Menu;
	notes: ImportNote[];
	stats: { rows: number; items: number; categories: number; dropped: number; merged: number; popular: number };
}

type Kind = 'pizza' | 'sub' | 'wings' | 'desi' | 'side' | 'drink' | 'dessert' | 'pasta' | 'salad' | 'burger' | 'seafood' | 'other';

function kindOf(category: string): Kind {
	const c = category.toLowerCase();
	if (c.includes('pizza')) return 'pizza';
	if (c.includes('sub') || c.includes('sandwich')) return 'sub';
	if (c.includes('wing')) return 'wings';
	if (c.includes('desi') || c.includes('indian') || c.includes('curry')) return 'desi';
	if (c.includes('side') || c.includes('appet')) return 'side';
	if (c.includes('drink') || c.includes('beverage')) return 'drink';
	if (c.includes('dessert') || c.includes('sweet')) return 'dessert';
	if (c.includes('pasta')) return 'pasta';
	if (c.includes('salad')) return 'salad';
	if (c.includes('burger')) return 'burger';
	if (c.includes('seafood') || c.includes('fish')) return 'seafood';
	return 'other';
}

const ART: Record<Kind, Art> = { pizza: 'pizza', sub: 'sub', wings: 'wings', desi: 'bowl', side: 'fries', drink: 'drink', dessert: 'cake', pasta: 'bowl', salad: 'salad', burger: 'burger', seafood: 'sub', other: 'bowl' };

const C = (d: number) => Math.round(d * 100);

/** Option groups the importer attaches by category kind; the owner edits them afterwards. */
export function defaultGroups(): Record<string, Group> {
	const top = (id: string, name: string) => ({ id, name, priceCents: 200, sizePrices: { 's-10': 125, 's-12': 150, 's-14': 200, 's-16': 250 } });
	return {
		'pizza-toppings': {
			id: 'pizza-toppings', name: 'Toppings', nameEs: 'Ingredientes', min: 0, max: 0, portions: true,
			options: [
				top('pepperoni', 'Pepperoni'), top('sausage', 'Sausage'), top('mushrooms', 'Mushrooms'), top('onions', 'Onions'), top('green-peppers', 'Green peppers'),
				top('black-olives', 'Black olives'), top('ham', 'Ham'), top('bacon', 'Bacon'), top('ground-beef', 'Ground beef'), top('jalapenos', 'Jalapeños'),
				top('pineapple', 'Pineapple'), top('spinach', 'Spinach'), top('tomatoes', 'Tomatoes'),
				{ id: 'extra-cheese', name: 'Extra cheese', priceCents: 250, sizePrices: { 's-10': 150, 's-12': 200, 's-14': 250, 's-16': 300 } }
			]
		},
		'pizza-sauce': {
			id: 'pizza-sauce', name: 'Sauce', nameEs: 'Salsa', min: 1, max: 1,
			options: [{ id: 'regular', name: 'Regular sauce', priceCents: 0, default: true }, { id: 'light', name: 'Light sauce', priceCents: 0 }, { id: 'extra', name: 'Extra sauce', priceCents: 0 }, { id: 'white-garlic', name: 'White garlic', priceCents: 100 }]
		},
		'sub-toppings': {
			id: 'sub-toppings', name: 'Toppings', min: 0, max: 0,
			options: [
				{ id: 'fried-onions', name: 'Fried onions', priceCents: 0 }, { id: 'peppers', name: 'Peppers', priceCents: 0 }, { id: 'mushrooms', name: 'Mushrooms', priceCents: 75 },
				{ id: 'lettuce', name: 'Lettuce', priceCents: 0 }, { id: 'tomato', name: 'Tomato', priceCents: 0 }, { id: 'mayo', name: 'Mayo', priceCents: 0 }, { id: 'hots', name: 'Hot peppers', priceCents: 0 },
				{ id: 'extra-cheese', name: 'Extra cheese', priceCents: 150, sizePrices: { 's-8': 150, 's-12': 200 } }
			]
		},
		'wing-sauce': {
			id: 'wing-sauce', name: 'Sauce', min: 1, max: 1,
			options: [{ id: 'honey-hot', name: 'Honey Hot', priceCents: 0 }, { id: 'buffalo', name: 'Buffalo', priceCents: 0 }, { id: 'old-bay', name: 'Old Bay', priceCents: 0 }, { id: 'lemon-pepper', name: 'Lemon Pepper', priceCents: 0 }, { id: 'mumbo', name: 'Mumbo', priceCents: 0 }, { id: 'plain', name: 'Plain', priceCents: 0 }]
		},
		'wing-dip': { id: 'wing-dip', name: 'Dip', min: 0, max: 2, options: [{ id: 'ranch', name: 'Ranch', priceCents: 0 }, { id: 'blue-cheese', name: 'Blue cheese', priceCents: 0 }, { id: 'extra-dip', name: 'Extra dip', priceCents: 75 }] },
		spice: { id: 'spice', name: 'Spice level', min: 1, max: 1, options: [{ id: 'mild', name: 'Mild', priceCents: 0 }, { id: 'medium', name: 'Medium', priceCents: 0 }, { id: 'hot', name: 'Hot', priceCents: 0 }, { id: 'indian-hot', name: 'Indian hot', priceCents: 0 }] }
	};
}

function groupsFor(kind: Kind, name: string, hasSizes: boolean): string[] {
	const n = name.toLowerCase();
	if (kind === 'pizza' && n.includes('pizza') && hasSizes) return ['pizza-toppings', 'pizza-sauce'];
	if (kind === 'sub' && hasSizes) return ['sub-toppings'];
	if (kind === 'wings' && n.includes('wing')) return ['wing-sauce', 'wing-dip'];
	if (kind === 'desi' && /chicken|lamb|goat|masala|curry|korma|vindaloo|biryani|tikka|paneer/.test(n)) return ['spice'];
	return [];
}

function parseSizes(raw: string, kind: Kind): Size[] {
	if (!raw.trim()) return [];
	const parts = raw.split('|').map((p) => p.trim()).filter(Boolean);
	const out: Size[] = [];
	for (const p of parts) {
		const m = /^(.*?)\s*\$(\d+(?:\.\d+)?)$/.exec(p);
		if (!m) continue;
		let label = m[1].trim().replace(/\b0z\b/i, 'oz');
		const cents = C(Number(m[2]));
		if (/^serving$/i.test(label)) continue;
		let id = slugify(label);
		let short: string | undefined;
		const pc = /^(\d+)\s*piece$/i.exec(label);
		const inch = /^(\d{1,2})(?:\s+(small|medium|large|x-large|xl|personal|family))?$/i.exec(label);
		if (pc) {
			id = `p-${pc[1]}`;
			label = `${pc[1]} pc`;
		} else if (inch && (kind === 'pizza' || kind === 'sub' || kind === 'seafood' || kind === 'pasta')) {
			id = `s-${inch[1]}`;
			short = `${inch[1]}"`;
			label = inch[2] ? `${inch[1]}" ${inch[2]}` : `${inch[1]}"`;
		}
		if (!out.some((s) => s.id === id)) out.push({ id, name: label, short, priceCents: cents });
	}
	out.sort((a, b) => a.priceCents - b.priceCents);
	if (out.length) out[0].default = true;
	return out.length > 1 ? out : [];
}

const titleCase = (s: string) => s.replace(/\s+/g, ' ').trim();

export function importMenuCsv(text: string, opts: { popularPerCategory?: number; popularOverall?: number } = {}): ImportResult {
	const rows = parseCsv(text);
	const notes: ImportNote[] = [];
	if (!rows.length) return { menu: { categories: [], groups: {} }, notes, stats: { rows: 0, items: 0, categories: 0, dropped: 0, merged: 0, popular: 0 } };
	const head = rows[0].map((h) => h.trim().toLowerCase());
	const col = (name: string) => head.indexOf(name);
	const ix = { category: col('category'), item: col('item'), price: col('price'), printer: col('printer'), desc: col('description'), sizes: col('sizes'), count: col('times_ordered') };
	if (ix.category < 0 || ix.item < 0 || ix.price < 0) throw new Error('The CSV needs at least category, item and price columns.');

	type Row = { category: string; name: string; price: number; printer: string; desc: string; sizes: string; count: number };
	const data: Row[] = rows.slice(1).map((r) => ({
		category: titleCase(r[ix.category] ?? ''),
		name: titleCase(r[ix.item] ?? ''),
		price: C(Number(r[ix.price] || 0)),
		printer: ix.printer >= 0 ? (r[ix.printer] ?? '').trim() : '',
		desc: ix.desc >= 0 ? (r[ix.desc] ?? '').trim() : '',
		sizes: ix.sizes >= 0 ? (r[ix.sizes] ?? '') : '',
		count: ix.count >= 0 ? Number(r[ix.count] || 0) : 0
	})).filter((r) => r.name && r.category);

	const names = new Set(data.map((r) => r.name.toLowerCase()));
	const kept: Row[] = [];
	for (const r of data) {
		if (/^\((1st|2nd|3rd)\)/i.test(r.name)) {
			notes.push({ kind: 'dropped', item: r.name, reason: 'Half of a POS deal. Rebuild it as a bundle deal.' });
			continue;
		}
		const pre = /^\(([^)]+)\)\s*(.+)$/.exec(r.name);
		if (pre) {
			const base = pre[2].toLowerCase();
			const twin = [...names].find((n) => n === base || n === `${base} pizza` || n.startsWith(base));
			notes.push({ kind: 'dropped', item: r.name, reason: twin ? `Pre-sized copy of “${twin}”; sizes live on the item now.` : 'Pre-sized POS button.' });
			continue;
		}
		const sizesAllZero = /\$0\.00/.test(r.sizes) && !/\$[1-9]/.test(r.sizes);
		if (r.price === 0 && (sizesAllZero || !r.sizes.trim())) {
			notes.push({ kind: 'dropped', item: r.name, reason: 'Zero-price POS line (a deal component or a placeholder).' });
			continue;
		}
		kept.push(r);
	}

	// Duplicate names are coupon copies: keep the most-rung one.
	const byName = new Map<string, Row>();
	for (const r of kept) {
		const key = r.name.toLowerCase();
		const prev = byName.get(key);
		if (!prev) byName.set(key, r);
		else {
			const winner = r.count > prev.count ? r : prev;
			byName.set(key, winner);
			notes.push({ kind: 'merged', item: r.name, reason: 'Duplicate name; kept the one rung up most.' });
		}
	}

	const groups = defaultGroups();
	const usedGroups = new Set<string>();
	const cats = new Map<string, Category>();
	const catSlugs = new Set<string>();
	const itemSlugs = new Set<string>();
	const all: { item: Item; count: number; cat: string }[] = [];
	for (const r of byName.values()) {
		const kind = kindOf(r.category);
		let cat = cats.get(r.category);
		if (!cat) {
			const slug = uniqueSlug(slugify(r.category), catSlugs);
			cat = { id: slug, slug, name: r.category, items: [] };
			cats.set(r.category, cat);
		}
		const sizes = parseSizes(r.sizes, kind);
		const single = /\$(\d+(?:\.\d+)?)/.exec(r.sizes);
		const price = sizes.length ? sizes[0].priceCents : r.price || (single ? C(Number(single[1])) : 0);
		const g = groupsFor(kind, r.name, sizes.length > 0);
		g.forEach((x) => usedGroups.add(x));
		const slug = uniqueSlug(slugify(r.name), itemSlugs);
		const item: Item = { id: slug, slug, name: r.name, desc: r.desc || undefined, priceCents: price, sizes: sizes.length ? sizes : undefined, groups: g.length ? g : undefined, art: ART[kind], printer: r.printer || undefined };
		cat.items.push(item);
		all.push({ item, count: r.count, cat: cat.id });
	}

	// Popular: the top items per category and overall, by times ordered.
	const perCat = opts.popularPerCategory ?? 2;
	const overall = opts.popularOverall ?? 8;
	const pop = new Set<Item>();
	for (const cat of cats.values()) {
		cat.items.sort((a, b) => (all.find((x) => x.item === b)!.count - all.find((x) => x.item === a)!.count));
		all.filter((x) => x.cat === cat.id && x.count > 20).sort((a, b) => b.count - a.count).slice(0, perCat).forEach((x) => pop.add(x.item));
	}
	all.sort((a, b) => b.count - a.count).slice(0, overall).forEach((x) => pop.add(x.item));
	for (const it of pop) {
		it.popular = true;
		notes.push({ kind: 'popular', item: it.name, reason: 'One of the most-ordered items.' });
	}
	for (const x of all) if (x.count === 0 && !x.item.popular) {
		x.item.online = false;
		notes.push({ kind: 'hidden', item: x.item.name, reason: 'Never ordered; hidden online (still on the kitchen menu).' });
	}
	for (const id of usedGroups) notes.push({ kind: 'grouped', item: groups[id].name, reason: `Option group “${groups[id].name}” added to matching items. Edit it in the admin.` });

	const categories = [...cats.values()].sort((a, b) => {
		const sum = (c: Category) => all.filter((x) => x.cat === c.id).reduce((s, x) => s + x.count, 0);
		return sum(b) - sum(a);
	});
	const usedGroupMap: Record<string, Group> = {};
	for (const id of usedGroups) usedGroupMap[id] = groups[id];
	const dropped = notes.filter((n) => n.kind === 'dropped').length;
	return {
		menu: { categories, groups: usedGroupMap },
		notes,
		stats: { rows: data.length, items: all.length, categories: categories.length, dropped, merged: notes.filter((n) => n.kind === 'merged').length, popular: pop.size }
	};
}
