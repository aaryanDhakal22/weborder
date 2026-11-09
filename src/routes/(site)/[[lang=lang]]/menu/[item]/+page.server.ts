import { error } from '@sveltejs/kit';
import { breadcrumbLd, itemLd, ldJson, cityLine } from '$lib/server/seo';
import { fromPrice } from '$lib/menu';
import { money } from '$lib/fmt';

export const load = async ({ locals, params, parent }) => {
	const store = locals.store!;
	const { lang, origin, base } = await parent();
	for (const c of store.menu.categories) {
		const item = c.items.find((i) => i.slug === params.item);
		if (!item) continue;
		const city = cityLine(store);
		return {
			itemId: item.id,
			category: { slug: c.slug, name: c.name },
			title: `${item.name} · ${store.name}${city ? `, ${city}` : ''}`,
			desc: `${item.description || item.name} ${money(fromPrice(item))}${item.sizes.length > 1 ? '+' : ''} ${lang === 'es' ? 'en' : 'at'} ${store.name}. ${lang === 'es' ? 'Pide en línea.' : 'Order online.'}`,
			ld: ldJson([
				{ '@context': 'https://schema.org', ...itemLd(item, origin) },
				breadcrumbLd([
					{ name: store.name, url: `${origin}${base}/` },
					{ name: c.name, url: `${origin}${base}/menu#${c.slug}` },
					{ name: item.name, url: `${origin}${base}/menu/${item.slug}` }
				])
			])
		};
	}
	error(404, 'Not on the menu');
};
