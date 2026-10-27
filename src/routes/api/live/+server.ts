import { json, error } from '@sveltejs/kit';
import { liveState } from '$lib/live';

/** Store status for the status bar and sold-out greying. Cached briefly at the edge. */
export const GET = async ({ locals }) => {
	if (!locals.store) error(404);
	return json(liveState(locals.store), { headers: { 'cache-control': 'public, max-age=10, s-maxage=15' } });
};
