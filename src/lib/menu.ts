// Menu helpers on main's shapes (pure). Prices shown before main quotes come from main's engine
// copy, so the in-browser number is the number main will charge.
import type { Line } from './engine.ts';
import { price } from './engine.ts';
import type { Context, Fulfil, Menu, MenuGroup, MenuItem, MenuOption, StoreView } from './types.ts';

export function groupsOf(menu: Menu, item: MenuItem): MenuGroup[] {
	const byId = new Map(menu.modifier_groups.map((g) => [g.id, g]));
	return item.modifier_group_ids.map((id) => byId.get(id)).filter((g): g is MenuGroup => !!g);
}

export function findItem(menu: Menu, id: string): MenuItem | undefined {
	for (const c of menu.categories) for (const i of c.items) if (i.id === id) return i;
}

export function itemBySlug(menu: Menu, slug: string): MenuItem | undefined {
	for (const c of menu.categories) for (const i of c.items) if (i.slug === slug) return i;
}

/** The lowest price an item starts at (its smallest size, or a choice's). */
export function fromPrice(item: MenuItem): number {
	const ps: number[] = [];
	if (item.sizes.length) ps.push(...item.sizes.map((s) => s.price_cents));
	for (const c of item.choices ?? []) ps.push(...(c.sizes.length ? c.sizes.map((s) => s.price_cents) : [c.price_cents]));
	if (!ps.length) ps.push(item.price_cents);
	return Math.min(...ps);
}

/** The option's price on an item of this size. */
export function optionPrice(o: MenuOption, sizeId?: string): number {
	const p = sizeId ? o.prices.find((x) => x.size_id === sizeId) : undefined;
	return p ? p.price_cents : o.price_cents;
}

/** Whether the item needs choices before it can go in the cart (sizes, a choice, a required group). */
export function needsChoices(menu: Menu, item: MenuItem): boolean {
	return item.sizes.length > 1 || (item.choices?.length ?? 0) > 0 || groupsOf(menu, item).some((g) => g.required || g.min_select > 0 || g.options.length > 0);
}

/** Prices one line with main's engine: its unit price and the modifier lines main prints. */
export function priceLine(ctx: Context, line: Line, type: Fulfil = 'pickup'): { unit: number; name: string; mods: string[]; error: string | null } {
	const q = price(ctx, { type, lines: [{ ...line, qty: 1 }] }, new Date());
	const l = q.lines[0];
	const err = q.errors.find((e) => e.line === 0 || e.line === null) ?? null;
	return { unit: l?.unit_cents ?? 0, name: l?.name ?? '', mods: l?.mods ?? [], error: err ? err.message : null };
}

/** The initial(s) shown on an item's tile when it has no photo. */
export function initials(name: string): string {
	const w = name.replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter((x) => x && !/^\d+$/.test(x));
	return (w[0]?.[0] ?? name[0] ?? '?').toUpperCase();
}

/** Short size labels for a tile: 10" · 12" · 14". */
export function sizeShort(menu: Menu, sizeId: string, name: string): string {
	return menu.sizes.find((s) => s.id === sizeId)?.short || name;
}

/** main's pricing context with the menu put back (the store data carries the menu once). */
export function contextOf(store: Pick<StoreView, 'menu' | 'pricing'>): Context {
	return { ...store.pricing, menu: { categories: store.menu.categories, modifier_groups: store.menu.modifier_groups } } as unknown as Context;
}

/** The bank item ids behind a menu item (a merged item has several). */
const anchorsOf = (i: MenuItem) => (i.anchor?.item_ids?.length ? i.anchor.item_ids : [i.id]);

/** Menu items a deal step counts (by bank item, its category, and the allowed sizes). */
export function eligibleItems(store: Pick<StoreView, 'menu' | 'pricing'>, el: { items: string[] | null; categories: string[] | null; sizes: string[] | null } | null | undefined): MenuItem[] {
	if (!el) return [];
	const out: MenuItem[] = [];
	for (const c of store.menu.categories)
		for (const i of c.items) {
			const ids = anchorsOf(i);
			const hit = ids.some((id) => (el.items ?? []).includes(id) || (el.categories ?? []).includes(store.pricing.items[id]?.category_id ?? ''));
			if (!hit) continue;
			if (el.sizes?.length && !i.sizes.some((s) => el.sizes!.includes(s.size_id)) && !(i.choices ?? []).some((ch) => ch.sizes.some((s) => el.sizes!.includes(s.size_id)))) continue;
			out.push(i);
		}
	return out;
}

const SIDE = /\b(side|sides|drink|drinks|beverage|beverages|soda|dessert|desserts|sweets|extras?|dips?|sauces?)\b/i;

/** "Goes well with": quick sides, drinks and desserts (one tap, no required choices) not in the cart. */
export function suggestions(store: Pick<StoreView, 'menu'>, inCart: Set<string>, soldOut: string[], n = 3): MenuItem[] {
	const out: MenuItem[] = [];
	const cats = store.menu.categories.filter((c) => SIDE.test(c.name));
	// One per category first, then fill.
	for (let round = 0; out.length < n && round < 6; round++)
		for (const c of cats) {
			const quick = c.items.filter((i) => !inCart.has(i.id) && !i.sold_out && !soldOut.includes(i.id) && !out.includes(i) && i.sizes.length <= 1 && !(i.choices?.length) && !groupsOf(store.menu, i).some((g) => g.required || g.min_select > 0));
			const pick = quick[round];
			if (pick && out.length < n) out.push(pick);
		}
	return out;
}
