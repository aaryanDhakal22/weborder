// File-backed data source: data/stores/<id>.json and data/orders/<storeId>/<publicId>.json.
// Cached in memory; writes are atomic (temp file + rename). Seeds the demo stores on first use.
import { mkdir, readdir, readFile, rename, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Order, Store } from '$lib/types';
import type { DataSource } from './types';
import { cfg } from '../config';
import { seedStores } from '../seed';

async function writeJson(path: string, value: unknown) {
	const tmp = `${path}.${process.pid}.tmp`;
	await writeFile(tmp, JSON.stringify(value, null, '\t'));
	await rename(tmp, path);
}

export class MockSource implements DataSource {
	readonly name = 'mock' as const;
	private stores = new Map<string, Store>();
	private ready: Promise<void> | null = null;
	private storeDir = join(cfg.dataDir, 'stores');
	private orderDir = join(cfg.dataDir, 'orders');

	private init() {
		this.ready ??= (async () => {
			await mkdir(this.storeDir, { recursive: true });
			await mkdir(this.orderDir, { recursive: true });
			let files = (await readdir(this.storeDir)).filter((f) => f.endsWith('.json'));
			if (!files.length) {
				for (const s of await seedStores()) await writeJson(join(this.storeDir, `${s.id}.json`), s);
				files = (await readdir(this.storeDir)).filter((f) => f.endsWith('.json'));
			}
			for (const f of files) {
				const s = JSON.parse(await readFile(join(this.storeDir, f), 'utf8')) as Store;
				this.stores.set(s.id, s);
			}
		})();
		return this.ready;
	}

	async listStores() {
		await this.init();
		return [...this.stores.values()].sort((a, b) => a.name.localeCompare(b.name));
	}
	async getStore(id: string) {
		await this.init();
		return this.stores.get(id) ?? null;
	}
	async storeByHost(host: string) {
		await this.init();
		const suffix = `.${cfg.baseDomain}`;
		for (const s of this.stores.values()) {
			if (s.domains.includes(host)) return s;
			if (host.endsWith(suffix) && host.slice(0, -suffix.length) === s.slug) return s;
		}
		return null;
	}
	async saveStore(store: Store) {
		await this.init();
		this.stores.set(store.id, store);
		await writeJson(join(this.storeDir, `${store.id}.json`), store);
	}
	async nextKitchenNo(storeId: string) {
		const s = await this.getStore(storeId);
		if (!s) throw new Error('store not found');
		const n = s.kitchenNext;
		s.kitchenNext = n + 1;
		await this.saveStore(s);
		return n;
	}
	async createOrder(order: Order) {
		await this.saveOrder(order);
	}
	async saveOrder(order: Order) {
		await this.init();
		const dir = join(this.orderDir, order.storeId);
		await mkdir(dir, { recursive: true });
		await writeJson(join(dir, `${order.publicId}.json`), order);
	}
	async getOrder(storeId: string, publicId: string) {
		if (!/^[a-z0-9]{6,32}$/.test(publicId)) return null;
		const p = join(this.orderDir, storeId, `${publicId}.json`);
		if (!existsSync(p)) return null;
		const o = JSON.parse(await readFile(p, 'utf8')) as Order;
		return o.storeId === storeId ? o : null;
	}
	async listOrders(storeId: string, limit = 50) {
		const dir = join(this.orderDir, storeId);
		if (!existsSync(dir)) return [];
		const out: Order[] = [];
		for (const f of await readdir(dir)) if (f.endsWith('.json')) out.push(JSON.parse(await readFile(join(dir, f), 'utf8')));
		return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
	}
	async hasOrdered(storeId: string, phone: string) {
		return (await this.listOrders(storeId, 10000)).some((o) => o.customer.phone === phone);
	}
}
