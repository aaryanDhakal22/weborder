// Shared types for the storefront. Money is always integer cents.
// These mirror the planned main contract (docs/MAIN-API.md) so the mock and main are interchangeable.

export type Cents = number;
export type Lang = 'en' | 'es';
export type Day = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export const DAYS: Day[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/** "11:00" → "23:00". A close at or before the open runs past midnight. */
export interface Period {
	open: string;
	close: string;
}
export type Hours = Partial<Record<Day, Period[]>>;

export type Fulfil = 'delivery' | 'pickup';
export type Portion = 'whole' | 'left' | 'right';

// ------------------------------------------------------------------ menu v2

export interface Size {
	id: string;
	name: string;
	short?: string;
	priceCents: Cents;
	default?: boolean;
}

export interface Option {
	id: string;
	name: string;
	nameEs?: string;
	priceCents: Cents;
	/** Price by size id; falls back to priceCents. */
	sizePrices?: Record<string, Cents>;
	/** Pre-selected and removable ("NO onions" on the ticket when removed). */
	default?: boolean;
}

export interface Group {
	id: string;
	name: string;
	nameEs?: string;
	min: number;
	/** 0 = unlimited. */
	max: number;
	/** Options can go on the whole item, the left half or the right half. */
	portions?: boolean;
	options: Option[];
}

export interface Item {
	id: string;
	slug: string;
	name: string;
	nameEs?: string;
	desc?: string;
	descEs?: string;
	/** Used when the item has no sizes. */
	priceCents: Cents;
	sizes?: Size[];
	groups?: string[];
	popular?: boolean;
	/** Illustration used when there is no photo. */
	art?: Art;
	printer?: string;
	/** False hides the item online; the kitchen and Quibase still see it. */
	online?: boolean;
	/** Short subtitle under the name (printed-menu preset). */
	sub?: string;
	subEs?: string;
}

export type Art = 'pizza' | 'sub' | 'wings' | 'bowl' | 'fries' | 'drink' | 'cake' | 'salad' | 'burger' | 'cup' | 'croissant' | 'bread' | 'bun' | 'toast' | 'taco' | 'burrito';

export interface Category {
	id: string;
	slug: string;
	name: string;
	nameEs?: string;
	/** One-line subtitle (printed-menu preset). */
	sub?: string;
	subEs?: string;
	items: Item[];
}

export interface Menu {
	categories: Category[];
	groups: Record<string, Group>;
}

// ------------------------------------------------------------------ deals

export interface Eligible {
	categories?: string[];
	items?: string[];
	/** Size names that qualify, e.g. ['14" Large']. */
	sizes?: string[];
}

export interface DealSlot {
	label: string;
	labelEs?: string;
	eligible: Eligible;
	/** Options included in the deal price; extras beyond this are charged. */
	includedOptions?: number;
}

export interface Schedule {
	days?: Day[];
	start?: string;
	end?: string;
}

export interface Deal {
	id: string;
	slug: string;
	kind: 'bundle' | 'mix' | 'nth' | 'code';
	name: string;
	nameEs?: string;
	desc: string;
	descEs?: string;
	sticker?: string;
	stickerEs?: string;
	active: boolean;
	home?: boolean;
	/** bundle */
	priceCents?: Cents;
	regularCents?: Cents;
	slots?: DealSlot[];
	/** mix & match: any `qty`+ eligible units at `eachCents` each */
	mix?: { qty: number; eachCents: Cents; eligible: Eligible };
	/** buy X get Y: every nth eligible unit gets pct off (the cheaper one) */
	nth?: { n: number; pct: number; eligible: Eligible };
	/** promo code */
	code?: string;
	pct?: number;
	amountCents?: Cents;
	schedule?: Schedule;
	fulfil?: 'both' | Fulfil;
	minSubtotalCents?: Cents;
	firstOrderOnly?: boolean;
}

// ------------------------------------------------------------------ store

export type CardFeeMode = 'absorb' | 'surcharge' | 'cash_discount';

export interface Settings {
	pickup: boolean;
	delivery: boolean;
	etaPickupMin: number;
	etaDeliveryMin: number;
	deliveryFee: { model: 'flat' | 'free_over'; flatCents: Cents; freeOverCents?: Cents; minOrderCents: Cents };
	serviceFeeBps: number;
	taxBps: number;
	tips: { enabled: boolean; presets: number[]; default: number };
	cash: boolean;
	cardFee: { mode: CardFeeMode; bps: number };
	scheduling: { enabled: boolean; slotMin: number; daysAhead: number };
	/** Delivery area by ZIP (the mock's stand-in for main's geocoder + radius). */
	deliveryZips: string[];
	pausedUntil: string | null;
	busyEtaMin: number | null;
	soldOut: string[];
}

export interface SiteConfig {
	preset: string;
	brand: string;
	mascot: 'miso' | 'off';
	/** First language is the default; others live under /<lang>/. */
	languages: Lang[];
	/** Admin-reviewed homepage HTML (sanitized at render). */
	customHtml?: string;
	overrides: {
		eyebrow?: string;
		headline?: string;
		lead?: string;
		storyTitle?: string;
		storyBody?: string;
		tagline?: string;
	};
}

export interface PublishRecord {
	version: number;
	at: string;
	pages: number;
	ms: number;
	by: string;
}

export interface Store {
	id: string;
	slug: string;
	name: string;
	status: 'draft' | 'live';
	/** Extra verified custom domains; the slug host always works. */
	domains: string[];
	storeType: 'pizza_delivery' | 'pickup_only' | 'restaurant';
	cuisine: string[];
	priceRange: string;
	timezone: string;
	address: { line1: string; city: string; state: string; zip: string };
	phone: string;
	geo: { lat: number; lng: number };
	deliveryRadiusM: number;
	hours: Hours;
	settings: Settings;
	site: SiteConfig;
	menu: Menu;
	deals: Deal[];
	publish: { version: number; current: number; history: PublishRecord[] };
	kitchenNext: number;
	createdAt: string;
}

// ------------------------------------------------------------------ cart, quote, orders

export interface OptPick {
	g: string;
	o: string;
	p?: Portion;
}

export interface ItemLine {
	kind: 'item';
	itemId: string;
	sizeId?: string;
	opts: OptPick[];
	qty: number;
	note?: string;
}

export interface DealPick {
	itemId: string;
	sizeId?: string;
	opts: OptPick[];
}

export interface DealLine {
	kind: 'deal';
	dealId: string;
	picks: DealPick[];
	qty: number;
}

export type CartLine = ItemLine | DealLine;

export interface QuoteInput {
	lines: CartLine[];
	fulfil: Fulfil;
	tipPct?: number;
	tipCents?: number;
	code?: string;
	payment?: 'card' | 'cash';
	firstOrder?: boolean;
}

export interface PricedLine {
	index: number;
	name: string;
	mods: string[];
	qty: number;
	unitCents: Cents;
	totalCents: Cents;
	regularCents?: Cents;
	deal?: boolean;
	error?: string;
}

export interface Discount {
	type: 'deal' | 'code' | 'cash';
	label: string;
	amountCents: Cents;
}

export interface Quote {
	lines: PricedLine[];
	subtotalCents: Cents;
	discounts: Discount[];
	deliveryFeeCents: Cents;
	serviceFeeCents: Cents;
	taxCents: Cents;
	tipCents: Cents;
	cardFeeCents: Cents;
	totalCents: Cents;
	savedCents: Cents;
	errors: string[];
	warnings: string[];
	nudges: string[];
}

export type OrderStatus = 'received' | 'accepted' | 'cooking' | 'ready' | 'out' | 'done' | 'cancelled';

export interface Order {
	id: string;
	publicId: string;
	storeId: string;
	kitchenNo: number;
	createdAt: string;
	fulfil: Fulfil;
	when: { asap: boolean; at?: string };
	customer: { name: string; phone: string; email?: string; optIn: boolean };
	address?: { line1: string; line2?: string; zip: string; notes?: string };
	lines: CartLine[];
	quote: Quote;
	payment: { method: 'card' | 'cash'; status: 'captured' | 'pending'; last4?: string };
	/** Manual stage set from admin (the stand-in for the Pi's floor events). */
	manual?: { status: OrderStatus; at: string }[];
	prepMin: number;
}

export interface OrderView {
	publicId: string;
	kitchenNo: number;
	status: OrderStatus;
	fulfil: Fulfil;
	createdAt: string;
	readyBy: string | null;
	arrivesBy: string | null;
	stages: { status: OrderStatus; at: string | null }[];
	quote: Quote;
	payment: Order['payment'];
	customerName: string;
}

/** What the storefront pages get about the store: no admin fields, no menu. */
export interface PublicStore {
	id: string;
	slug: string;
	name: string;
	storeType: Store['storeType'];
	cuisine: string[];
	priceRange: string;
	timezone: string;
	address: Store['address'];
	phone: string;
	geo: Store['geo'];
	deliveryRadiusM: number;
	hours: Hours;
	site: Omit<SiteConfig, 'customHtml'>;
	settings: Pick<Settings, 'pickup' | 'delivery' | 'etaPickupMin' | 'etaDeliveryMin' | 'deliveryFee' | 'taxBps' | 'tips' | 'cash' | 'cardFee' | 'scheduling' | 'serviceFeeBps'>;
	categories: { id: string; slug: string; name: string; nameEs?: string }[];
	version: number;
}
