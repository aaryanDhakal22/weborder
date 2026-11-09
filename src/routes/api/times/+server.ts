import { relay } from '$lib/server/relay';

// Times an order can be promised for on a date (?type=pickup|delivery&date=YYYY-MM-DD).
export const GET = (e) => {
	const q = new URLSearchParams({ type: e.url.searchParams.get('type') ?? 'pickup', date: e.url.searchParams.get('date') ?? '' });
	return relay(e, 'GET', `/channel/v1/store/times?${q}`);
};
