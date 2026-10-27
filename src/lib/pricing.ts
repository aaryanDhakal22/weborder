// Prices a cart against the store's menu and deals. The server's quote is authoritative;
// the browser runs the same function only to preview. Pure module, integer cents throughout.
import type { Category, CartLine, Deal, DealPick, Discount, Eligible, Fulfil, Group, Item, Menu, PricedLine, Quote, QuoteInput, Settings, Size, Store } from './types.ts';
import { localNow, toMin } from './hours.ts';

export const money = (c: number) => (c < 0 ? '−' : '') + '$' + (Math.abs(c) / 100).toFixed(2);

export function findItem(menu: Menu, id: string): { item: Item; cat: Category } | null {
	for (const cat of menu.categories) for (const item of cat.items) if (item.id === id) return { item, cat };
	return null;
}

export function sizeOf(item: Item, sizeId?: string): Size | undefined {
	if (!item.sizes?.length) return undefined;
	return item.sizes.find((s) => s.id === sizeId) ?? item.sizes.find((s) => s.default) ?? item.sizes[0];
}

export function matches(el: Eligible, item: Item, cat: Category, size?: Size): boolean {
	const byItem = el.items?.includes(item.id) ?? false;
	const byCat = el.categories?.includes(cat.id) ?? false;
	if (!byItem && !byCat) return false;
	if (el.sizes?.length) return !!size && el.sizes.includes(size.name);
	return true;
}

/** Deal on/off right now, in the store's timezone. */
export function dealLive(deal: Deal, tz: string, at: Date, fulfil?: Fulfil): boolean {
	if (!deal.active) return false;
	if (fulfil && deal.fulfil && deal.fulfil !== 'both' && deal.fulfil !== fulfil) return false;
	const s = deal.schedule;
	if (!s) return true;
	const now = localNow(at, tz);
	if (s.days?.length && !s.days.includes(now.day)) return false;
	if (s.start && now.minutes < toMin(s.start)) return false;
	if (s.end && now.minutes >= toMin(s.end)) return false;
	return true;
}

const optPrice = (o: { priceCents: number; sizePrices?: Record<string, number> }, sizeId?: string) => (sizeId && o.sizePrices?.[sizeId] !== undefined ? o.sizePrices[sizeId] : o.priceCents);

export interface Priced {
	name: string;
	mods: string[];
	baseCents: number;
	extrasCents: number;
	unitCents: number;
	item?: Item;
	cat?: Category;
	size?: Size;
	error?: string;
}

/** Prices one configured item; `freeOptions` extras are included (deal slots). */
export function priceSelection(menu: Menu, sel: DealPick, freeOptions = 0): Priced {
	const hit = findItem(menu, sel.itemId);
	if (!hit) return { name: 'Unknown item', mods: [], baseCents: 0, extrasCents: 0, unitCents: 0, error: 'An item in your order is no longer on the menu.' };
	const { item, cat } = hit;
	const size = sizeOf(item, sel.sizeId);
	if (sel.sizeId && item.sizes?.length && !item.sizes.some((s) => s.id === sel.sizeId)) return { name: item.name, mods: [], baseCents: 0, extrasCents: 0, unitCents: 0, item, cat, error: `${item.name}: that size is gone.` };
	const base = size ? size.priceCents : item.priceCents;
	const groups: Group[] = (item.groups ?? []).map((g) => menu.groups[g]).filter(Boolean);
	const mods: string[] = size ? [size.name] : [];
	const extras: number[] = [];
	let error: string | undefined;
	for (const g of groups) {
		const picks = sel.opts.filter((p) => p.g === g.id);
		for (const p of picks) {
			const o = g.options.find((x) => x.id === p.o);
			if (!o) {
				error = `${item.name}: an option is no longer available.`;
				continue;
			}
			const half = g.portions && p.p && p.p !== 'whole' ? ` (${p.p} half)` : '';
			if (!o.default) mods.push(o.name + half);
			else if (half) mods.push(o.name + half);
			const price = optPrice(o, size?.id);
			if (price > 0) extras.push(price);
		}
		// "NO onions": a removed default in a pick-many group. In a pick-one group the choice replaces it.
		if (g.max !== 1) for (const o of g.options) if (o.default && !picks.some((p) => p.o === o.id)) mods.push(`NO ${o.name}`);
		if (picks.length < g.min) error = `${item.name}: choose ${g.min === 1 ? 'a' : g.min} ${g.name.toLowerCase()}.`;
		if (g.max > 0 && picks.length > g.max) error = `${item.name}: up to ${g.max} ${g.name.toLowerCase()}.`;
	}
	if (sel.opts.some((p) => !groups.some((g) => g.id === p.g))) error = `${item.name}: an option doesn't belong to this item.`;
	extras.sort((a, b) => b - a);
	const charged = extras.slice(freeOptions).reduce((s, v) => s + v, 0);
	return { name: item.name, mods, baseCents: base, extrasCents: charged, unitCents: base + charged, item, cat, size, error };
}

interface Unit {
	price: number;
	item: Item;
	cat: Category;
	size?: Size;
}

function bestAutoDeal(deals: Deal[], units: Unit[], tz: string, at: Date, fulfil: Fulfil, nudges: string[]): Discount | null {
	let best: Discount | null = null;
	for (const d of deals) {
		if (!dealLive(d, tz, at, fulfil)) continue;
		let amount = 0;
		if (d.kind === 'mix' && d.mix) {
			const el = units.filter((u) => matches(d.mix!.eligible, u.item, u.cat, u.size));
			if (el.length >= d.mix.qty) amount = el.reduce((s, u) => s + Math.max(0, u.price - d.mix!.eachCents), 0);
			else if (el.length === d.mix.qty - 1) nudges.push(`Add 1 more for ${d.name}: ${money(d.mix.eachCents)} each.`);
		} else if (d.kind === 'nth' && d.nth) {
			const el = units.filter((u) => matches(d.nth!.eligible, u.item, u.cat, u.size)).sort((a, b) => b.price - a.price);
			for (let i = d.nth.n - 1; i < el.length; i += d.nth.n) amount += Math.round((el[i].price * d.nth.pct) / 100);
			if (el.length % d.nth.n === d.nth.n - 1) nudges.push(`Add 1 more for ${d.name}.`);
		}
		if (amount > 0 && (!best || amount > best.amountCents)) best = { type: 'deal', label: d.name, amountCents: amount };
	}
	return best;
}

type StoreLike = Pick<Store, 'menu' | 'deals' | 'timezone'> & { settings: Settings };

export function quote(store: StoreLike, input: QuoteInput, at: Date = new Date()): Quote {
	const { menu, deals, settings } = store;
	const errors: string[] = [];
	const warnings: string[] = [];
	const nudges: string[] = [];
	const lines: PricedLine[] = [];
	const units: Unit[] = [];
	let saved = 0;

	input.lines.forEach((line: CartLine, index) => {
		const qty = Math.min(50, Math.max(1, Math.floor(line.qty || 1)));
		if (line.kind === 'item') {
			const p = priceSelection(menu, line);
			if (p.error) errors.push(p.error);
			if (p.item && settings.soldOut.includes(p.item.id)) errors.push(`${p.item.name} is sold out right now.`);
			lines.push({ index, name: p.name, mods: line.note ? [...p.mods, `“${line.note}”`] : p.mods, qty, unitCents: p.unitCents, totalCents: p.unitCents * qty, error: p.error });
			if (p.item && p.cat) for (let i = 0; i < qty; i++) units.push({ price: p.unitCents, item: p.item, cat: p.cat, size: p.size });
		} else {
			const d = deals.find((x) => x.id === line.dealId && x.kind === 'bundle');
			if (!d || !d.slots || d.priceCents === undefined) {
				errors.push('A deal in your order has ended.');
				lines.push({ index, name: 'Ended deal', mods: [], qty, unitCents: 0, totalCents: 0, error: 'ended' });
				return;
			}
			if (!dealLive(d, store.timezone, at, input.fulfil)) errors.push(`${d.name} isn't available right now.`);
			let extras = 0;
			let regular = 0;
			const mods: string[] = [];
			d.slots.forEach((slot, i) => {
				const pick = line.picks[i];
				if (!pick) {
					errors.push(`${d.name}: finish every step.`);
					return;
				}
				const p = priceSelection(menu, pick, slot.includedOptions ?? 0);
				if (p.error) errors.push(p.error);
				if (p.item && p.cat && !matches(slot.eligible, p.item, p.cat, p.size)) errors.push(`${d.name}: ${p.name} doesn't fit “${slot.label}”.`);
				extras += p.extrasCents;
				regular += priceSelection(menu, pick).unitCents;
				mods.push([p.name, ...p.mods].join(' · '));
			});
			const unit = d.priceCents + extras;
			saved += Math.max(0, regular - unit) * qty;
			lines.push({ index, name: d.name, mods, qty, unitCents: unit, totalCents: unit * qty, regularCents: regular, deal: true });
		}
	});

	if (!lines.length) errors.push('Your order is empty.');
	const subtotal = lines.reduce((s, l) => s + l.totalCents, 0);
	const discounts: Discount[] = [];

	const auto = bestAutoDeal(deals, units, store.timezone, at, input.fulfil, nudges);
	let codeDisc: Discount | null = null;
	if (input.code) {
		const code = input.code.trim().toUpperCase();
		const d = deals.find((x) => x.kind === 'code' && x.code?.toUpperCase() === code);
		if (!d || !dealLive(d, store.timezone, at, input.fulfil)) errors.push(`Code ${code} isn't valid right now.`);
		else if (d.minSubtotalCents && subtotal < d.minSubtotalCents) errors.push(`${code} needs ${money(d.minSubtotalCents)} or more.`);
		else if (d.firstOrderOnly && input.firstOrder === false) errors.push(`${code} is for a first order only.`);
		else {
			const amt = d.pct ? Math.round((subtotal * d.pct) / 100) : Math.min(subtotal, d.amountCents ?? 0);
			codeDisc = { type: 'code', label: `Code ${code}`, amountCents: amt };
		}
	}
	if (auto && codeDisc) {
		if (codeDisc.amountCents >= auto.amountCents) {
			discounts.push(codeDisc);
			warnings.push(`Your code saves more than ${auto.label}, so we used the code.`);
		} else {
			discounts.push(auto);
			warnings.push(`${auto.label} saves more than your code, so we kept the deal.`);
		}
	} else if (auto) discounts.push(auto);
	else if (codeDisc) discounts.push(codeDisc);

	let after = Math.max(0, subtotal - discounts.reduce((s, d) => s + d.amountCents, 0));

	if (input.fulfil === 'delivery' && !settings.delivery) errors.push('This store does pickup only.');
	if (input.fulfil === 'pickup' && !settings.pickup) errors.push('This store does delivery only.');
	let deliveryFee = 0;
	if (input.fulfil === 'delivery' && settings.delivery) {
		const f = settings.deliveryFee;
		if (lines.length && after < f.minOrderCents) errors.push(`Delivery needs a ${money(f.minOrderCents)} minimum. Add ${money(f.minOrderCents - after)} more or pick it up.`);
		deliveryFee = f.model === 'free_over' && f.freeOverCents !== undefined && after >= f.freeOverCents ? 0 : f.flatCents;
		if (f.model === 'free_over' && f.freeOverCents !== undefined && after < f.freeOverCents) nudges.push(`Free delivery over ${money(f.freeOverCents)}: add ${money(f.freeOverCents - after)}.`);
	}

	if (settings.cardFee.mode === 'cash_discount' && input.payment === 'cash' && after > 0) {
		const cash = Math.round((after * settings.cardFee.bps) / 10000);
		discounts.push({ type: 'cash', label: 'Cash discount', amountCents: cash });
		after -= cash;
	}

	const serviceFee = Math.round((after * (settings.serviceFeeBps || 0)) / 10000);
	const tax = Math.round((after * settings.taxBps) / 10000);
	let tip = 0;
	if (settings.tips.enabled) {
		if (input.tipCents !== undefined && input.tipCents >= 0) tip = Math.floor(input.tipCents);
		else tip = Math.round((after * (input.tipPct ?? settings.tips.default)) / 100);
	}
	const cardFee = settings.cardFee.mode === 'surcharge' && input.payment !== 'cash' ? Math.round(((after + deliveryFee + serviceFee + tax) * settings.cardFee.bps) / 10000) : 0;
	const total = after + deliveryFee + serviceFee + tax + tip + cardFee;
	saved += discounts.reduce((s, d) => s + d.amountCents, 0);

	return {
		lines,
		subtotalCents: subtotal,
		discounts,
		deliveryFeeCents: deliveryFee,
		serviceFeeCents: serviceFee,
		taxCents: tax,
		tipCents: tip,
		cardFeeCents: cardFee,
		totalCents: total,
		savedCents: saved,
		errors: [...new Set(errors)],
		warnings,
		nudges: [...new Set(nudges)]
	};
}
