import { relay } from '$lib/server/relay';

// main prices the cart (the browser's numbers are previews only).
export const POST = (e) => relay(e, 'POST', '/channel/v1/quote', { body: true });
