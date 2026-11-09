import { relay } from '$lib/server/relay';

export const DELETE = (e) => relay(e, 'DELETE', `/channel/v1/account/cards/${encodeURIComponent(e.params.id)}`, { session: true });
