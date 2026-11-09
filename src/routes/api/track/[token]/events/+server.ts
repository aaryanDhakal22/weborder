// A tracking page's live feed (Server-Sent Events): `event: track` with the public tracking state,
// now and after every change main reports for this order; a comment every 20 s keeps proxies open.
import { json } from '@sveltejs/kit';
import { call } from '$lib/server/main';
import { watch } from '$lib/server/track';
import { trackFor } from '$lib/server/trackauth';
import type { Track } from '$lib/types';

export const GET = async ({ locals, params, request }) => {
	const host = locals.host;
	const path = `/track/v1/${encodeURIComponent(params.token)}`;
	const first = await trackFor(host, params.token);
	if (!first.track) return json({ error: 'not found', code: 'not_found' }, { status: first.status });
	const orderId = first.track.order_id;
	const enc = new TextEncoder();
	let stop = () => {};
	const body = new ReadableStream<Uint8Array>({
		start(c) {
			let last = '';
			let busy = false;
			let again = false;
			const send = (t: Track) => {
				const s = JSON.stringify(t);
				if (s === last) return;
				last = s;
				c.enqueue(enc.encode(`event: track\ndata: ${s}\n\n`));
			};
			const refresh = async () => {
				if (busy) {
					again = true;
					return;
				}
				busy = true;
				try {
					const r = await call<Track>(host, 'GET', path);
					if (r.status === 200) send(r.data);
				} catch {
					/* main away: the next event or the poll retries */
				}
				busy = false;
				if (again) {
					again = false;
					void refresh();
				}
			};
			c.enqueue(enc.encode('retry: 3000\n\n'));
			send(first.track!);
			const unwatch = watch(host, orderId, refresh);
			const poll = setInterval(refresh, 30_000); // in case the upstream stream is down
			const keep = setInterval(() => c.enqueue(enc.encode(': keepalive\n\n')), 20_000);
			stop = () => {
				unwatch();
				clearInterval(poll);
				clearInterval(keep);
			};
			request.signal.addEventListener('abort', () => {
				stop();
				try {
					c.close();
				} catch {
					/* already closed */
				}
			});
		},
		cancel() {
			stop();
		}
	});
	return new Response(body, { headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', 'x-accel-buffering': 'no' } });
};
