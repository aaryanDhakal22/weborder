// The customer's session lives in a host-only, httpOnly cookie; the browser never sees the qcs_
// value. main renews a session on use (90 days); the cookie follows with the same lifetime.
import type { Cookies } from '@sveltejs/kit';

export const COOKIE = 'qcs';
const DAYS_90 = 90 * 24 * 3600;

export function setSession(cookies: Cookies, session: string, secure: boolean) {
	cookies.set(COOKIE, session, { path: '/', httpOnly: true, sameSite: 'lax', secure, maxAge: DAYS_90 });
}

export function clearSession(cookies: Cookies) {
	cookies.delete(COOKIE, { path: '/' });
}
