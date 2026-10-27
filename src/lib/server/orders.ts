// Checkout and order tracking. In production the order goes to main (casting/site) and its status
// comes back from the Pi's floor.events; here the "floor" is simulated on a timeline the admin can override.
import { randomBytes, randomUUID } from 'node:crypto';
import type { CartLine, Fulfil, Order, OrderStatus, OrderView, Store } from '$lib/types';
import { quote } from '$lib/pricing';
import { isOpen } from '$lib/hours';
import { cfg } from './config';
import { source } from './source';
import { authorize } from './payments';

export interface CheckoutBody {
	key: string;
	lines: CartLine[];
	fulfil: Fulfil;
	when: { asap: boolean; at?: string };
	customer: { name: string; phone: string; email?: string; optIn?: boolean };
	address?: { line1: string; line2?: string; zip: string; notes?: string };
	tipPct?: number;
	tipCents?: number;
	code?: string;
	payment: { method: 'card' | 'cash'; card?: { number: string; exp: string; cvc: string } };
}

export type CheckoutResult = { ok: true; publicId: string } | { ok: false; code: string; message: string };

const recent = new Map<string, string>();

function publicId() {
	const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
	return [...randomBytes(12)].map((b) => alphabet[b % alphabet.length]).join('');
}

const fail = (code: string, message: string): CheckoutResult => ({ ok: false, code, message });

export async function placeOrder(store: Store, body: CheckoutBody, now = new Date()): Promise<CheckoutResult> {
	if (!body || typeof body !== 'object') return fail('bad_request', 'Something went wrong. Refresh and try again.');
	const dedupe = `${store.id}:${String(body.key ?? '').slice(0, 64)}`;
	if (body.key && recent.has(dedupe)) return { ok: true, publicId: recent.get(dedupe)! };
	if (!Array.isArray(body.lines) || !body.lines.length || body.lines.length > 60) return fail('empty', 'Your order is empty.');
	const name = String(body.customer?.name ?? '').trim();
	const phone = String(body.customer?.phone ?? '').replace(/\D/g, '');
	if (name.length < 1 || name.length > 80) return fail('name', 'Add your name so we know whose order it is.');
	if (phone.length < 10 || phone.length > 15) return fail('phone', 'Add a phone number with area code. We only call if something is wrong.');
	const email = String(body.customer?.email ?? '').trim();
	if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('email', 'That email looks off. Leave it empty if you like.');
	const fulfil: Fulfil = body.fulfil === 'delivery' ? 'delivery' : 'pickup';
	if (fulfil === 'delivery' && !store.settings.delivery) return fail('fulfil', 'This store does pickup only.');
	if (fulfil === 'pickup' && !store.settings.pickup) return fail('fulfil', 'This store does delivery only.');

	let address: Order['address'];
	if (fulfil === 'delivery') {
		const line1 = String(body.address?.line1 ?? '').trim();
		const zip = String(body.address?.zip ?? '').trim().slice(0, 5);
		if (line1.length < 3 || !/^\d{5}$/.test(zip)) return fail('address', 'Add your street address and ZIP code.');
		if (store.settings.deliveryZips.length && !store.settings.deliveryZips.includes(zip)) return fail('outside_zone', 'That ZIP is outside our delivery area. Pickup works any time.');
		address = { line1, line2: String(body.address?.line2 ?? '').trim() || undefined, zip, notes: String(body.address?.notes ?? '').trim().slice(0, 200) || undefined };
	}

	const asap = body.when?.asap !== false;
	let at: string | undefined;
	if (asap) {
		if (store.settings.pausedUntil && new Date(store.settings.pausedUntil) > now) return fail('paused', 'Online orders are paused for a few minutes. Schedule it for later, or call us.');
		if (!isOpen(store.hours, store.timezone, now)) return fail('closed', "We're closed right now. Schedule your order for when we open.");
	} else {
		const when = new Date(String(body.when?.at ?? ''));
		const maxAhead = store.settings.scheduling.daysAhead * 86400_000;
		if (!store.settings.scheduling.enabled || isNaN(+when) || +when < +now + 10 * 60_000 || +when > +now + maxAhead || !isOpen(store.hours, store.timezone, when)) return fail('bad_time', 'Pick a time while we are open, at least 10 minutes from now.');
		at = when.toISOString();
	}

	const firstOrder = !(await source.hasOrdered(store.id, phone));
	const q = quote(store, { lines: body.lines, fulfil, tipPct: body.tipPct, tipCents: body.tipCents, code: body.code, payment: body.payment?.method === 'cash' ? 'cash' : 'card', firstOrder }, now);
	if (q.errors.length) return fail('quote', q.errors[0]);

	let payment: Order['payment'];
	if (body.payment?.method === 'cash') {
		if (!store.settings.cash) return fail('payment', 'This store takes cards only online.');
		payment = { method: 'cash', status: 'pending' };
	} else {
		const auth = await authorize(store, q.totalCents, body.payment?.card);
		if (!auth.ok) return fail(auth.code, auth.message);
		payment = { method: 'card', status: 'captured', last4: auth.last4 };
	}

	const busy = store.settings.busyEtaMin ?? 0;
	const order: Order = {
		id: randomUUID(),
		publicId: publicId(),
		storeId: store.id,
		kitchenNo: await source.nextKitchenNo(store.id),
		createdAt: now.toISOString(),
		fulfil,
		when: { asap, at },
		customer: { name, phone, email: email || undefined, optIn: !!body.customer?.optIn },
		address,
		lines: body.lines,
		quote: q,
		payment,
		prepMin: Math.max(busy, fulfil === 'delivery' ? store.settings.etaDeliveryMin : store.settings.etaPickupMin)
	};
	await source.createOrder(order);
	if (body.key) recent.set(dedupe, order.publicId);
	return { ok: true, publicId: order.publicId };
}

const FLOW: Record<Fulfil, OrderStatus[]> = { pickup: ['received', 'accepted', 'cooking', 'ready', 'done'], delivery: ['received', 'accepted', 'cooking', 'out', 'done'] };

/** Seconds after placing when each stage starts (the stand-in for the Pi's floor events). */
function offsets(order: Order): number[] {
	if (cfg.floor === 'fast') return [0, 6, 12, 40, 90];
	const prep = order.prepMin * 60;
	return [0, 60, 120, Math.round(prep * 0.7), prep];
}

export function viewOrder(order: Order, now = new Date()): OrderView {
	const flow = FLOW[order.fulfil];
	const start = order.when.asap ? +new Date(order.createdAt) : +new Date(order.when.at!) - order.prepMin * 60_000;
	const stages = flow.map((status) => ({ status, at: null as string | null }));
	let status: OrderStatus;
	if (order.manual?.length) {
		status = order.manual[order.manual.length - 1].status;
		stages[0].at = order.createdAt;
		for (const m of order.manual) {
			const i = flow.indexOf(m.status);
			if (i >= 0) stages[i].at = m.at;
		}
		const cur = flow.indexOf(status);
		for (let i = 1; i <= cur; i++) stages[i].at ??= stages[i - 1].at;
	} else {
		const off = offsets(order);
		const elapsed = (+now - start) / 1000;
		let idx = 0;
		off.forEach((o, i) => {
			if (elapsed >= o || i === 0) {
				idx = i;
				stages[i].at = new Date(i === 0 ? +new Date(order.createdAt) : start + o * 1000).toISOString();
			}
		});
		status = flow[idx];
	}
	if (order.manual?.some((m) => m.status === 'cancelled')) status = 'cancelled';
	const due = new Date(start + order.prepMin * 60_000).toISOString();
	return {
		publicId: order.publicId,
		kitchenNo: order.kitchenNo,
		status,
		fulfil: order.fulfil,
		createdAt: order.createdAt,
		readyBy: order.fulfil === 'pickup' ? due : null,
		arrivesBy: order.fulfil === 'delivery' ? due : null,
		stages,
		quote: order.quote,
		payment: order.payment,
		customerName: order.customer.name.split(' ')[0]
	};
}

export async function advanceOrder(order: Order, to?: OrderStatus): Promise<Order> {
	const flow = FLOW[order.fulfil];
	const cur = viewOrder(order).status;
	const next = to ?? flow[Math.min(flow.length - 1, flow.indexOf(cur) + 1)];
	order.manual = [...(order.manual ?? []), { status: next, at: new Date().toISOString() }];
	await source.saveOrder(order);
	return order;
}
