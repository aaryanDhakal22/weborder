import { error } from '@sveltejs/kit';
import { source } from '$lib/server/source';
import { viewOrder } from '$lib/server/orders';

/** Server-sent events: the order's status every few seconds until it is done (in production: main's floor.events mirror). */
export const GET = async ({ locals, params, request }) => {
	const store = locals.store;
	if (!store) error(404);
	const first = await source.getOrder(store.id, params.id);
	if (!first) error(404, 'Order not found');
	const enc = new TextEncoder();
	let timer: ReturnType<typeof setInterval> | undefined;
	let last = '';
	const stream = new ReadableStream({
		start(controller) {
			const started = Date.now();
			const tick = async () => {
				try {
					const o = await source.getOrder(store.id, params.id);
					if (!o) return;
					const v = viewOrder(o);
					const payload = JSON.stringify(v);
					if (payload !== last) controller.enqueue(enc.encode(`event: status\ndata: ${payload}\n\n`));
					else controller.enqueue(enc.encode(`: keep-alive\n\n`));
					last = payload;
					if (v.status === 'done' || v.status === 'cancelled' || Date.now() - started > 30 * 60_000) {
						clearInterval(timer);
						controller.close();
					}
				} catch {
					clearInterval(timer);
				}
			};
			tick();
			timer = setInterval(tick, 3000);
			request.signal.addEventListener('abort', () => clearInterval(timer));
		},
		cancel() {
			clearInterval(timer);
		}
	});
	return new Response(stream, { headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive', 'x-accel-buffering': 'no' } });
};
