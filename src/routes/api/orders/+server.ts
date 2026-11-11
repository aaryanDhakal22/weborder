import { json } from '@sveltejs/kit';
import { outbox } from '$lib/server/outbox-run';
import { statusFor } from '$lib/server/store';
import { clearSession } from '$lib/server/session';

/** How long main may take to place an ASAP order before it is dropped, never charged (DURABILITY-PLAN.md). */
const ASAP_MS = 5 * 60_000;

// Places the order with main through the outbox (DURABILITY-PLAN.md): the order is written on the
// storefront's disk first, then sent; main's final answer comes back as is, anything else is
// 202 {state: pending} and the outbox carries on (the page asks /api/orders/by-key/{key}).
// A signed-in customer's session goes along, so the order joins their account and may use / save a card.
export const POST = async ({ locals, request, cookies }) => {
	if (!locals.store) return json({ error: 'not found', code: 'not_found' }, { status: 404 });
	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'expected JSON', code: 'bad_request' }, { status: 400 });
	}
	const key = body?.client_order_id;
	if (typeof key !== 'string' || !/^[A-Za-z0-9_.:-]{1,64}$/.test(key)) return json({ error: 'client_order_id: 1–64 letters, digits or _ . : -', code: 'bad_request' }, { status: 400 });
	const expires = await deadline(locals.host, body);
	body.expires_at = new Date(expires).toISOString();
	const a = await outbox().place(locals.host, body as { client_order_id: string }, locals.session, locals.ip, expires);
	if (a.status === 401 && a.body?.code === 'session_invalid') clearSession(cookies);
	if (a.status === 204 || a.body === null) return new Response(null, { status: a.status });
	return json(a.body, { status: a.status, headers: { 'cache-control': 'no-store' } });
};

/** ASAP: 5 minutes. Scheduled: the promised time less the store's prep time, never sooner than 5 minutes. */
async function deadline(host: string, body: Record<string, unknown>): Promise<number> {
	const asap = Date.now() + ASAP_MS;
	if (typeof body.promised_at !== 'string') return asap;
	const at = Date.parse(body.promised_at);
	if (!Number.isFinite(at)) return asap;
	const st = await statusFor(host);
	const type = body.type === 'delivery' ? 'delivery' : 'pickup';
	const prep = (st?.order_types[type]?.eta_minutes ?? 0) * 60_000;
	return Math.max(asap, at - prep);
}
