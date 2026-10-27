// Creating stores: defaults by store type, so a new store needs only a name, a preset and a color.
import type { Hours, Lang, Menu, Settings, Store } from '$lib/types';
import { PRESETS } from '$lib/theme';
import { slugify } from '$lib/util';

export const DEFAULT_HOURS: Hours = {
	mon: [{ open: '11:00', close: '22:00' }], tue: [{ open: '11:00', close: '22:00' }], wed: [{ open: '11:00', close: '22:00' }],
	thu: [{ open: '11:00', close: '22:00' }], fri: [{ open: '11:00', close: '23:00' }], sat: [{ open: '11:00', close: '23:00' }], sun: [{ open: '12:00', close: '21:00' }]
};

export function defaultSettings(type: Store['storeType']): Settings {
	const delivery = type !== 'pickup_only';
	return {
		pickup: true,
		delivery,
		etaPickupMin: 20,
		etaDeliveryMin: 45,
		deliveryFee: { model: 'flat', flatCents: 399, minOrderCents: 1200 },
		serviceFeeBps: 0,
		taxBps: 600,
		tips: { enabled: true, presets: [15, 18, 20], default: delivery ? 18 : 15 },
		cash: true,
		cardFee: { mode: 'absorb', bps: 300 },
		scheduling: { enabled: true, slotMin: 15, daysAhead: 2 },
		deliveryZips: [],
		pausedUntil: null,
		busyEtaMin: null,
		soldOut: []
	};
}

export interface NewStoreInput {
	name: string;
	slug?: string;
	storeType: Store['storeType'];
	preset: string;
	brand: string;
	address: Store['address'];
	phone: string;
	timezone?: string;
	cuisine?: string[];
	languages?: Lang[];
	hours?: Hours;
	deliveryZips?: string[];
	menu?: Menu;
}

export function newStore(input: NewStoreInput): Store {
	const slug = slugify(input.slug || input.name);
	const preset = PRESETS[input.preset] ? input.preset : 'pizzeria-loud';
	const settings = defaultSettings(input.storeType);
	settings.deliveryZips = input.deliveryZips ?? [input.address.zip].filter(Boolean);
	return {
		id: slug,
		slug,
		name: input.name.trim(),
		status: 'draft',
		domains: [],
		storeType: input.storeType,
		cuisine: input.cuisine?.length ? input.cuisine : ['Restaurant'],
		priceRange: '$$',
		timezone: input.timezone || 'America/New_York',
		address: input.address,
		phone: input.phone,
		geo: { lat: 0, lng: 0 },
		deliveryRadiusM: 8047,
		hours: input.hours ?? DEFAULT_HOURS,
		settings,
		site: { preset, brand: input.brand || PRESETS[preset].sampleBrand, mascot: 'miso', languages: input.languages?.length ? input.languages : ['en'], overrides: {} },
		menu: input.menu ?? { categories: [], groups: {} },
		deals: [],
		publish: { version: 0, current: 0, history: [] },
		kitchenNext: 1100,
		createdAt: new Date().toISOString()
	};
}
