// Structured data (schema.org JSON-LD) and titles, generated from main's store data.
import type { Deal, Lang, MenuItem, StoreStatus, StoreView } from '$lib/types';

const DAY: Record<number, string> = { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' };

export function restaurantLd(store: StoreView, status: StoreStatus | null, origin: string) {
	const week = status?.week ?? [];
	const hours = week.flatMap((d) => {
		const dow = DAY[new Date(`${d.date}T12:00:00Z`).getUTCDay()];
		return d.closed ? [] : d.hours.map((h) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: dow, opens: h.open, closes: h.close }));
	});
	const delivery = status?.order_types.delivery.enabled ?? store.pricing.types.delivery;
	return {
		'@context': 'https://schema.org',
		'@type': 'Restaurant',
		'@id': `${origin}/#restaurant`,
		name: store.name,
		url: origin + '/',
		...(store.phone ? { telephone: store.phone } : {}),
		menu: `${origin}/menu`,
		hasMenu: `${origin}/menu`,
		...(store.address.line1 ? { address: { '@type': 'PostalAddress', streetAddress: store.address.line1, addressLocality: store.address.line2, addressCountry: 'US' } } : {}),
		...(hours.length ? { openingHoursSpecification: hours } : {}),
		potentialAction: {
			'@type': 'OrderAction',
			target: { '@type': 'EntryPoint', urlTemplate: `${origin}/menu`, actionPlatform: ['http://schema.org/DesktopWebPlatform', 'http://schema.org/MobileWebPlatform'] },
			deliveryMethod: [delivery ? 'http://purl.org/goodrelations/v1#DeliveryModeOwnFleet' : null, 'http://purl.org/goodrelations/v1#DeliveryModePickUp'].filter(Boolean)
		},
		currenciesAccepted: 'USD',
		paymentAccepted: store.payments.methods.includes('cash') ? 'Cash, Credit Card' : 'Credit Card'
	};
}

export function menuLd(store: StoreView, origin: string, lang: Lang) {
	return {
		'@context': 'https://schema.org',
		'@type': 'Menu',
		'@id': `${origin}/menu#menu`,
		name: `${store.name} menu`,
		inLanguage: lang,
		hasMenuSection: store.menu.categories.map((c) => ({ '@type': 'MenuSection', name: c.name, hasMenuItem: c.items.map((i) => itemLd(i, origin)) }))
	};
}

export function itemLd(i: MenuItem, origin: string) {
	return {
		'@type': 'MenuItem',
		name: i.name,
		url: `${origin}/menu/${i.slug}`,
		...(i.description ? { description: i.description } : {}),
		offers: i.sizes.length
			? i.sizes.map((s) => ({ '@type': 'Offer', name: s.name, price: (s.price_cents / 100).toFixed(2), priceCurrency: 'USD' }))
			: { '@type': 'Offer', price: (i.price_cents / 100).toFixed(2), priceCurrency: 'USD' }
	};
}

export function dealLd(d: Deal, origin: string) {
	return {
		'@context': 'https://schema.org',
		'@type': 'Offer',
		name: d.name,
		...(d.description ? { description: d.description } : {}),
		url: `${origin}/deals/${d.id}`,
		...(d.price_cents ? { price: (d.price_cents / 100).toFixed(2), priceCurrency: 'USD' } : {}),
		offeredBy: { '@id': `${origin}/#restaurant` }
	};
}

export function breadcrumbLd(trail: { name: string; url: string }[]) {
	return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: trail.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, item: t.url })) };
}

/** <script type="application/ld+json"> body, with </script> made impossible. */
export const ldJson = (obj: unknown) => JSON.stringify(obj).replace(/</g, '\\u003c');

/** "Towson, MD" from main's second address line ("Towson, MD 21286"). */
export function cityLine(store: StoreView) {
	return store.address.line2.replace(/\s+\d{5}(-\d{4})?$/, '').trim();
}

export function homeTitle(store: StoreView, lang: Lang) {
	const how = store.pricing.types.delivery ? (lang === 'es' ? 'Entrega y para llevar' : 'Delivery & Pickup') : lang === 'es' ? 'Para llevar' : 'Order Ahead for Pickup';
	const city = cityLine(store);
	return `${store.name} · ${how}${city ? ` ${lang === 'es' ? 'en' : 'in'} ${city}` : ''}`;
}
