import { error } from '@sveltejs/kit';
import { breadcrumbLd, dealLd, ldJson, cityLine } from '$lib/server/seo';

export const load = async ({ locals, params, parent }) => {
	const store = locals.store!;
	const { origin, base, lang } = await parent();
	const deal = store.deals.find((d) => d.id === params.deal);
	if (!deal) error(404, 'That deal has ended');
	const city = cityLine(store);
	return {
		dealId: deal.id,
		title: `${deal.name} · ${store.name}${city ? `, ${city}` : ''}`,
		ld: ldJson([dealLd(deal, origin), breadcrumbLd([{ name: store.name, url: `${origin}${base}/` }, { name: lang === 'es' ? 'Ofertas' : 'Deals', url: `${origin}${base}/deals` }, { name: deal.name, url: `${origin}${base}/deals/${deal.id}` }])])
	};
};
