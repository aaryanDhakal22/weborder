import { json, error } from '@sveltejs/kit';
import { source } from '$lib/server/source';
import { viewOrder } from '$lib/server/orders';

export const GET = async ({ locals, params }) => {
	if (!locals.store) error(404);
	const order = await source.getOrder(locals.store.id, params.id);
	if (!order) error(404, 'Order not found');
	return json(viewOrder(order), { headers: { 'cache-control': 'no-store' } });
};
