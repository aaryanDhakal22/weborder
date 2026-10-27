import { error } from '@sveltejs/kit';
import type { Item } from '$lib/types';
import { dealLive, matches } from '$lib/pricing';
import { breadcrumbLd, dealLd, ldJson, cityLine } from '$lib/server/seo';
import { tr } from '$lib/i18n';

export const load = async ({ locals, params, parent }) => {
	const store = locals.store!;
	const { lang, origin, base } = await parent();
	const deal = store.deals.find((d) => d.slug === params.deal && d.active && d.kind !== 'code');
	if (!deal) error(404, 'That deal has ended');
	const eligible = (el: NonNullable<typeof deal.mix>['eligible']) => {
		const out: Item[] = [];
		for (const c of store.menu.categories) for (const i of c.items) if (i.online !== false && (i.sizes?.length ? i.sizes.some((s) => matches(el, i, c, s)) : matches(el, i, c))) out.push(i);
		return out;
	};
	const slots = (deal.slots ?? []).map((s) => ({ ...s, items: eligible(s.eligible) }));
	const extra = deal.kind === 'mix' ? eligible(deal.mix!.eligible) : deal.kind === 'nth' ? eligible(deal.nth!.eligible) : [];
	const used = new Set([...slots.flatMap((s) => s.items), ...extra].flatMap((i) => i.groups ?? []));
	const name = tr(deal, 'name', lang);
	return {
		deal: { ...deal, live: dealLive(deal, store.timezone, new Date()) },
		slots,
		extra,
		groups: Object.fromEntries([...used].map((g) => [g, store.menu.groups[g]])),
		title: `${name} · ${store.name}, ${cityLine(store)}`,
		ld: ldJson([dealLd(store, deal, origin, lang), breadcrumbLd([{ name: store.name, url: `${origin}${base}/` }, { name: 'Deals', url: `${origin}${base}/deals` }, { name, url: `${origin}${base}/deals/${deal.slug}` }])])
	};
};
