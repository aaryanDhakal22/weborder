import { dealLive } from '$lib/pricing';
import { cityLine, dealLd, ldJson } from '$lib/server/seo';

export const load = async ({ locals, parent }) => {
	const store = locals.store!;
	const { lang, origin } = await parent();
	const now = new Date();
	const deals = store.deals.filter((d) => d.active).map((d) => ({ ...d, live: dealLive(d, store.timezone, now) }));
	return {
		deals,
		title: `Deals · ${store.name}, ${cityLine(store)}`,
		ld: ldJson(deals.map((d) => dealLd(store, d, origin, lang)))
	};
};
