import { relay } from '$lib/server/relay';

export const GET = (e) => relay(e, 'GET', '/channel/v1/account/orders', { session: true });
