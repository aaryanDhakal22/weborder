// A tracking token is global on main, so a store's site only shows orders its own website channel
// took: the order must answer on /channel/v1/orders/{id}/status for this host (else 404).
// `ip` is the customer's: main limits /track/v1 per customer (X-Customer-IP, believed only with our
// platform key), not per storefront — without it every customer shares one limit.
import { call } from './main';
import type { Track } from '$lib/types';

export async function trackFor(host: string, token: string, ip: string): Promise<{ status: number; track: Track | null }> {
	const r = await call<Track>(host, 'GET', `/track/v1/${encodeURIComponent(token)}`, { ip }).catch(() => null);
	if (!r || r.status !== 200) return { status: r?.status === 429 ? 429 : 404, track: null };
	const own = await call(host, 'GET', `/channel/v1/orders/${r.data.order_id}/status`).catch(() => null);
	if (!own || own.status !== 200) return { status: 404, track: null };
	return { status: 200, track: r.data };
}
