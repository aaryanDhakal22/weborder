import { json } from '@sveltejs/kit';
import { call } from '$lib/server/main';
import { relay } from '$lib/server/relay';
import { clearSession } from '$lib/server/session';

// The signed-in customer ({ account: null } when nobody is).
export const GET = async ({ locals, cookies }) => {
	if (!locals.session || !locals.store) return json({ account: null }, { headers: { 'cache-control': 'no-store' } });
	try {
		const r = await call(locals.host, 'GET', '/channel/v1/account', { session: locals.session, ip: locals.ip });
		if (r.status === 200) return json({ account: r.data }, { headers: { 'cache-control': 'no-store' } });
		if (r.status === 401) clearSession(cookies);
		return json({ account: null }, { headers: { 'cache-control': 'no-store' } });
	} catch {
		return json({ account: null, error: 'unavailable' }, { status: 503 });
	}
};
export const PATCH = (e) => relay(e, 'PATCH', '/channel/v1/account', { body: true, session: true });
export const DELETE = async (e) => {
	const r = await relay(e, 'DELETE', '/channel/v1/account', { session: true });
	if (r.status < 300) clearSession(e.cookies);
	return r;
};
