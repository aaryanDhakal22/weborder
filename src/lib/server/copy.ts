// Default copy from the store's data, so a store has a finished home page before anyone writes a
// word; Store › Website's texts (when published) win.
import type { Lang, StoreView } from '$lib/types';
import { cityLine } from './seo';

const join = (xs: string[], and: string) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} ${and} ${xs[xs.length - 1]}`);

export function homeCopy(store: StoreView, lang: Lang) {
	const o = store.look.texts;
	const es = lang === 'es';
	const city = cityLine(store);
	// The store's own words first ("Pizza" for Lombardi's Pizza), then the biggest categories.
	const named = (c: { name: string }) => store.name.toLowerCase().includes(c.name.toLowerCase().replace(/s$/, ''));
	const cats = store.menu.categories
		.filter((c) => c.items.length >= 3)
		.toSorted((a, b) => Number(named(b)) - Number(named(a)) || b.items.length - a.items.length)
		.slice(0, 3)
		.map((c) => c.name.toLowerCase());
	const headline = cats.length ? `${join(cats, es ? 'y' : '&').replace(/^./, (c) => c.toUpperCase())}${city ? ` ${es ? 'en' : 'in'} ${city.split(',')[0]}` : ''}.` : store.name;
	const where = store.address.line1 || store.name;
	const lead = store.pricing.types.delivery
		? es ? `Entrega a domicilio, o recoge en ${where}.` : `Delivered to your door, or pick up at ${where}.`
		: es ? `Ordena antes y recoge en ${where}.` : `Order ahead and pick up at ${where}.`;
	return {
		eyebrow: (!es && o.eyebrow) || store.name,
		headline: (!es && o.headline) || headline,
		lead: (!es && o.lead) || lead,
		tagline: (!es && o.tagline) || `${store.name}${city ? `, ${city}` : ''}.`
	};
}
