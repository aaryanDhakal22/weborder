// Admin auth and signed tokens with node:crypto (HMAC-SHA256). No session store needed.
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { cfg } from './config';

const b64 = (s: string) => Buffer.from(s).toString('base64url');
const sign = (payload: string) => createHmac('sha256', cfg.secret).update(payload).digest('base64url');

function safeEq(a: string, b: string) {
	const x = Buffer.from(a);
	const y = Buffer.from(b);
	return x.length === y.length && timingSafeEqual(x, y);
}

/** token = base64url(json).signature */
export function makeToken(data: Record<string, unknown>, ttlSec: number): string {
	const body = b64(JSON.stringify({ ...data, exp: Math.floor(Date.now() / 1000) + ttlSec }));
	return `${body}.${sign(body)}`;
}
export function readToken<T = Record<string, unknown>>(token: string | null | undefined): T | null {
	if (!token) return null;
	const [body, sig] = token.split('.');
	if (!body || !sig || !safeEq(sig, sign(body))) return null;
	try {
		const data = JSON.parse(Buffer.from(body, 'base64url').toString());
		return data.exp > Date.now() / 1000 ? (data as T) : null;
	} catch {
		return null;
	}
}

export const ADMIN_COOKIE = 'qadm';

export function checkPassword(given: string): boolean {
	return safeEq(sign(given || ''), sign(cfg.adminPassword));
}
export function startSession(cookies: Cookies, secure: boolean) {
	cookies.set(ADMIN_COOKIE, makeToken({ role: 'admin' }, 12 * 3600), { path: '/', httpOnly: true, sameSite: 'lax', secure, maxAge: 12 * 3600 });
}
export function isAdmin(cookies: Cookies, authHeader: string | null): boolean {
	if (authHeader?.startsWith('Bearer ') && checkPassword(authHeader.slice(7))) return true;
	return readToken<{ role: string }>(cookies.get(ADMIN_COOKIE))?.role === 'admin';
}

/** The publisher's own render requests carry this header so they bypass snapshots and draft gating. */
export const RENDER_HEADER = 'x-quicc-render';
export const renderToken = () => sign('render');
export const isRender = (v: string | null) => !!v && safeEq(v, renderToken());

/** Short-lived preview link for drafts and preset trials: ?preview=<token>. */
export function previewToken(storeId: string, extra: Record<string, string> = {}) {
	return makeToken({ store: storeId, ...extra }, 3600);
}
