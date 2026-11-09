import { relay } from '$lib/server/relay';

export const POST = (e) => relay(e, 'POST', '/channel/v1/store/delivery-check', { body: true });
