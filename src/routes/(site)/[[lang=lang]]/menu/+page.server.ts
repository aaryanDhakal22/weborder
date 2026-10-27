import { ldJson, menuLd, cityLine } from '$lib/server/seo';

export const load = async ({ locals, parent }) => {
	const store = locals.store!;
	const { lang, origin } = await parent();
	// Only what the page and the item sheet need: no printers, no hidden items.
	const categories = store.menu.categories
		.map((c) => ({ ...c, items: c.items.filter((i) => i.online !== false).map(({ printer: _p, online: _o, ...i }) => i) }))
		.filter((c) => c.items.length);
	return {
		categories,
		groups: store.menu.groups,
		title: `Menu · ${store.name} · ${store.cuisine.slice(0, 3).join(', ')} in ${cityLine(store)}`,
		menuLd: ldJson(menuLd(store, origin, lang))
	};
};
