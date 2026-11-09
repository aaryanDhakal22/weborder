import { relay } from '$lib/server/relay';

export const POST = (e) => relay(e, 'POST', '/channel/v1/account/addresses', { body: true, session: true });
