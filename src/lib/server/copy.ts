// Default copy from store data, so a new store has a finished home page before anyone writes a word.
import type { Lang, Store } from '$lib/types';
import { tr } from '$lib/i18n';

const join = (xs: string[], and: string) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} ${and} ${xs[xs.length - 1]}`);

export function homeCopy(store: Store, lang: Lang) {
	const o = store.site.overrides;
	const es = lang === 'es';
	const cats = store.menu.categories.slice(0, 3).map((c) => tr(c, 'name', lang).toLowerCase());
	const city = store.address.city;
	const headline = cats.length ? `${join(cats, es ? 'y' : '&').replace(/^./, (c) => c.toUpperCase())} ${es ? 'en' : 'in'} ${city}.` : store.name;
	const lead = store.settings.delivery
		? es ? `Entrega en ${city}, o recoge en ${store.address.line1}.` : `Delivery across ${city}, or pick up at ${store.address.line1}.`
		: es ? `Ordena antes y recoge en ${store.address.line1}.` : `Order ahead and pick up at ${store.address.line1}.`;
	return {
		eyebrow: (!es && o.eyebrow) || store.cuisine.join(' · '),
		headline: (!es && o.headline) || headline,
		lead: (!es && o.lead) || lead,
		storyTitle: o.storyTitle ?? null,
		storyBody: o.storyBody ?? null,
		tagline: o.tagline || `${store.cuisine.join(', ')} in ${city}, ${store.address.state}.`
	};
}
