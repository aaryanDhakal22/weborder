import { relay } from '$lib/server/relay';

// Check the code; the session goes into the httpOnly cookie, never to the page.
export const POST = (e) => relay(e, 'POST', '/channel/v1/account/verify', { body: true, keepSession: true });
