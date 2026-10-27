import { error, json } from '@sveltejs/kit';
import { source } from '$lib/server/source';
import { publishStore } from '$lib/server/publish';
import { renderTarget } from '$lib/server/target';

export const POST = async ({ locals, params, url }) => {
	if (!locals.adminHost || !locals.admin) error(401, 'Admin only');
	const store = await source.getStore(params.id);
	if (!store) error(404, 'Store not found');
	const { port, hostPort } = renderTarget(url);
	try {
		return json(await publishStore(store, port, hostPort, 'cli'));
	} catch (e) {
		return json({ error: (e as Error).message }, { status: 500 });
	}
};
