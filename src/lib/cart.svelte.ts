// The cart lives in the browser (a convenience; losing it is harmless). Lines are main's CartLine;
// what the customer sees at checkout always comes from main's /quote.
import type { CartEntry, Fulfil } from './types';

/** A coupon the customer applied: main's cart coupon (a coupon deal + the cart line units it takes, one
 * index per unit), as the quote's coupon_offers give it. A coupon re-prices its lines (never a discount). */
export interface CartCoupon {
	id: string;
	lines: number[];
}

const KEY = 'qcart2';
const keyOf = (e: CartEntry) => JSON.stringify({ ...e.line, qty: 0 });

class Cart {
	entries = $state<CartEntry[]>([]);
	fulfil = $state<Fulfil>('pickup');
	code = $state('');
	coupons = $state<CartCoupon[]>([]);
	bump = $state(0);
	ready = $state(false);
	/** One idempotency key per cart: kept across retries of an unanswered attempt (and 3-D Secure),
	 * new after the cart changes, after an order is placed, and after any final refusal. */
	clientOrderId = $state('');
	/** A key main hasn't answered for yet (the outbox is on it): checkout shows "Still confirming". */
	pending = $state('');

	count = $derived(this.entries.reduce((s, e) => s + (e.line.qty ?? 1), 0));
	subtotal = $derived(this.entries.reduce((s, e) => s + e.unitCents * (e.line.qty ?? 1), 0));

	load(defaultFulfil: Fulfil, allowed: Fulfil[]) {
		try {
			const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null');
			if (raw && Date.now() - raw.at < 24 * 3600_000) {
				this.entries = raw.entries ?? [];
				this.code = raw.code ?? '';
				this.coupons = Array.isArray(raw.coupons) ? raw.coupons : [];
				this.clientOrderId = raw.cid ?? '';
				this.pending = raw.pend ?? '';
				this.fulfil = allowed.includes(raw.fulfil) ? raw.fulfil : defaultFulfil;
			} else this.fulfil = defaultFulfil;
		} catch {
			this.fulfil = defaultFulfil;
		}
		if (!this.clientOrderId) this.clientOrderId = newId();
		this.ready = true;
	}
	save() {
		try {
			localStorage.setItem(KEY, JSON.stringify({ entries: this.entries, fulfil: this.fulfil, code: this.code, coupons: this.coupons, cid: this.clientOrderId, pend: this.pending, at: Date.now() }));
		} catch {
			/* private mode: the cart still works for this visit */
		}
	}
	/** A changed cart is a different order: a new idempotency key. */
	private changed() {
		this.clientOrderId = newId();
		this.bump++;
		this.save();
	}
	add(entry: CartEntry) {
		const k = keyOf(entry);
		const same = this.entries.find((e) => keyOf(e) === k);
		if (same) same.line.qty = Math.min(50, (same.line.qty ?? 1) + (entry.line.qty ?? 1));
		else this.entries.push(entry);
		this.changed();
	}
	setQty(i: number, qty: number) {
		if (qty <= 0) {
			this.entries.splice(i, 1);
			// a coupon that took the line goes; the others follow the lines after it down
			this.coupons = this.coupons.filter((c) => !c.lines.includes(i)).map((c) => ({ ...c, lines: c.lines.map((x) => (x > i ? x - 1 : x)) }));
		} else {
			this.entries[i].line.qty = Math.min(50, qty);
			// fewer units than a coupon takes of the line: that coupon goes
			const n = this.entries[i].line.qty ?? 1;
			this.coupons = this.coupons.filter((c) => c.lines.filter((x) => x === i).length <= n);
		}
		this.changed();
	}
	replace(entries: CartEntry[]) {
		this.entries = entries;
		this.coupons = [];
		this.changed();
	}
	/** Applies a coupon main offered (its id + the units it takes). */
	applyCoupon(c: CartCoupon) {
		this.coupons = [...this.coupons.filter((x) => x.id !== c.id || x.lines.join() !== c.lines.join()), { id: c.id, lines: [...c.lines] }];
		this.changed();
	}
	/** Takes the n-th applied coupon off (its lines go back to their own prices). */
	removeCoupon(n: number) {
		this.coupons = this.coupons.filter((_, k) => k !== n);
		this.changed();
	}
	/** Keeps only the coupons main applied (by their index in cart.coupons): the rest no longer fit. */
	keepCoupons(applied: number[]) {
		const next = this.coupons.filter((_, k) => applied.includes(k));
		if (next.length === this.coupons.length) return false;
		this.coupons = next;
		this.changed();
		return true;
	}
	/** A final refusal ends the key: the next attempt is a new order. */
	renewKey() {
		this.clientOrderId = newId();
		this.pending = '';
		this.save();
	}
	setPending(key: string) {
		this.pending = key;
		this.save();
	}
	setFulfil(f: Fulfil) {
		this.fulfil = f;
		this.save();
	}
	setCode(c: string) {
		this.code = c;
		this.save();
	}
	clear() {
		this.entries = [];
		this.code = '';
		this.coupons = [];
		this.pending = '';
		this.changed();
	}
}

function newId(): string {
	const b = new Uint8Array(12);
	crypto.getRandomValues(b);
	return 'w-' + Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

export const cart = new Cart();
