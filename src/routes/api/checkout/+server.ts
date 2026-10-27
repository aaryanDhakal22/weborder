import { json, error } from '@sveltejs/kit';
import { placeOrder, type CheckoutBody } from '$lib/server/orders';

const STATUS: Record<string, number> = { declined: 402, card_number: 402, card_exp: 402, card_cvc: 402, paused: 409, closed: 409, outside_zone: 422 };

export const POST = async ({ locals, request }) => {
	const store = locals.store;
	if (!store) error(404);
	let body: CheckoutBody;
	try {
		body = await request.json();
	} catch {
		error(400, 'Bad request');
	}
	const res = await placeOrder(store, body);
	if (res.ok) return json(res, { headers: { 'cache-control': 'no-store' } });
	return json(res, { status: STATUS[res.code] ?? 400, headers: { 'cache-control': 'no-store' } });
};
