import { relay } from '$lib/server/relay';

// Text (or call) a sign-in code: { phone, channel?: 'sms' | 'call' }.
export const POST = (e) => relay(e, 'POST', '/channel/v1/account/code', { body: true });
