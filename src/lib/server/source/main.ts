// The connection to quicc main, ready for when main grows its /site/v1 API (docs/MAIN-API.md).
// Set DATA_SOURCE=main, MAIN_URL and MAIN_SITE_KEY. Every method maps to exactly one main endpoint;
// main enforces tenancy (RLS on the storefront role) from the host we forward, never from ids alone.
import type { Order, Store } from '$lib/types';
import type { DataSource } from './types';
import { cfg } from '../config';

class MainError extends Error {
	constructor(
		public status: number,
		message: string
	) {
		super(message);
	}
}

async function call<T>(method: string, path: string, opts: { host?: string; body?: unknown } = {}): Promise<T> {
	const res = await fetch(new URL(path, cfg.mainUrl), {
		method,
		headers: {
			authorization: `Bearer ${cfg.mainKey}`,
			accept: 'application/json',
			...(opts.body ? { 'content-type': 'application/json' } : {}),
			// main resolves the tenant from this, exactly like a storefront request.
			...(opts.host ? { 'x-forwarded-host': opts.host } : {})
		},
		body: opts.body ? JSON.stringify(opts.body) : undefined,
		signal: AbortSignal.timeout(5000)
	});
	if (res.status === 404) return null as T;
	if (!res.ok) throw new MainError(res.status, `main ${method} ${path}: ${res.status} ${await res.text()}`);
	return (await res.json()) as T;
}

export class MainSource implements DataSource {
	readonly name = 'main' as const;
	/** GET /admin/v1/sites → every store bundle (admin key). */
	listStores() {
		return call<Store[]>('GET', '/admin/v1/sites');
	}
	/** GET /admin/v1/sites/{id} */
	getStore(id: string) {
		return call<Store | null>('GET', `/admin/v1/sites/${encodeURIComponent(id)}`);
	}
	/** GET /site/v1/bundle with X-Forwarded-Host → the store that host resolves to, or 404. */
	storeByHost(host: string) {
		return call<Store | null>('GET', '/site/v1/bundle', { host });
	}
	/** PUT /admin/v1/sites/{id} — main splits it into tenant, location, site_settings, menu and deals writes. */
	async saveStore(store: Store) {
		await call('PUT', `/admin/v1/sites/${encodeURIComponent(store.id)}`, { body: store });
	}
	/** Kitchen numbers are assigned by the store's agent at accept time; main returns 0 until then. */
	async nextKitchenNo() {
		return 0;
	}
	/** POST /site/v1/orders (casting/site → order persist → outbox → SSE → Pi). Idempotent on order.id. */
	async createOrder(order: Order) {
		const store = await this.getStore(order.storeId);
		await call('POST', '/site/v1/orders', { host: store?.domains[0] ?? `${store?.slug}.${cfg.baseDomain}`, body: order });
	}
	/** Orders are owned by main and the Pi after creation; the storefront never rewrites them. */
	async saveOrder() {
		throw new Error('saveOrder is mock-only: in production order state comes from the Pi via main');
	}
	/** GET /site/v1/orders/{publicId} — status mirrored from the agent's floor.events. */
	async getOrder(storeId: string, publicId: string) {
		const store = await this.getStore(storeId);
		return call<Order | null>('GET', `/site/v1/orders/${encodeURIComponent(publicId)}`, { host: store ? `${store.slug}.${cfg.baseDomain}` : undefined });
	}
	/** GET /admin/v1/sites/{id}/orders?limit= */
	listOrders(storeId: string, limit = 50) {
		return call<Order[]>('GET', `/admin/v1/sites/${encodeURIComponent(storeId)}/orders?limit=${limit}`);
	}
	/** GET /admin/v1/sites/{id}/customers/has-ordered?phone= */
	async hasOrdered(storeId: string, phone: string) {
		const r = await call<{ ordered: boolean }>('GET', `/admin/v1/sites/${encodeURIComponent(storeId)}/customers/has-ordered?phone=${encodeURIComponent(phone)}`);
		return !!r?.ordered;
	}
}
