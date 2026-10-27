import { error } from '@sveltejs/kit';
import { breadcrumbLd, itemLd, ldJson, cityLine } from '$lib/server/seo';
import { tr } from '$lib/i18n';
import { fromPrice, money } from '$lib/fmt';

export const load = async ({ locals, params, parent }) => {
	const store = locals.store!;
	const { lang, origin, base } = await parent();
	for (const c of store.menu.categories) {
		const item = c.items.find((i) => i.slug === params.item && i.online !== false);
		if (!item) continue;
		const groups = Object.fromEntries((item.groups ?? []).map((g) => [g, store.menu.groups[g]]).filter(([, g]) => g));
		const name = tr(item, 'name', lang);
		return {
			item,
			groups,
			category: { slug: c.slug, name: tr(c, 'name', lang) },
			title: `${name} · ${store.name}, ${cityLine(store)}`,
			desc: `${tr(item, 'desc', lang) || name} ${money(fromPrice(item))}${item.sizes?.length ? '+' : ''} at ${store.name}. ${lang === 'es' ? 'Pide en línea.' : 'Order online.'}`,
			ld: ldJson([
				{ '@context': 'https://schema.org', ...itemLd(store, item, origin, lang) },
				breadcrumbLd([
					{ name: store.name, url: `${origin}${base}/` },
					{ name: tr(c, 'name', lang), url: `${origin}${base}/menu#${c.slug}` },
					{ name, url: `${origin}${base}/menu/${item.slug}` }
				])
			])
		};
	}
	error(404, 'Not on the menu');
};
