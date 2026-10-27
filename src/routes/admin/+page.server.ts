import { fail } from '@sveltejs/kit';
import { source } from '$lib/server/source';
import { publishStore } from '$lib/server/publish';
import { renderTarget, storeUrl } from '$lib/server/target';
import { previewToken } from '$lib/server/auth';
import { PRESETS } from '$lib/theme';

export const load = async ({ url }) => {
	const stores = await source.listStores();
	return {
		stores: stores.map((s) => ({
			id: s.id,
			name: s.name,
			status: s.status,
			preset: PRESETS[s.site.preset]?.name ?? s.site.preset,
			brand: s.site.brand,
			url: storeUrl(s, url),
			preview: `${storeUrl(s, url)}/?preview=${previewToken(s.id)}`,
			items: s.menu.categories.reduce((n, c) => n + c.items.length, 0),
			deals: s.deals.filter((d) => d.active).length,
			version: s.publish.current,
			lastPublish: s.publish.history[0]?.at ?? null,
			type: s.storeType
		}))
	};
};

export const actions = {
	publish: async ({ request, url }) => {
		const id = String((await request.formData()).get('id'));
		const store = await source.getStore(id);
		if (!store) return fail(404, { error: 'Store not found.' });
		try {
			const { port, hostPort } = renderTarget(url);
			const rec = await publishStore(store, port, hostPort, 'admin');
			return { ok: `${store.name} published: version ${rec.version}, ${rec.pages} pages in ${rec.ms} ms.` };
		} catch (e) {
			return fail(500, { error: (e as Error).message });
		}
	}
};
