// Browser calls to this store's API (same host, so the tenant is the host).
import type { CartLine, Fulfil, Quote } from './types';

export async function fetchQuote(body: { lines: CartLine[]; fulfil: Fulfil; code?: string; tipPct?: number; tipCents?: number; payment?: 'card' | 'cash' }, signal?: AbortSignal): Promise<Quote> {
	const r = await fetch('/api/quote', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal });
	if (!r.ok) throw new Error(`quote ${r.status}`);
	return r.json();
}
