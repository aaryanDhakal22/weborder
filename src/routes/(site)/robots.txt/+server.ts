import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';

export const GET = async ({ locals, url }) => {
	const store = locals.store;
	if (!store) error(404);
	const origin = dev ? url.origin : `https://${store.host}`;
	return new Response(`User-agent: *\nAllow: /\nDisallow: /cart\nDisallow: /checkout\nDisallow: /order/\nDisallow: /account\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
};
