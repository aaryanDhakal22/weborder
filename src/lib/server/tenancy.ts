// Host → tenant. The only place a request is tied to a store; everything downstream uses locals.store.
import type { PublicStore, Store } from '$lib/types';
import { cfg, RESERVED } from './config';
import { source } from './source';

export type HostKind = { kind: 'admin' } | { kind: 'store'; store: Store } | { kind: 'unknown' };

export function cleanHost(raw: string | null): string {
	const h = (raw ?? '').split(',')[0].trim().toLowerCase();
	return (cfg.hostAliases.get(h) ?? h).replace(/:\d+$/, '').replace(/\.$/, '');
}

export async function resolveHost(host: string): Promise<HostKind> {
	if (!host) return { kind: 'unknown' };
	if (host === cfg.adminHost) return { kind: 'admin' };
	const suffix = `.${cfg.baseDomain}`;
	if (host.endsWith(suffix) && RESERVED.has(host.slice(0, -suffix.length))) return { kind: 'unknown' };
	const store = await source.storeByHost(host);
	return store ? { kind: 'store', store } : { kind: 'unknown' };
}

/** The HOST_ALIASES entry ("name:port") that serves this host, if any. */
export function aliasOf(host: string): string | undefined {
	for (const [alias, target] of cfg.hostAliases) if (target === host) return alias;
}

/** The canonical host: the first verified custom domain, else <slug>.<baseDomain>. */
export function primaryHost(store: Store): string {
	return store.domains[0] ?? `${store.slug}.${cfg.baseDomain}`;
}

export function toPublic(store: Store): PublicStore {
	const { customHtml: _h, ...site } = store.site;
	const s = store.settings;
	return {
		id: store.id,
		slug: store.slug,
		name: store.name,
		storeType: store.storeType,
		cuisine: store.cuisine,
		priceRange: store.priceRange,
		timezone: store.timezone,
		address: store.address,
		phone: store.phone,
		geo: store.geo,
		deliveryRadiusM: store.deliveryRadiusM,
		hours: store.hours,
		site,
		settings: { pickup: s.pickup, delivery: s.delivery, etaPickupMin: s.etaPickupMin, etaDeliveryMin: s.etaDeliveryMin, deliveryFee: s.deliveryFee, taxBps: s.taxBps, tips: s.tips, cash: s.cash, cardFee: s.cardFee, scheduling: s.scheduling, serviceFeeBps: s.serviceFeeBps },
		categories: store.menu.categories.filter((c) => c.items.some((i) => i.online !== false)).map((c) => ({ id: c.id, slug: c.slug, name: c.name, nameEs: c.nameEs })),
		version: store.publish.current
	};
}
