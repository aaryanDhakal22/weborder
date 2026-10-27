import { json, error } from '@sveltejs/kit';
import type { QuoteInput } from '$lib/types';
import { quote } from '$lib/pricing';

/** Authoritative totals for a cart: deals, fees, tax, tip, card fee. Prices come from the menu, never the client. */
export const POST = async ({ locals, request }) => {
	const store = locals.store;
	if (!store) error(404);
	let body: QuoteInput;
	try {
		body = await request.json();
	} catch {
		error(400, 'Bad request');
	}
	if (!Array.isArray(body?.lines) || body.lines.length > 60) error(400, 'Bad request');
	const q = quote(store, { lines: body.lines, fulfil: body.fulfil === 'delivery' ? 'delivery' : 'pickup', tipPct: body.tipPct, tipCents: body.tipCents, code: body.code, payment: body.payment === 'cash' ? 'cash' : 'card' });
	return json(q, { headers: { 'cache-control': 'no-store' } });
};
