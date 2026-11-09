// The signed-in customer, as the browser knows it. The session itself stays in an httpOnly cookie
// the storefront forwards to main; this only holds what the pages show.
import type { Account } from './types';

class AccountState {
	me = $state<Account | null>(null);
	loaded = $state(false);

	async load(force = false) {
		if (this.loaded && !force) return;
		try {
			const r = await fetch('/api/account', { headers: { accept: 'application/json' } });
			this.me = r.ok ? ((await r.json()).account ?? null) : null;
		} catch {
			/* offline: stay as we were */
		}
		this.loaded = true;
	}
	set(a: Account | null) {
		this.me = a;
		this.loaded = true;
	}
}

export const account = new AccountState();

/** POST/PATCH/PUT/DELETE to the storefront's /api, JSON in and out; throws { status, code, message }. */
export async function api<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
	const r = await fetch(path, {
		method,
		headers: { accept: 'application/json', ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
		body: body === undefined ? undefined : JSON.stringify(body)
	});
	const text = await r.text();
	const data = text ? JSON.parse(text) : null;
	if (!r.ok) throw { status: r.status, code: data?.code ?? 'error', message: data?.error ?? 'Something went wrong', data };
	return data as T;
}
