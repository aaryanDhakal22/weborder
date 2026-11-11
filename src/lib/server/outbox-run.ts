// The running outbox: one per storefront process, at OUTBOX_PATH, sending through main.ts.
import { cfg } from './config';
import { call } from './main';
import { Outbox } from './outbox';

let box: Outbox | null = null;

/** The process's outbox (opened on first use; the worker starts with it). */
export function outbox(): Outbox {
	if (box) return box;
	box = new Outbox(cfg.outboxPath, {
		waitMs: cfg.orderWaitMs,
		place: async (host, body, session, ip) => {
			const r = await call(host, 'POST', '/channel/v1/orders', { body, session: session ?? undefined, ip, timeoutMs: cfg.orderWaitMs });
			return { status: r.status, body: r.data };
		},
		byKey: async (host, key) => {
			const r = await call(host, 'GET', `/channel/v1/orders/by-key/${encodeURIComponent(key)}`, { timeoutMs: 5_000 });
			return { status: r.status, body: r.data };
		}
	});
	box.start();
	return box;
}
