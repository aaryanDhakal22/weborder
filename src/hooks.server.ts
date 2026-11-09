// Every request: host → store (through main) or a neutral 404 with no store data. main answers
// unknown_site for a host no store is served on, so tenancy is main's decision, not ours.
import type { Handle } from '@sveltejs/kit';
import { clientIp, hopeless, requestHost } from '$lib/server/tenancy';
import { storeFor } from '$lib/server/store';
import { COOKIE } from '$lib/server/session';

const page = (title: string, body: string) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0f0d1a;color:#f4f1fb;font:16px/1.5 system-ui,sans-serif;text-align:center;padding:24px}
.q{width:48px;height:48px;border-radius:13px;background:#ac94f4;color:#241b47;display:grid;place-items:center;font:800 28px system-ui;margin:0 auto 16px}p{color:#b8b0d4}</style></head>
<body><main><div class="q">q</div>${body}</main></body></html>`;

const NOT_FOUND = page('Not found', "<h1>There's no store here</h1><p>Check the address, or ask the restaurant for its ordering link.</p>");
const UNAVAILABLE = page('Back soon', '<h1>Ordering is down for a moment</h1><p>Please try again in a minute, or call the restaurant.</p>');

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;
	if (path === '/healthz') return new Response('ok', { headers: { 'content-type': 'text/plain' } });

	const host = requestHost(event.request.headers);
	event.locals.host = host;
	event.locals.store = null;
	event.locals.session = event.cookies.get(COOKIE) ?? null;
	event.locals.ip = clientIp(event.request.headers, () => event.getClientAddress());

	const html = (body: string, status: number) => new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex', 'cache-control': 'no-store' } });
	if (hopeless(host)) return html(NOT_FOUND, 404);
	const r = await storeFor(host);
	if (r.kind === 'unknown') return html(NOT_FOUND, 404);
	if (r.kind === 'unavailable') return html(UNAVAILABLE, 503);
	event.locals.store = r.view;

	const seg = path.split('/')[1];
	const langs = r.view.look.languages;
	const lang = langs.slice(1).includes(seg as never) ? seg : langs[0];
	const res = await resolve(event, { transformPageChunk: ({ html }) => html.replace('%lang%', lang) });
	res.headers.set('x-content-type-options', 'nosniff');
	res.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
	res.headers.set('x-frame-options', 'SAMEORIGIN');
	if (!res.headers.has('cache-control')) res.headers.set('cache-control', 'private, no-store');
	return res;
};
