import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { primaryHost } from '$lib/server/tenancy';
import { sitePaths } from '$lib/server/publish';

export const GET = async ({ locals, url }) => {
	const store = locals.store;
	if (!store) error(404);
	const origin = dev ? url.origin : `https://${primaryHost(store)}`;
	const lastmod = (store.publish.history[0]?.at ?? store.createdAt).slice(0, 10);
	const pages = sitePaths(store).filter((p) => !/\.(xml|txt|webmanifest)$/.test(p));
	const [def, ...others] = store.site.languages;
	const strip = (p: string) => {
		const seg = p.split('/')[1];
		return others.includes(seg as never) ? p.slice(seg.length + 1) || '/' : p;
	};
	const alt = (p: string) =>
		store.site.languages.length > 1
			? [def, ...others].map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${origin}${l === def ? '' : `/${l}`}${strip(p) === '/' && l !== def ? '' : strip(p)}"/>`).join('')
			: '';
	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${pages
		.map((p) => `<url><loc>${origin}${p}</loc><lastmod>${lastmod}</lastmod>${alt(p)}<priority>${p === '/' ? '1.0' : p.includes('/menu/') || p.includes('/deals/') ? '0.6' : '0.8'}</priority></url>`)
		.join('\n')}\n</urlset>\n`;
	return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
};
