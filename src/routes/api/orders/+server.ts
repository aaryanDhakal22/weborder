import { relay } from '$lib/server/relay';

// Places the order with main (idempotent on client_order_id). A signed-in customer's session goes
// along, so the order joins their account and may use / save a card.
export const POST = (e) => relay(e, 'POST', '/channel/v1/orders', { body: true, session: true });
