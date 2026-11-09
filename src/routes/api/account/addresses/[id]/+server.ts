import { relay } from '$lib/server/relay';

export const PUT = (e) => relay(e, 'PUT', `/channel/v1/account/addresses/${encodeURIComponent(e.params.id)}`, { body: true, session: true });
export const DELETE = (e) => relay(e, 'DELETE', `/channel/v1/account/addresses/${encodeURIComponent(e.params.id)}`, { session: true });
