// Publishing = asking this server to render every page of one store and saving the answers as files.
// Output: data/sites/<storeId>/releases/<version>/…, then an atomic `current` symlink swap.
// Snapshots are served first by hooks.server.ts (or Caddy/Cloudflare in production); live SSR covers the rest.
import http from 'node:http';
import { promisify } from 'node:util';
import { brotliCompress, constants as zc, gzip } from 'node:zlib';

const br = promisify(brotliCompress);
const gz = promisify(gzip);
import { existsSync } from 'node:fs';
import { mkdir, readdir, rename, rm, symlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { PublishRecord, Store } from '$lib/types';
import { cfg } from './config';
import { RENDER_HEADER, renderToken } from './auth';
import { source } from './source';
import { primaryHost } from './tenancy';

export function sitePaths(store: Store): string[] {
	const pages = ['/', '/menu', '/deals', '/contact'];
	for (const c of store.menu.categories) for (const i of c.items) if (i.online !== false) pages.push(`/menu/${i.slug}`);
	for (const d of store.deals) if (d.active && d.kind !== 'code') pages.push(`/deals/${d.slug}`);
	const [, ...extra] = store.site.languages;
	const all = [...pages];
	for (const lang of extra) for (const p of pages) all.push(p === '/' ? `/${lang}` : `/${lang}${p}`);
	return [...all, '/sitemap.xml', '/robots.txt', '/manifest.webmanifest'];
}

export function fileFor(pathname: string): string {
	const p = decodeURIComponent(pathname).replace(/\/+$/, '') || '/';
	if (p.includes('..')) return '';
	if (/\.(xml|txt|webmanifest)$/.test(p)) return p.slice(1);
	return p === '/' ? 'index.html' : `${p.slice(1)}/index.html`;
}

/** Path of a published file for this request, or null. */
export function snapshotFile(storeId: string, pathname: string): string | null {
	const rel = fileFor(pathname);
	if (!rel) return null;
	const f = join(cfg.dataDir, 'sites', storeId, 'current', rel);
	return existsSync(f) ? f : null;
}

function render(port: number, host: string, path: string): Promise<{ status: number; body: Buffer }> {
	return new Promise((resolve, reject) => {
		const req = http.request({ hostname: '127.0.0.1', port, path, method: 'GET', headers: { host, accept: 'text/html,*/*', [RENDER_HEADER]: renderToken() } }, (res) => {
			const chunks: Buffer[] = [];
			res.on('data', (c) => chunks.push(c));
			res.on('end', () => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks) }));
		});
		req.on('error', reject);
		req.setTimeout(15000, () => req.destroy(new Error(`render timeout ${path}`)));
		req.end();
	});
}

/** `port`: where this server listens (dev: the Vite port; production: PORT or 3000). */
export async function publishStore(store: Store, port: number, devHostPort = '', by = 'admin'): Promise<PublishRecord> {
	const t0 = Date.now();
	const version = store.publish.version + 1;
	const root = join(cfg.dataDir, 'sites', store.id);
	const dir = join(root, 'releases', String(version));
	await rm(dir, { recursive: true, force: true });
	const host = primaryHost(store) + devHostPort;
	const paths = sitePaths(store);
	const failures: string[] = [];
	const queue = [...paths];
	await Promise.all(
		Array.from({ length: 8 }, async () => {
			for (let p = queue.shift(); p; p = queue.shift()) {
				const res = await render(port, host, p);
				if (res.status !== 200) {
					failures.push(`${p} → ${res.status}`);
					continue;
				}
				const f = join(dir, fileFor(p));
				await mkdir(dirname(f), { recursive: true });
				await writeFile(f, res.body);
				// Pre-compressed copies: served as-is, so a snapshot costs one file read and zero CPU.
				const [b, g] = await Promise.all([br(res.body, { params: { [zc.BROTLI_PARAM_QUALITY]: 10 } }), gz(res.body, { level: 9 })]);
				await Promise.all([writeFile(`${f}.br`, b), writeFile(`${f}.gz`, g)]);
			}
		})
	);
	if (failures.length) {
		await rm(dir, { recursive: true, force: true });
		throw new Error(`Publish stopped; the live site is unchanged. Pages that failed: ${failures.slice(0, 5).join(', ')}`);
	}
	await swapCurrent(root, version);
	const rec: PublishRecord = { version, at: new Date().toISOString(), pages: paths.length, ms: Date.now() - t0, by };
	const fresh = (await source.getStore(store.id)) ?? store;
	fresh.publish = { version, current: version, history: [rec, ...fresh.publish.history].slice(0, 20) };
	fresh.status = 'live';
	await source.saveStore(fresh);
	await prune(root, version);
	return rec;
}

async function swapCurrent(root: string, version: number) {
	const tmp = join(root, `current.${process.pid}.tmp`);
	await rm(tmp, { force: true });
	await symlink(join('releases', String(version)), tmp);
	await rename(tmp, join(root, 'current'));
}

async function prune(root: string, keep: number) {
	const rels = join(root, 'releases');
	for (const v of await readdir(rels)) if (+v < keep - 2) await rm(join(rels, v), { recursive: true, force: true });
}

/** Points `current` at an older release that still exists (the last three are kept). */
export async function rollback(store: Store, version: number) {
	const root = join(cfg.dataDir, 'sites', store.id);
	if (!existsSync(join(root, 'releases', String(version)))) throw new Error(`Release ${version} is no longer kept.`);
	await swapCurrent(root, version);
	store.publish.current = version;
	await source.saveStore(store);
}

export function listReleases(storeId: string): Promise<string[]> {
	const rels = join(cfg.dataDir, 'sites', storeId, 'releases');
	return existsSync(rels) ? readdir(rels) : Promise.resolve([]);
}

/** Auto-publish after edits, debounced per store (the sitepub worker in production). */
const timers = new Map<string, ReturnType<typeof setTimeout>>();
export function schedulePublish(store: Store, port: number, devHostPort: string, delayMs = 4000) {
	if (store.status !== 'live') return;
	clearTimeout(timers.get(store.id));
	timers.set(
		store.id,
		setTimeout(async () => {
			timers.delete(store.id);
			const fresh = await source.getStore(store.id);
			if (fresh) await publishStore(fresh, port, devHostPort, 'auto').catch((e) => console.error('[publish]', store.id, e.message));
		}, delayMs)
	);
}
