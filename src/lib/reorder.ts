// Reorder a past order (account page, the home page's "Order again"): main rebuilds its lines from
// today's menu; whatever is still on it fills the cart, the rest comes back as `dropped`.
import { api } from './account.svelte';
import { cart } from './cart.svelte';
import type { CartEntry, PastOrder, Quote } from './types';

/** true = the cart now holds the order (check `dropped` for what's no longer on the menu). */
export async function reorder(o: PastOrder): Promise<{ ok: boolean; dropped: string[] }> {
	const r = await api<{ lines: CartEntry['line'][]; dropped: string[]; quote: Quote | null }>('POST', `/api/account/orders/${o.id}/reorder`);
	if (!r.lines.length) return { ok: false, dropped: r.dropped };
	const entries: CartEntry[] = r.lines.map((line, i) => {
		const q = r.quote?.lines.find((x) => x.index === i);
		return { line, name: q?.name ?? '', mods: q?.mods ?? [], unitCents: q?.unit_cents ?? 0 };
	});
	cart.replace(entries);
	cart.setFulfil(o.type);
	return { ok: true, dropped: r.dropped };
}
