import { error } from '@sveltejs/kit';
import { source } from '$lib/server/source';
import { viewOrder } from '$lib/server/orders';

export const load = async ({ locals, params, setHeaders }) => {
	const store = locals.store!;
	const order = await source.getOrder(store.id, params.id);
	if (!order) error(404, 'Order not found');
	setHeaders({ 'cache-control': 'no-store' });
	return { order: viewOrder(order), lines: order.quote.lines };
};
