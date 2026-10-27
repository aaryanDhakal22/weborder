// The one seam between the storefront and its data. `mock` implements it with JSON files;
// `main` implements it against quicc main's /site/v1 API (docs/MAIN-API.md). Pages, API routes,
// the admin and the publisher only ever talk to this interface.
import type { Order, Store } from '$lib/types';

export interface DataSource {
	readonly name: 'mock' | 'main';
	listStores(): Promise<Store[]>;
	getStore(id: string): Promise<Store | null>;
	/** Resolves a request host (no port) to its store: <slug>.<baseDomain> or a verified custom domain. */
	storeByHost(host: string): Promise<Store | null>;
	saveStore(store: Store): Promise<void>;
	/** Kitchen number for the next order (agent-side in production; 1100+ per store). */
	nextKitchenNo(storeId: string): Promise<number>;
	createOrder(order: Order): Promise<void>;
	saveOrder(order: Order): Promise<void>;
	getOrder(storeId: string, publicId: string): Promise<Order | null>;
	listOrders(storeId: string, limit?: number): Promise<Order[]>;
	/** True when this phone has ordered from this store before (first-order codes). */
	hasOrdered(storeId: string, phone: string): Promise<boolean>;
}
