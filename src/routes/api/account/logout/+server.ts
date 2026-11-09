import { relay } from '$lib/server/relay';
import { clearSession } from '$lib/server/session';

export const POST = async (e) => {
	const r = e.locals.session ? await relay(e, 'POST', '/channel/v1/account/logout', { session: true }) : new Response(null, { status: 204 });
	clearSession(e.cookies);
	return r.status === 401 ? new Response(null, { status: 204 }) : r;
};
