// Runtime configuration from the environment. Every value has a dev default so `npm run dev` just works.
import { env } from '$env/dynamic/private';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';

export const cfg = {
	/** Where the mock data source and published snapshots live. */
	dataDir: resolve(env.DATA_DIR || 'data'),
	/** Stores answer on <slug>.<baseDomain>; quiccpos.com in production. */
	baseDomain: (env.BASE_DOMAIN || 'localhost').toLowerCase(),
	adminHost: (env.ADMIN_HOST || 'admin.localhost').toLowerCase(),
	adminPassword: env.ADMIN_PASSWORD || 'quicc-dev',
	/** Signs admin sessions, preview links and the publisher's render requests. */
	secret: env.SECRET || randomBytes(32).toString('hex'),
	/** 'mock' (file-backed, this repo) or 'main' (quicc main's /site/v1 API). */
	source: (env.DATA_SOURCE || 'mock') as 'mock' | 'main',
	mainUrl: env.MAIN_URL || 'http://localhost:1323',
	mainKey: env.MAIN_SITE_KEY || '',
	/** Serve published snapshots before rendering ('off' to always render). */
	snapshots: env.SNAPSHOTS !== 'off',
	/** Order tracking stages advance in seconds ('fast', for demos) or minutes ('real'). */
	floor: (env.DEMO_FLOOR || 'fast') as 'fast' | 'real',
	/** Publisher renders pages by calling this server; defaults to the request's own port. */
	renderOrigin: env.RENDER_ORIGIN || '',
	/** Dev/demo only: "host:port=store-host,…" lets one machine name serve each store on its own port. */
	hostAliases: new Map(
		(env.HOST_ALIASES || '')
			.split(',')
			.map((p) => p.trim().toLowerCase().split('='))
			.filter((p) => p.length === 2 && p[0] && p[1]) as [string, string][]
	)
};

export const RESERVED = new Set(['www', 'main', 'staging', 'staging-main', 'ingest', 'utility', 'otlp', 'metrics', 'callcenter', 'order', 'api', 'app', 'admin', 'content', 'stores', 'mail']);
