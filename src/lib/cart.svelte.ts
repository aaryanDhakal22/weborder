// The cart lives in the browser (a convenience; losing it is harmless). Totals shown at checkout
// always come from the server's /api/quote.
import type { CartLine, Fulfil } from './types';

export interface CartEntry {
	line: CartLine;
	name: string;
	mods: string[];
	unitCents: number;
}

const KEY = 'qcart';
const keyOf = (l: CartLine) => JSON.stringify({ ...l, qty: 0 });

class Cart {
	entries = $state<CartEntry[]>([]);
	fulfil = $state<Fulfil>('pickup');
	code = $state('');
	bump = $state(0);
	ready = $state(false);

	count = $derived(this.entries.reduce((s, e) => s + e.line.qty, 0));
	subtotal = $derived(this.entries.reduce((s, e) => s + e.unitCents * e.line.qty, 0));

	load(defaultFulfil: Fulfil, allowed: Fulfil[]) {
		try {
			const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null');
			if (raw && Date.now() - raw.at < 24 * 3600_000) {
				this.entries = raw.entries ?? [];
				this.code = raw.code ?? '';
				if (allowed.includes(raw.fulfil)) this.fulfil = raw.fulfil;
				else this.fulfil = defaultFulfil;
			} else this.fulfil = defaultFulfil;
		} catch {
			this.fulfil = defaultFulfil;
		}
		this.ready = true;
	}
	save() {
		try {
			localStorage.setItem(KEY, JSON.stringify({ entries: this.entries, fulfil: this.fulfil, code: this.code, at: Date.now() }));
		} catch {
			/* private mode: the cart still works for this visit */
		}
	}
	add(entry: CartEntry) {
		const k = keyOf(entry.line);
		const same = this.entries.find((e) => keyOf(e.line) === k);
		if (same) same.line.qty += entry.line.qty;
		else this.entries.push(entry);
		this.bump++;
		this.save();
	}
	setQty(i: number, qty: number) {
		if (qty <= 0) this.entries.splice(i, 1);
		else this.entries[i].line.qty = Math.min(50, qty);
		this.save();
	}
	setFulfil(f: Fulfil) {
		this.fulfil = f;
		this.save();
	}
	clear() {
		this.entries = [];
		this.code = '';
		this.save();
	}
}

export const cart = new Cart();
