// Structured data (schema.org JSON-LD) and titles, generated from the store. Nothing typed per store.
import type { Deal, Item, Lang, Store } from '$lib/types';
import { openingSpec } from '$lib/hours';
import { tr } from '$lib/i18n';

export function restaurantLd(store: Store, origin: string, lang: Lang) {
	const prices = store.menu.categories.flatMap((c) => c.items.map((i) => i.priceCents));
	return {
		'@context': 'https://schema.org',
		'@type': 'Restaurant',
		'@id': `${origin}/#restaurant`,
		name: store.name,
		url: origin + '/',
		telephone: store.phone,
		priceRange: store.priceRange,
		servesCuisine: store.cuisine,
		menu: `${origin}/menu`,
		hasMenu: `${origin}/menu`,
		inLanguage: lang,
		address: { '@type': 'PostalAddress', streetAddress: store.address.line1, addressLocality: store.address.city, addressRegion: store.address.state, postalCode: store.address.zip, addressCountry: 'US' },
		...(store.geo.lat ? { geo: { '@type': 'GeoCoordinates', latitude: store.geo.lat, longitude: store.geo.lng } } : {}),
		openingHoursSpecification: openingSpec(store.hours),
		potentialAction: { '@type': 'OrderAction', target: { '@type': 'EntryPoint', urlTemplate: `${origin}/menu`, actionPlatform: ['http://schema.org/DesktopWebPlatform', 'http://schema.org/MobileWebPlatform'] }, deliveryMethod: [store.settings.delivery ? 'http://purl.org/goodrelations/v1#DeliveryModeOwnFleet' : null, 'http://purl.org/goodrelations/v1#DeliveryModePickUp'].filter(Boolean) },
		...(prices.length ? { currenciesAccepted: 'USD', paymentAccepted: store.settings.cash ? 'Cash, Credit Card' : 'Credit Card' } : {})
	};
}

export function menuLd(store: Store, origin: string, lang: Lang) {
	return {
		'@context': 'https://schema.org',
		'@type': 'Menu',
		'@id': `${origin}/menu#menu`,
		name: `${store.name} menu`,
		inLanguage: lang,
		hasMenuSection: store.menu.categories.map((c) => ({
			'@type': 'MenuSection',
			name: tr(c, 'name', lang),
			hasMenuItem: c.items.filter((i) => i.online !== false).map((i) => itemLd(store, i, origin, lang))
		}))
	};
}

export function itemLd(store: Store, i: Item, origin: string, lang: Lang) {
	const prices = i.sizes?.length ? i.sizes.map((s) => s.priceCents) : [i.priceCents];
	return {
		'@type': 'MenuItem',
		name: tr(i, 'name', lang),
		url: `${origin}/menu/${i.slug}`,
		...(tr(i, 'desc', lang) ? { description: tr(i, 'desc', lang) } : {}),
		offers: i.sizes?.length
			? i.sizes.map((s) => ({ '@type': 'Offer', name: s.name, price: (s.priceCents / 100).toFixed(2), priceCurrency: 'USD' }))
			: { '@type': 'Offer', price: (Math.min(...prices) / 100).toFixed(2), priceCurrency: 'USD' }
	};
}

export function dealLd(store: Store, d: Deal, origin: string, lang: Lang) {
	return {
		'@context': 'https://schema.org',
		'@type': 'Offer',
		name: tr(d, 'name', lang),
		description: tr(d, 'desc', lang),
		url: `${origin}/deals/${d.slug}`,
		...(d.priceCents !== undefined ? { price: (d.priceCents / 100).toFixed(2), priceCurrency: 'USD' } : {}),
		offeredBy: { '@id': `${origin}/#restaurant` }
	};
}

export function breadcrumbLd(trail: { name: string; url: string }[]) {
	return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: trail.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, item: t.url })) };
}

/** <script type="application/ld+json"> body, with </script> made impossible. */
export const ldJson = (obj: unknown) => JSON.stringify(obj).replace(/</g, '\\u003c');

export function cityLine(store: Store) {
	return `${store.address.city}, ${store.address.state}`;
}

export function homeTitle(store: Store, lang: Lang) {
	const cuisine = store.cuisine.slice(0, 3).join(', ');
	const how = store.settings.delivery ? (lang === 'es' ? 'Entrega y para llevar' : 'Delivery & Pickup') : lang === 'es' ? 'Para llevar' : 'Order Ahead for Pickup';
	return `${store.name} · ${cuisine} ${how} in ${cityLine(store)}`;
}
