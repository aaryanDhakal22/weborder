// The browser talks to the storefront (same origin); the storefront relays to main's /channel/v1
// with the platform key, the store's host, the customer's session cookie and IP. main's answer
// (status + JSON) goes back as is; a dead session clears the cookie.
import { json, type RequestEvent } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { call, MainError } from './main';
import { clearSession, setSession } from './session';
import { viaHttps } from './tenancy';

export interface RelayOpts {
	/** Send the customer's session (account + orders). */
	session?: boolean;
	/** Forward the request's JSON body (POST / PUT / PATCH). */
	body?: boolean | unknown;
	/** Store a session main hands back (account/verify). */
	keepSession?: boolean;
}

export async function relay(event: RequestEvent, method: string, path: string, o: RelayOpts = {}): Promise<Response> {
	const { locals, cookies, request, url } = event;
	if (!locals.store) return json({ error: 'not found', code: 'not_found' }, { status: 404 });
	let body: unknown = undefined;
	if (o.body === true) {
		try {
			body = await request.json();
		} catch {
			return json({ error: 'expected JSON', code: 'bad_request' }, { status: 400 });
		}
	} else if (o.body !== undefined && o.body !== false) body = o.body;
	try {
		const r = await call<Record<string, unknown> | null>(locals.host, method, path, { body, session: o.session ? (locals.session ?? undefined) : undefined, ip: locals.ip });
		if (r.status === 401 && (r.data as { code?: string } | null)?.code === 'session_invalid') clearSession(cookies);
		if (o.keepSession && r.status < 300 && typeof r.data?.session === 'string') {
			setSession(cookies, r.data.session, !dev && viaHttps(request.headers, url));
			const { session: _s, ...rest } = r.data;
			return json(rest, { status: r.status });
		}
		if (r.status === 204 || r.data === null) return new Response(null, { status: r.status });
		return json(r.data, { status: r.status, headers: { 'cache-control': 'no-store' } });
	} catch (e) {
		const m = e instanceof MainError ? e : new MainError(503, 'main_unreachable', String(e));
		return json({ error: 'The restaurant can’t be reached right now. Please try again in a moment.', code: m.code }, { status: 503 });
	}
}
