import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';

// Every public page of the store: home, menu, each item, deals, each deal, contact (and each
// extra language), so search engines find the menu without running any script.
export const GET = async ({ locals, url }) => {
	const store = locals.store;
	if (!store) error(404);
	const origin = dev ? url.origin : `https://${store.host}`;
	const pages = ['/', '/menu', ...store.menu.categories.flatMap((c) => c.items.map((i) => `/menu/${i.slug}`)), '/deals', ...store.deals.map((d) => `/deals/${d.id}`), '/contact'];
	const [def, ...others] = store.look.languages;
	const href = (l: string, p: string) => `${origin}${l === def ? '' : `/${l}`}${p === '/' && l !== def ? '' : p}`;
	const alt = (p: string) => (others.length ? [def, ...others].map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${href(l, p)}"/>`).join('') : '');
	const pri = (p: string) => (p === '/' ? '1.0' : p.includes('/menu/') || p.includes('/deals/') ? '0.6' : '0.8');
	const urls = [def, ...others].flatMap((l) => pages.map((p) => `<url><loc>${href(l, p)}</loc>${alt(p)}<priority>${pri(p)}</priority></url>`));
	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
	return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
};
