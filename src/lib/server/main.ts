// The one connection to main: /channel/v1 with the platform key + X-Site-Host (main resolves the
// host to that store's built-in Website channel and applies its permissions). Customers' sessions
// (X-Customer-Session) and IPs (X-Customer-IP, for sign-in limits) are forwarded per call.
import { cfg } from './config';

export class MainError extends Error {
	constructor(
		public status: number,
		public code: string,
		message: string,
		public body: unknown = null
	) {
		super(message);
	}
}

export interface CallOpts {
	body?: unknown;
	session?: string;
	ip?: string;
	timeoutMs?: number;
	signal?: AbortSignal;
}

export interface Answer<T> {
	status: number;
	data: T;
	headers: Headers;
}

/** Calls main and returns any JSON answer with its status (callers decide what a 4xx means). */
export async function call<T = unknown>(host: string, method: string, path: string, o: CallOpts = {}): Promise<Answer<T>> {
	const headers: Record<string, string> = { authorization: `Bearer ${cfg.platformKey}`, 'x-site-host': host, accept: 'application/json' };
	if (o.body !== undefined) headers['content-type'] = 'application/json';
	if (o.session) headers['x-customer-session'] = o.session;
	if (o.ip) headers['x-customer-ip'] = o.ip;
	let res: Response;
	try {
		res = await fetch(cfg.mainUrl + path, {
			method,
			headers,
			body: o.body === undefined ? undefined : JSON.stringify(o.body),
			signal: o.signal ?? AbortSignal.timeout(o.timeoutMs ?? 8000)
		});
	} catch (e) {
		throw new MainError(503, 'main_unreachable', `main ${method} ${path}: ${(e as Error).message}`);
	}
	const text = await res.text();
	let data: unknown = null;
	try {
		data = text ? JSON.parse(text) : null;
	} catch {
		data = { error: text.slice(0, 200), code: 'bad_answer' };
	}
	return { status: res.status, data: data as T, headers: res.headers };
}

/** Like call, but anything but 2xx throws a MainError carrying main's code. */
export async function get<T>(host: string, path: string, o: CallOpts = {}): Promise<T> {
	const r = await call<T>(host, 'GET', path, o);
	if (r.status >= 300) {
		const d = (r.data ?? {}) as { code?: string; error?: string };
		throw new MainError(r.status, d.code ?? 'error', d.error ?? `main GET ${path}: ${r.status}`, r.data);
	}
	return r.data;
}

/** A GET whose answer isn't JSON (site images): main's Response as is. */
export async function raw(host: string, path: string): Promise<Response> {
	try {
		return await fetch(cfg.mainUrl + path, { headers: { authorization: `Bearer ${cfg.platformKey}`, 'x-site-host': host }, signal: AbortSignal.timeout(8000) });
	} catch (e) {
		throw new MainError(503, 'main_unreachable', `main GET ${path}: ${(e as Error).message}`);
	}
}

/** Opens a streaming GET (SSE) on main. */
export function stream(host: string, path: string, signal: AbortSignal, lastEventId?: string): Promise<Response> {
	const headers: Record<string, string> = { authorization: `Bearer ${cfg.platformKey}`, 'x-site-host': host, accept: 'text/event-stream' };
	if (lastEventId) headers['last-event-id'] = lastEventId;
	return fetch(cfg.mainUrl + path, { headers, signal });
}
