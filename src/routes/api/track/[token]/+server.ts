import { json } from '@sveltejs/kit';
import { trackFor } from '$lib/server/trackauth';

// The public tracking state (status, kitchen #, ready-by, driver's first name), this store's orders only.
export const GET = async ({ locals, params }) => {
	const r = await trackFor(locals.host, params.token);
	if (!r.track) return json({ error: 'not found', code: 'not_found' }, { status: r.status });
	return json(r.track, { headers: { 'cache-control': 'no-store' } });
};
