import { error, fail } from '@sveltejs/kit';
import type { Deal, Lang, OrderStatus, Store } from '$lib/types';
import { PRESETS, buildTheme } from '$lib/theme';
import { importMenuCsv } from '$lib/menu-csv';
import { isHex } from '$lib/util';
import { source } from '$lib/server/source';
import { listReleases, publishStore, rollback, schedulePublish } from '$lib/server/publish';
import { renderTarget, storeUrl } from '$lib/server/target';
import { previewToken } from '$lib/server/auth';
import { advanceOrder, viewOrder } from '$lib/server/orders';

async function get(id: string) {
	const s = await source.getStore(id);
	if (!s) error(404, 'Store not found');
	return s;
}

export const load = async ({ params, url }) => {
	const s = await get(params.id);
	const theme = buildTheme(s.site.preset, s.site.brand);
	const base = storeUrl(s, url);
	const orders = (await source.listOrders(s.id, 15)).map((o) => ({ ...viewOrder(o), customer: o.customer.name, total: o.quote.totalCents, when: o.when }));
	return {
		store: s,
		url: base,
		preview: `${base}/?preview=${previewToken(s.id)}`,
		checks: theme.checks,
		presets: Object.values(PRESETS).map((p) => ({ id: p.id, name: p.name, desc: p.desc, sampleBrand: p.sampleBrand })),
		releases: (await listReleases(s.id)).map(Number).sort((a, b) => b - a),
		orders,
		items: s.menu.categories.flatMap((c) => c.items.filter((i) => i.online !== false).map((i) => ({ id: i.id, name: i.name, cat: c.name })))
	};
};

async function saved(s: Store, url: URL, msg: string) {
	await source.saveStore(s);
	if (s.status === 'live' && s.publish.version > 0) {
		const { port, hostPort } = renderTarget(url);
		schedulePublish(s, port, hostPort);
		return { ok: `${msg} The site republishes in a few seconds.` };
	}
	return { ok: msg };
}

const num = (v: FormDataEntryValue | null, d = 0) => (v === null || v === '' || isNaN(Number(v)) ? d : Number(v));
const cents = (v: FormDataEntryValue | null, d = 0) => Math.round(num(v, d / 100) * 100);

export const actions = {
	look: async ({ params, request, url }) => {
		const s = await get(params.id);
		const f = await request.formData();
		const brand = String(f.get('brand') ?? '').toUpperCase();
		if (!isHex(brand)) return fail(400, { error: 'Brand color must look like #AC94F4.' });
		const preset = String(f.get('preset'));
		if (!PRESETS[preset]) return fail(400, { error: 'Unknown preset.' });
		const langs = f.getAll('languages').map(String).filter((l): l is Lang => l === 'en' || l === 'es');
		const def = String(f.get('defaultLang')) as Lang;
		s.site.preset = preset;
		s.site.brand = brand;
		s.site.mascot = f.get('mascot') === 'off' ? 'off' : 'miso';
		const ordered = langs.length ? (langs.includes(def) ? [def, ...langs.filter((l) => l !== def)] : langs) : ['en' as Lang];
		s.site.languages = ordered;
		for (const k of ['eyebrow', 'headline', 'lead', 'storyTitle', 'storyBody', 'tagline'] as const) {
			const v = String(f.get(k) ?? '').trim();
			if (v) s.site.overrides[k] = v.slice(0, 400);
			else delete s.site.overrides[k];
		}
		const html = String(f.get('customHtml') ?? '').trim();
		s.site.customHtml = html ? html.slice(0, 200_000) : undefined;
		return saved(s, url, 'Look saved.');
	},
	ordering: async ({ params, request, url }) => {
		const s = await get(params.id);
		const f = await request.formData();
		const st = s.settings;
		st.pickup = f.get('pickup') === 'on';
		st.delivery = f.get('delivery') === 'on';
		if (!st.pickup && !st.delivery) return fail(400, { error: 'Turn on pickup, delivery or both.' });
		st.etaPickupMin = num(f.get('etaPickupMin'), 20);
		st.etaDeliveryMin = num(f.get('etaDeliveryMin'), 45);
		st.deliveryFee = { model: f.get('feeModel') === 'free_over' ? 'free_over' : 'flat', flatCents: cents(f.get('flat'), 399), freeOverCents: f.get('freeOver') ? cents(f.get('freeOver')) : undefined, minOrderCents: cents(f.get('minOrder'), 0) };
		st.serviceFeeBps = Math.round(num(f.get('servicePct')) * 100);
		st.taxBps = Math.round(num(f.get('taxPct'), 6) * 100);
		st.tips = { enabled: f.get('tips') === 'on', presets: String(f.get('tipPresets') ?? '15,18,20').split(',').map(Number).filter((n) => n > 0 && n < 100).slice(0, 4), default: num(f.get('tipDefault'), 18) };
		st.cash = f.get('cash') === 'on';
		const mode = String(f.get('cardFee'));
		st.cardFee = { mode: mode === 'surcharge' || mode === 'cash_discount' ? mode : 'absorb', bps: Math.round(num(f.get('cardFeePct'), 3) * 100) };
		st.scheduling = { enabled: f.get('scheduling') === 'on', slotMin: num(f.get('slotMin'), 15), daysAhead: num(f.get('daysAhead'), 2) };
		st.deliveryZips = String(f.get('zips') ?? '').split(/[\s,]+/).filter((z) => /^\d{5}$/.test(z));
		s.phone = String(f.get('phone') ?? s.phone).trim();
		return saved(s, url, 'Ordering settings saved.');
	},
	live: async ({ params, request }) => {
		const s = await get(params.id);
		const f = await request.formData();
		const pause = String(f.get('pause') ?? '');
		if (pause === 'resume') s.settings.pausedUntil = null;
		else if (pause) s.settings.pausedUntil = new Date(Date.now() + Number(pause) * 60_000).toISOString();
		if (f.has('busy')) s.settings.busyEtaMin = Number(f.get('busy')) || null;
		if (f.has('soldOutForm')) s.settings.soldOut = f.getAll('soldOut').map(String);
		await source.saveStore(s);
		return { ok: 'Live status updated. Customers see it within 30 seconds (no republish needed).' };
	},
	menu: async ({ params, request, url }) => {
		const s = await get(params.id);
		const file = (await request.formData()).get('csv');
		if (!(file instanceof File) || !file.size) return fail(400, { error: 'Choose a CSV file.' });
		try {
			const r = importMenuCsv(await file.text());
			s.menu = r.menu;
			const res = await saved(s, url, `Menu imported: ${r.stats.items} items, ${r.stats.dropped} POS leftovers dropped.`);
			return { ...res, report: r.notes.slice(0, 80) };
		} catch (e) {
			return fail(400, { error: (e as Error).message });
		}
	},
	deals: async ({ params, request, url }) => {
		const s = await get(params.id);
		const f = await request.formData();
		const raw = String(f.get('json') ?? '').trim();
		if (raw) {
			try {
				const parsed = JSON.parse(raw) as Deal[];
				if (!Array.isArray(parsed) || parsed.some((d) => !d.id || !d.slug || !d.kind || !d.name)) throw new Error('Each deal needs id, slug, kind and name.');
				s.deals = parsed;
			} catch (e) {
				return fail(400, { error: `Deals JSON: ${(e as Error).message}` });
			}
		}
		const active = new Set(f.getAll('active').map(String));
		if (f.has('toggles')) for (const d of s.deals) d.active = active.has(d.id);
		return saved(s, url, 'Deals saved.');
	},
	publish: async ({ params, url }) => {
		const s = await get(params.id);
		try {
			const { port, hostPort } = renderTarget(url);
			const rec = await publishStore(s, port, hostPort, 'admin');
			return { ok: `Published version ${rec.version}: ${rec.pages} pages in ${rec.ms} ms.` };
		} catch (e) {
			return fail(500, { error: (e as Error).message });
		}
	},
	rollback: async ({ params, request }) => {
		const s = await get(params.id);
		const v = Number((await request.formData()).get('version'));
		try {
			await rollback(s, v);
			return { ok: `Rolled back to version ${v}.` };
		} catch (e) {
			return fail(400, { error: (e as Error).message });
		}
	},
	domain: async ({ params, request }) => {
		const s = await get(params.id);
		const d = String((await request.formData()).get('domain') ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
		if (!d) s.domains = [];
		else if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(d)) return fail(400, { error: 'That domain looks off.' });
		else s.domains = [d];
		await source.saveStore(s);
		return { ok: d ? `${d} is the primary domain. Point a CNAME at stores.quiccpos.com; the slug address keeps working.` : 'Custom domain removed.' };
	},
	advance: async ({ params, request }) => {
		const s = await get(params.id);
		const f = await request.formData();
		const o = await source.getOrder(s.id, String(f.get('order')));
		if (!o) return fail(404, { error: 'Order not found.' });
		await advanceOrder(o, (f.get('to') as OrderStatus) || undefined);
		return { ok: `Order #${o.kitchenNo} moved on.` };
	}
};
