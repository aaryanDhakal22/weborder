// Where this server listens (the publisher calls itself) and how store links look in dev vs production.
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import type { Store } from '$lib/types';
import { cfg } from './config';
import { primaryHost } from './tenancy';

export function renderTarget(url: URL): { port: number; hostPort: string } {
	if (cfg.renderOrigin) {
		const u = new URL(cfg.renderOrigin);
		return { port: +(u.port || 80), hostPort: '' };
	}
	if (dev) return { port: +(url.port || 5173), hostPort: `:${url.port || 5173}` };
	return { port: +(env.PORT || 3000), hostPort: '' };
}

export function storeUrl(store: Store, url: URL): string {
	if (dev) return `http://${store.slug}.${cfg.baseDomain}:${url.port || 5173}`;
	return `https://${primaryHost(store)}`;
}
