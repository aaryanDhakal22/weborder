import { error, json } from '@sveltejs/kit';
import { source } from '$lib/server/source';
import { createStore, type CreateInput } from '$lib/server/create';
import { publishStore } from '$lib/server/publish';
import { renderTarget, storeUrl } from '$lib/server/target';

/** GET: every store, short form. Auth: admin session or `Authorization: Bearer <ADMIN_PASSWORD>`. */
export const GET = async ({ locals, url }) => {
	if (!locals.adminHost || !locals.admin) error(401, 'Admin only');
	const stores = await source.listStores();
	return json(stores.map((s) => ({ id: s.id, name: s.name, status: s.status, preset: s.site.preset, brand: s.site.brand, url: storeUrl(s, url), version: s.publish.current, items: s.menu.categories.reduce((n, c) => n + c.items.length, 0) })));
};

/** POST: create a store (same rules as the wizard). Body: CreateInput + { publish?: boolean }; `csv` is the menu CSV text. */
export const POST = async ({ locals, request, url }) => {
	if (!locals.adminHost || !locals.admin) error(401, 'Admin only');
	const body = (await request.json()) as CreateInput & { publish?: boolean };
	const res = await createStore(body);
	if (!res.ok) return json(res, { status: 400 });
	let published = null;
	if (body.publish) {
		const { port, hostPort } = renderTarget(url);
		published = await publishStore(res.store, port, hostPort, 'cli');
	}
	return json({ ok: true, id: res.store.id, url: storeUrl(res.store, url), report: res.report?.stats ?? null, published }, { status: 201 });
};
