import { cityLine, dealLd, ldJson } from '$lib/server/seo';

export const load = async ({ locals, parent }) => {
	const store = locals.store!;
	const { origin, lang } = await parent();
	const city = cityLine(store);
	return {
		title: `${lang === 'es' ? 'Ofertas' : 'Deals'} · ${store.name}${city ? `, ${city}` : ''}`,
		ld: ldJson(store.deals.map((d) => dealLd(d, origin)))
	};
};
