// Shared types. The storefront is a thin web-channel adapter on main's /channel/v1, so these are
// main's wire shapes (snake_case, integer cents) — see main's channel OpenAPI document
// (GET /channel/v1/openapi.json). Pricing shapes come from main's engine copy (./engine.ts).
import type { Context, Deal, Line, Pick, Quote } from './engine.ts';

export type { Context, Deal, Line, Pick, Quote } from './engine.ts';

export type Cents = number;
export type Lang = 'en' | 'es';
export type Day = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export const DAYS: Day[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export type Fulfil = 'delivery' | 'pickup';
export type Portion = 'whole' | 'left' | 'right';

// ------------------------------------------------------------------ menu (GET /channel/v1/menu)

export interface ItemSize { size_id: string; name: string; price_cents: Cents }
export interface MenuChoice { item_id: string; name: string; price_cents: Cents; sizes: ItemSize[]; sold_out: boolean }
export interface MenuItem {
	id: string;
	name: string;
	description: string;
	photo: string;
	anchor: { item_ids: string[] };
	price_cents: Cents;
	sizes: ItemSize[];
	sold_out: boolean;
	modifier_group_ids: string[];
	choices?: MenuChoice[];
	/** Added by the storefront: the item's URL segment (unique in the menu). */
	slug: string;
	/** Added by the storefront: the category's key. */
	category: string;
}
export interface MenuOption {
	id: string;
	name: string;
	price_cents: Cents;
	prices: { size_id: string; price_cents: Cents }[];
	is_default: boolean;
	sold_out: boolean;
}
export interface MenuGroup {
	id: string;
	name: string;
	required: boolean;
	min_select: number;
	max_select: number;
	allow_multiple: boolean;
	portions: boolean;
	options: MenuOption[];
}
export interface MenuCategory {
	key: string;
	name: string;
	position: number;
	items: MenuItem[];
	/** Added by the storefront: the category's anchor on the menu page. */
	slug: string;
}
export interface MenuSize { id: string; name: string; short?: string }
export interface Menu {
	view: { id: string; kind: string; name: string };
	version: number;
	currency: string;
	sizes: MenuSize[];
	categories: MenuCategory[];
	modifier_groups: MenuGroup[];
}

// ------------------------------------------------------------------ store (GET /channel/v1/store)

export interface HoursRange { open: string; close: string }
export interface DayHours { date: string; closed: boolean; hours: HoursRange[]; note: string }
export interface StoreStatus {
	store: { name: string; timezone: string; phone: string; address_line1: string; address_line2: string };
	state: 'open' | 'paused' | 'closed';
	accepting: boolean;
	open_now: boolean;
	hours_set: boolean;
	pause: { since: string; until: string | null; note: string } | null;
	next_open_at: string | null;
	closes_at: string | null;
	today: DayHours;
	week?: DayHours[];
	order_types: {
		pickup: { enabled: boolean; eta_minutes: number };
		delivery: { enabled: boolean; eta_minutes: number; radius_m?: number };
	};
	scheduling: { days_ahead: number; slot_minutes: number };
	sold_out: string[];
	menu_version: number;
	/** The store's Pi (its kitchen) can't get an order now: ASAP orders are refused (DURABILITY-PLAN.md). */
	kitchen_offline?: boolean;
}

export interface Payments {
	methods: ('cash' | 'card')[];
	card: { provider: 'square'; env: 'production' | 'sandbox' | 'fake'; app_id: string; location_id: string } | null;
	hold_hours: number;
}

export interface Site {
	version: number;
	primary_host: string;
	hosts: string[];
	settings: Record<string, unknown>;
	/** the draft's settings (asked with a preview token) */
	preview?: boolean;
	/** the store's contact email ("" = none) */
	email: string;
}

export interface Me {
	channel: { id: string; kind: string; name: string; permissions: { menu: boolean; quote: boolean; orders: boolean; track: boolean; payments: string[] } };
	store: { tenant_id: string; location_id: string; name: string; timezone: string };
}

// ------------------------------------------------------------------ the look (Store › Website)

export type MisoSpot = 'peek' | 'side' | 'off';
export type MenuLayout = 'compact' | 'photo' | 'printed';
/** The home page's blocks (Store › Website › Home page). */
export type BlockId = 'hero' | 'again' | 'categories' | 'deals' | 'picks' | 'hours' | 'about' | 'install';

/** The store's words; each `_es` twin is the Spanish text ("" = the storefront's own). */
export interface Texts {
	eyebrow: string;
	headline: string;
	lead: string;
	about_title: string;
	about: string;
	eyebrow_es: string;
	headline_es: string;
	lead_es: string;
	about_title_es: string;
	about_es: string;
}

/** The store's website look: Store › Website's published settings (or, in a preview, the draft) over the defaults. */
export interface Look {
	preset: string;
	brand: string;
	/** null = the preset's own */
	menuLayout: MenuLayout | null;
	languages: Lang[];
	/** site image ids ("" = none), served at /media/{id} */
	logo: string;
	cover: string;
	texts: Texts;
	/** every block, in the store's order */
	blocks: { id: BlockId; on: boolean }[];
	/** "From the menu": item ids ([] = the first item of each category) */
	picks: string[];
	announcement: { on: boolean; text: string; text_es: string; from: string; to: string };
	/** Miso's optional places (the status/process scenes always show): */
	miso: {
		/** cart, checkout, sign-in and the empty pages (no deals, no orders) */
		pages: boolean;
		/** per Home page block: Miso peeking over it, sitting beside it, or none */
		blocks: Partial<Record<BlockId, MisoSpot>>;
	};
	/** the privacy policy ("" = the default text) */
	privacy: string;
}

// ------------------------------------------------------------------ orders + tracking

export type OrderStatus = 'received' | 'scheduled' | 'accepted' | 'ready' | 'on_delivery' | 'completed' | 'cancelled';

export interface PlacedOrder {
	id: string;
	client_order_id: string;
	status: OrderStatus;
	type: Fulfil;
	placed_at: string;
	promised_at: string | null;
	track_token: string;
	payment: { method: 'cash' | 'card'; status: string };
	money: { total_cents: Cents; tip_cents: Cents };
}

export interface Track {
	order_id: string;
	status: OrderStatus;
	type: Fulfil;
	placed_at: string;
	promised_at: string | null;
	kitchen_number: number | null;
	estimated_ready_at: string | null;
	driver: { first_name: string } | null;
	steps: { status: OrderStatus; at: string }[];
}

export interface DeliveryCheck {
	deliverable: boolean;
	result: 'inside' | 'outside' | 'check' | 'not_found' | 'no_store_location' | 'delivery_off';
	distance_m: number | null;
	radius_m: number;
	candidates: { label: string; line1: string; city: string; state: string; postal_code: string }[];
}

// ------------------------------------------------------------------ accounts

export interface Customer { id: string; phone: string; name: string; email: string; created_at: string }
export interface Address { id: string; label: string; line1: string; line2: string; city: string; state: string; zip: string; notes: string; default: boolean; created_at: string }
export interface SavedCard { id: string; brand: string; last4: string; exp_month: number; exp_year: number; created_at: string }
export interface Account extends Customer { addresses: Address[]; cards: SavedCard[] }

export interface PastOrder {
	id: string;
	status: OrderStatus;
	type: Fulfil;
	placed_at: string;
	track_token: string;
	lines: { name: string; size: string; qty: number; total_cents: Cents; mods: string[]; notes: string }[];
	money: { total_cents: Cents };
}

// ------------------------------------------------------------------ what the pages get

/** The store as every page sees it: main's answers, shaped once per menu/site version. */
export interface StoreView {
	name: string;
	slug: string;
	timezone: string;
	phone: string;
	address: { line1: string; line2: string };
	look: Look;
	host: string;
	/** the store's contact email (the privacy page; "" = none) */
	email: string;
	/** rendered from a draft (Store › Website's private preview link) */
	preview?: boolean;
	menu: Menu;
	/** main's pricing context for in-browser previews, without the menu (main re-prices every quote and order). */
	pricing: Omit<Context, 'menu'>;
	payments: Payments;
	deals: Deal[];
	popular: string[];
}

export interface CartEntry {
	line: Line;
	name: string;
	mods: string[];
	unitCents: Cents;
}

export type { Pick as OptPick };
export type QuoteResult = Quote;
