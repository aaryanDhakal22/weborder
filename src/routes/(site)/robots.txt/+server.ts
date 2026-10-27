import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { primaryHost } from '$lib/server/tenancy';

export const GET = async ({ locals, url }) => {
	const store = locals.store;
	if (!store) error(404);
	const origin = dev ? url.origin : `https://${primaryHost(store)}`;
	return new Response(`User-agent: *\nAllow: /\nDisallow: /cart\nDisallow: /checkout\nDisallow: /order/\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
};
