// Every request: host → admin host | store | unknown. Unknown hosts get a neutral 404 with no store data.
// Published snapshots are served before SvelteKit renders anything (production; SSR covers the rest).
import type { Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { cfg } from '$lib/server/config';
import { cleanHost, resolveHost } from '$lib/server/tenancy';
import { isAdmin, isRender, readToken, RENDER_HEADER } from '$lib/server/auth';
import { snapshotFile } from '$lib/server/publish';

const NOT_FOUND = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Not found</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0f0d1a;color:#f4f1fb;font:16px/1.5 system-ui,sans-serif;text-align:center;padding:24px}
.q{width:48px;height:48px;border-radius:13px;background:#ac94f4;color:#241b47;display:grid;place-items:center;font:800 28px system-ui;margin:0 auto 16px}p{color:#b8b0d4}</style></head>
<body><main><div class="q">q</div><h1>There's no store here</h1><p>Check the address, or ask the restaurant for its ordering link.</p></main></body></html>`;

const TYPES: Record<string, string> = { html: 'text/html; charset=utf-8', xml: 'application/xml; charset=utf-8', txt: 'text/plain; charset=utf-8', webmanifest: 'application/manifest+json' };

export const handle: Handle = async ({ event, resolve }) => {
	const headers = event.request.headers;
	const host = cleanHost(headers.get('x-forwarded-host') ?? headers.get('host'));
	const path = event.url.pathname;
	event.locals.store = null;
	event.locals.adminHost = false;
	event.locals.admin = false;
	event.locals.preview = false;
	event.locals.previewOverrides = null;
	event.locals.render = false;

	// Caddy's on-demand TLS asks here before issuing a certificate: only for hosts that are a store.
	if (path === '/__quicc/domain-check' && ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(event.getClientAddress())) {
		const d = cleanHost(event.url.searchParams.get('domain'));
		const k = await resolveHost(d);
		return new Response(null, { status: k.kind === 'store' ? 200 : 404 });
	}

	const kind = await resolveHost(host);

	if (kind.kind === 'admin') {
		event.locals.adminHost = true;
		event.locals.admin = isAdmin(event.cookies, headers.get('authorization'));
		if (path === '/') return new Response(null, { status: 302, headers: { location: '/admin' } });
		if (!path.startsWith('/admin')) return new Response(NOT_FOUND, { status: 404, headers: { 'content-type': TYPES.html } });
		const res = await resolve(event);
		res.headers.set('x-robots-tag', 'noindex');
		res.headers.set('cache-control', 'no-store');
		return res;
	}

	if (kind.kind === 'unknown' || path.startsWith('/admin')) return new Response(NOT_FOUND, { status: 404, headers: { 'content-type': TYPES.html, 'x-robots-tag': 'noindex' } });

	const store = kind.store;
	event.locals.store = store;

	const isRenderReq = isRender(headers.get(RENDER_HEADER));
	const fromQuery = event.url.searchParams.get('preview');
	const prev = readToken<{ store: string; preset?: string; brand?: string }>(fromQuery ?? event.cookies.get('qprev'));
	if (prev?.store === store.id) {
		event.locals.preview = true;
		event.locals.previewOverrides = prev.preset || prev.brand ? { preset: prev.preset, brand: prev.brand } : null;
		if (fromQuery) event.cookies.set('qprev', fromQuery, { path: '/', httpOnly: true, sameSite: 'lax', secure: !dev, maxAge: 3600 });
	}
	if (isRenderReq) {
		event.locals.render = true;
		event.locals.preview = true;
	}

	if (store.status !== 'live' && !event.locals.preview) return new Response(NOT_FOUND, { status: 404, headers: { 'content-type': TYPES.html, 'x-robots-tag': 'noindex' } });

	const seg = path.split('/')[1];
	const lang = store.site.languages.slice(1).includes(seg as never) ? seg : store.site.languages[0];

	const securityHeaders = (res: Response) => {
		res.headers.set('x-content-type-options', 'nosniff');
		res.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
		// The admin's live preview frames store pages; nobody else may.
		res.headers.set('content-security-policy', `frame-ancestors 'self' http://${cfg.adminHost}:* https://${cfg.adminHost}`);
		res.headers.set('cache-tag', `site-${store.id}`);
		return res;
	};

	if (cfg.snapshots && !dev && !event.locals.preview && event.request.method === 'GET' && !path.startsWith('/api/') && !path.includes('__data.json') && !event.url.search) {
		const file = snapshotFile(store.id, path);
		if (file) {
			const ext = file.slice(file.lastIndexOf('.') + 1);
			const accept = headers.get('accept-encoding') ?? '';
			const enc = /\bbr\b/.test(accept) && existsSync(`${file}.br`) ? 'br' : /\bgzip\b/.test(accept) && existsSync(`${file}.gz`) ? 'gzip' : null;
			const body = await readFile(enc === 'br' ? `${file}.br` : enc === 'gzip' ? `${file}.gz` : file);
			const h: Record<string, string> = { 'content-type': TYPES[ext] ?? 'application/octet-stream', 'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400', 'x-quicc-snapshot': String(store.publish.current), vary: 'accept-encoding' };
			if (enc) h['content-encoding'] = enc;
			return securityHeaders(new Response(body, { headers: h }));
		}
	}

	const res = await resolve(event, { transformPageChunk: ({ html }) => html.replace('%lang%', lang) });
	if (event.locals.preview && !event.locals.render) res.headers.set('x-robots-tag', 'noindex');
	if (!res.headers.has('cache-control') && res.headers.get('content-type')?.startsWith('text/html')) res.headers.set('cache-control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=600');
	return securityHeaders(res);
};
