import { json } from '@sveltejs/kit';
import { outbox } from '$lib/server/outbox-run';

// Where an order the page couldn't confirm stands (DURABILITY-PLAN.md): the outbox's answer, else
// main's. {state: pending | placed | refused | expired | voided | verify, order?, error?}.
export const GET = async ({ locals, params }) => {
	if (!locals.store) return json({ error: 'not found', code: 'not_found' }, { status: 404 });
	const s = await outbox().lookup(locals.host, params.key);
	if (!s) return json({ error: 'no order under that key', code: 'unknown_key' }, { status: 404, headers: { 'cache-control': 'no-store' } });
	return json(s, { headers: { 'cache-control': 'no-store' } });
};
