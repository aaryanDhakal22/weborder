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
	// The store's own words win; a Spanish page takes the Spanish twin, else our Spanish text (never the English one).
	const own = (k: 'eyebrow' | 'headline' | 'lead') => (es ? o[`${k}_es`] : o[k]);
	return {
		eyebrow: own('eyebrow') || store.name,
		headline: own('headline') || headline,
		lead: own('lead') || lead,
		tagline: `${store.name}${city ? `, ${city}` : ''}.`,
		aboutTitle: (es ? o.about_title_es : o.about_title) || (es ? 'Sobre nosotros' : 'About us'),
		about: (es ? o.about_es || o.about : o.about)
	};
}

/** The privacy policy: the store's own text (Store › Website), else ours, filled in from its details. */
export function privacyText(store: StoreView, lang: Lang): { custom: boolean; paragraphs: string[] } {
	if (store.look.privacy) return { custom: true, paragraphs: store.look.privacy.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) };
	const es = lang === 'es';
	const where = [store.name, [store.address.line1, store.address.line2].filter(Boolean).join(', '), store.phone].filter(Boolean).join(' · ');
	const ask = [store.email, store.phone].filter(Boolean).join(es ? ' o ' : ' or ');
	return {
		custom: false,
		paragraphs: es
			? [
					where,
					'Lo que guardamos: tu nombre, teléfono, correo (opcional), direcciones de entrega y tus pedidos, para preparar y entregar tus pedidos y enviarte recibos.',
					'Tarjetas: los números de tarjeta van directo a Square, nuestro procesador de pagos. Nunca los vemos ni los guardamos.',
					'No vendemos ni compartimos tu información.',
					`Tu cuenta: bórrala cuando quieras en Cuenta › Borrar mi cuenta.${ask ? ` Preguntas: ${ask}.` : ''}`
				]
			: [
					where,
					'What we collect: your name, phone, email (optional), delivery addresses and your orders, so we can make and deliver them and send receipts.',
					'Cards: card numbers go straight to Square, our card processor. We never see or store them.',
					"We don't sell or share your information.",
					`Your account: delete it any time from Account › Delete my account.${ask ? ` Questions: ${ask}.` : ''}`
				]
	};
}
