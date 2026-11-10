// Host → the store's data, cached per host. A store is built from main's answers (me, store,
// site, menu, pricing, payments) once, then re-checked every REFRESH_SECONDS: the menu version and
// the website settings decide whether the menu and pricing are fetched again. Requests never wait
// on a refresh once a store is cached (stale-while-revalidate); a host main doesn't know is
// remembered as unknown for one refresh period.
import type { Me, Menu, Payments, Site, StoreStatus, StoreView } from '$lib/types';
import type { Context } from '$lib/engine';
import { cfg } from './config';
import { get, MainError } from './main';
import { DEFAULT_LOOK, lookFrom, shapeMenu } from '$lib/look';

export { DEFAULT_LOOK, lookFrom, shapeMenu };

interface Entry {
	view: StoreView | null;
	status: StoreStatus | null;
	checkedAt: number;
	statusAt: number;
	menuVersion: number;
	siteVersion: number;
	inflight: Promise<void> | null;
	error: string | null;
}

const cache = new Map<string, Entry>();

/** "From the menu": the store's picks (Store › Website, up to 8, ones still on the menu), else a sampler: the
 *  first item of each of the first categories (no popularity claims until main has order counts). */
export function picksOf(menu: Menu, picks: string[]): string[] {
	const on = new Set(menu.categories.flatMap((c) => c.items.map((i) => i.id)));
	const mine = picks.filter((id) => on.has(id));
	if (mine.length) return mine;
	return menu.categories.slice(0, 6).flatMap((c) => c.items.filter((i) => !i.sold_out).slice(0, 1).map((i) => i.id));
}

/** The store with its draft look, for the preview link (never cached: the store is editing it).
 *  null = the token is stale (the page drops the prefix). */
export async function previewOf(host: string, view: StoreView, token: string): Promise<StoreView | null> {
	try {
		const site = await get<Site>(host, `/channel/v1/site?preview=${encodeURIComponent(token)}`);
		const look = lookFrom(site.settings);
		return { ...view, look, preview: true, popular: picksOf(view.menu, look.picks) };
	} catch (err) {
		if (err instanceof MainError && (err.code === 'bad_preview' || err.status === 403)) return null;
		throw err;
	}
}

async function build(host: string, e: Entry): Promise<void> {
	const [me, status, site, menu, pricing, payments] = await Promise.all([
		get<Me>(host, '/channel/v1/me'),
		get<StoreStatus>(host, '/channel/v1/store'),
		get<Site>(host, '/channel/v1/site'),
		get<Menu>(host, '/channel/v1/menu'),
		get<Context & { menu_version: number }>(host, '/channel/v1/pricing'),
		get<Payments>(host, '/channel/v1/payments')
	]);
	const shaped = shapeMenu(menu);
	const { menu_version: _v, ...ctx } = pricing;
	e.view = {
		name: status.store.name || me.store.name,
		slug: host.split('.')[0],
		timezone: status.store.timezone || me.store.timezone,
		phone: status.store.phone,
		address: { line1: status.store.address_line1, line2: status.store.address_line2 },
		look: lookFrom(site.settings),
		host: site.primary_host || host,
		email: site.email ?? '',
		menu: shaped,
		pricing: ctx as Omit<Context, 'menu'>,
		payments,
		deals: (pricing.deals ?? []).filter((d) => d.active),
		popular: picksOf(shaped, lookFrom(site.settings).picks)
	};
	e.status = status;
	e.statusAt = Date.now();
	e.menuVersion = menu.version;
	e.siteVersion = site.version;
}

async function refresh(host: string, e: Entry): Promise<void> {
	try {
		if (!e.view) {
			await build(host, e);
		} else {
			const [ver, site, payments] = await Promise.all([
				get<{ version: number }>(host, '/channel/v1/menu/version'),
				get<Site>(host, '/channel/v1/site'),
				get<Payments>(host, '/channel/v1/payments')
			]);
			if (ver.version !== e.menuVersion || site.version !== e.siteVersion) await build(host, e);
			else e.view = { ...e.view, payments, host: site.primary_host || host };
		}
		e.error = null;
	} catch (err) {
		if (err instanceof MainError && (err.code === 'unknown_site' || err.code === 'host_required')) {
			e.view = null;
			e.status = null;
			e.error = 'unknown';
		} else {
			e.error = (err as Error).message;
			if (!e.view) e.error = `unavailable: ${e.error}`;
		}
	} finally {
		e.checkedAt = Date.now();
		e.inflight = null;
	}
}

export type Resolved = { kind: 'store'; view: StoreView } | { kind: 'unknown' } | { kind: 'unavailable'; reason: string };

/** The store a host serves. Waits only the first time (or after an unknown answer has expired). */
export async function storeFor(host: string): Promise<Resolved> {
	let e = cache.get(host);
	if (!e) {
		e = { view: null, status: null, checkedAt: 0, statusAt: 0, menuVersion: -1, siteVersion: -1, inflight: null, error: null };
		cache.set(host, e);
	}
	const stale = Date.now() - e.checkedAt > cfg.refreshS * 1000;
	if (stale && !e.inflight) e.inflight = refresh(host, e);
	if (!e.view && e.inflight) await e.inflight;
	if (e.view) return { kind: 'store', view: e.view };
	if (e.error === 'unknown') return { kind: 'unknown' };
	return { kind: 'unavailable', reason: e.error ?? 'unavailable' };
}

/** Live store status (open / paused / sold out / ETAs): at most ~10 s old. */
export async function statusFor(host: string): Promise<StoreStatus | null> {
	const e = cache.get(host);
	if (e?.status && Date.now() - e.statusAt < 10_000) return e.status;
	try {
		const s = await get<StoreStatus>(host, '/channel/v1/store', { timeoutMs: 4000 });
		if (e) {
			e.status = s;
			e.statusAt = Date.now();
		}
		return s;
	} catch {
		return e?.status ?? null;
	}
}

/** Drops a host's cache (tests). */
export function forget(host?: string) {
	if (host) cache.delete(host);
	else cache.clear();
}
