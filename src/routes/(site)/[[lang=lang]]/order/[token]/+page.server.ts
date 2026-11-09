import { error } from '@sveltejs/kit';
import { trackFor } from '$lib/server/trackauth';

export const load = async ({ locals, params }) => {
	const r = await trackFor(locals.host, params.token);
	if (!r.track) error(r.status, 'No such order');
	return { track: r.track, token: params.token };
};
