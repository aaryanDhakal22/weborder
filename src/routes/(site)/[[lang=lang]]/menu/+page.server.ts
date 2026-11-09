import { ldJson, menuLd, cityLine } from '$lib/server/seo';

export const load = async ({ locals, parent }) => {
	const store = locals.store!;
	const { lang, origin } = await parent();
	const city = cityLine(store);
	return {
		title: `${lang === 'es' ? 'Menú' : 'Menu'} · ${store.name}${city ? ` · ${city}` : ''}`,
		menuLd: ldJson(menuLd(store, origin, lang))
	};
};
