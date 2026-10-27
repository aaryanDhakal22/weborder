import type { Item } from '$lib/types';
import { dealLive } from '$lib/pricing';
import { homeCopy } from '$lib/server/copy';
import { homeTitle } from '$lib/server/seo';
import { sanitizeHtml } from '$lib/server/sanitize';

export const load = async ({ locals, parent }) => {
	const store = locals.store!;
	const { lang } = await parent();
	const now = new Date();
	const deals = store.deals.filter((d) => d.active && d.home !== false && d.kind !== 'code').slice(0, 4).map((d) => ({ ...d, live: dealLive(d, store.timezone, now) }));
	const popular: (Item & { cat: string })[] = [];
	for (const c of store.menu.categories) for (const i of c.items) if (i.popular && i.online !== false) popular.push({ ...i, cat: c.slug });
	return {
		copy: homeCopy(store, lang),
		title: homeTitle(store, lang),
		deals,
		popular: popular.slice(0, 8).map(({ id, slug, name, nameEs, priceCents, sizes, art }) => ({ id, slug, name, nameEs, priceCents, sizes: sizes?.map((s) => ({ priceCents: s.priceCents })), art })),
		customHtml: store.site.customHtml ? sanitizeHtml(store.site.customHtml) : null
	};
};
