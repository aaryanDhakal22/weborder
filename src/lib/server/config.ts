// Runtime configuration from the environment. The storefront serves every store from one server:
// it signs in to main with one platform key and names the host it is serving on each call.
import { env } from '$env/dynamic/private';

export const cfg = {
	/** main's base URL (dev http://localhost:1323, staging http://192.168.1.221:1323). */
	mainUrl: (env.MAIN_URL || 'http://localhost:1323').replace(/\/+$/, ''),
	/** The storefront's platform key (qpk_…), minted in main's admin (Platform keys). */
	platformKey: env.PLATFORM_KEY || '',
	/** How often a store's menu version, website settings and payments are re-checked (seconds). */
	refreshS: Math.max(5, Number(env.REFRESH_SECONDS || 30)),
	/** The order outbox's SQLite file (DURABILITY-PLAN.md); a volume in a container. */
	outboxPath: env.OUTBOX_PATH || 'data/outbox.db',
	/** How long Place order waits for main before the outbox takes over ("Still confirming"). */
	orderWaitMs: Math.max(1000, Number(env.ORDER_WAIT_MS || 22_000)),
	/** Allow plain http to a public main (never in production: the platform key would cross the internet). */
	allowInsecureMain: env.ALLOW_INSECURE_MAIN === '1' || env.ALLOW_INSECURE_MAIN === 'true',
	/** Behind a proxy that sets X-Forwarded-For / -Host (Caddy, Traefik). */
	trustProxy: env.TRUST_PROXY === '1' || env.TRUST_PROXY === 'true',
	/** Dev / LAN staging: "name:port=store-host,…" serves each store on its own port of one machine. */
	hostAliases: new Map(
		(env.HOST_ALIASES || '')
			.split(',')
			.map((p) => p.trim().toLowerCase().split('='))
			.filter((p) => p.length === 2 && p[0] && p[1]) as [string, string][]
	)
};

/** Subdomains of a platform domain that never resolve to a store. */
export const RESERVED = new Set(['www', 'main', 'staging', 'staging-main', 'ingest', 'utility', 'otlp', 'metrics', 'callcenter', 'order', 'api', 'app', 'admin', 'content', 'stores', 'mail']);
