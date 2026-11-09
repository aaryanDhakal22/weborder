import { json } from '@sveltejs/kit';
import { statusFor } from '$lib/server/store';

// Live store status (open / paused / closed, ETAs, sold out), polled by every page.
export const GET = async ({ locals }) => {
	const s = await statusFor(locals.host);
	if (!s) return json({ error: 'unavailable', code: 'main_unreachable' }, { status: 503 });
	return json(s, { headers: { 'cache-control': 'no-store' } });
};
