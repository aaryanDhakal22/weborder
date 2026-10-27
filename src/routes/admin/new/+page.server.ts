import { fail } from '@sveltejs/kit';
import { PRESETS, buildTheme } from '$lib/theme';
import { createStore, HOUR_PRESETS } from '$lib/server/create';
import { previewToken } from '$lib/server/auth';
import { storeUrl } from '$lib/server/target';

export const load = async () => ({
	presets: Object.values(PRESETS).map((p) => {
		const pal = buildTheme(p.id, p.sampleBrand).palette;
		return { id: p.id, name: p.name, desc: p.desc, sampleBrand: p.sampleBrand, swatch: [pal.canvas, pal.surface, pal.brand, pal['deal-bg'], pal.text] };
	}),
	hourPresets: Object.entries(HOUR_PRESETS).map(([id, h]) => ({ id, label: h.label }))
});

export const actions = {
	default: async ({ request, url }) => {
		const f = await request.formData();
		const file = f.get('csv');
		const csv = file instanceof File && file.size ? await file.text() : '';
		if (csv.length > 2_000_000) return fail(400, { error: 'That CSV is over 2 MB.' });
		const res = await createStore({
			name: String(f.get('name') ?? ''),
			slug: String(f.get('slug') ?? ''),
			storeType: String(f.get('storeType') ?? ''),
			preset: String(f.get('preset') ?? ''),
			brand: String(f.get('brand') ?? ''),
			line1: String(f.get('line1') ?? ''),
			city: String(f.get('city') ?? ''),
			state: String(f.get('state') ?? ''),
			zip: String(f.get('zip') ?? ''),
			phone: String(f.get('phone') ?? ''),
			timezone: String(f.get('timezone') ?? ''),
			cuisine: String(f.get('cuisine') ?? ''),
			languages: f.getAll('languages').map(String),
			hours: String(f.get('hours') ?? ''),
			zips: String(f.get('zips') ?? ''),
			csv
		});
		if (!res.ok) return fail(400, { error: res.error });
		return {
			created: { id: res.store.id, name: res.store.name, preview: `${storeUrl(res.store, url)}/?preview=${previewToken(res.store.id)}` },
			report: res.report ? { stats: res.report.stats, notes: res.report.notes.slice(0, 60) } : null
		};
	}
};
