// Starts the production build on a free port against a main, and makes requests with any Host
// header (store hosts, unknown hosts) over node:http.
import { spawn, type ChildProcess } from 'node:child_process';
import http from 'node:http';
import { createServer } from 'node:net';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export async function freePort(): Promise<number> {
	return new Promise((resolve) => {
		const s = createServer().listen(0, () => {
			const p = (s.address() as { port: number }).port;
			s.close(() => resolve(p));
		});
	});
}

export interface Res {
	status: number;
	headers: http.IncomingHttpHeaders;
	body: string;
	raw: Buffer;
	json: () => any;
}

export class TestServer {
	port = 0;
	private proc?: ChildProcess;
	/** This server's own order outbox (parallel runs never share one). */
	dataDir = '';

	async start(env: Record<string, string>) {
		this.port = await freePort();
		this.dataDir = mkdtempSync(join(tmpdir(), 'storefront-test-'));
		this.proc = spawn(process.execPath, ['build'], {
			cwd: new URL('../..', import.meta.url).pathname,
			env: { ...process.env, PORT: String(this.port), REFRESH_SECONDS: '5', OUTBOX_PATH: join(this.dataDir, 'outbox.db'), ...env },
			stdio: ['ignore', 'ignore', 'inherit']
		});
		for (let i = 0; i < 100; i++) {
			try {
				await this.req('nobody.localhost', '/');
				return;
			} catch {
				await new Promise((r) => setTimeout(r, 100));
			}
		}
		throw new Error('server did not start');
	}

	stop() {
		this.proc?.kill();
		if (this.dataDir) rmSync(this.dataDir, { recursive: true, force: true });
	}

	req(host: string, path: string, opts: { method?: string; body?: unknown; headers?: Record<string, string> } = {}): Promise<Res> {
		const payload = opts.body === undefined ? undefined : JSON.stringify(opts.body);
		return new Promise((resolve, reject) => {
			const r = http.request(
				{ hostname: '127.0.0.1', port: this.port, path, method: opts.method ?? (payload ? 'POST' : 'GET'), headers: { host: host, ...(payload ? { 'content-type': 'application/json', origin: `http://${host}` } : {}), ...opts.headers } },
				(res) => {
					const chunks: Buffer[] = [];
					res.on('data', (c) => chunks.push(c));
					res.on('end', () => {
						const raw = Buffer.concat(chunks);
						const body = raw.toString();
						resolve({ status: res.statusCode ?? 0, headers: res.headers, body, raw, json: () => JSON.parse(body) });
					});
				}
			);
			r.on('error', reject);
			if (payload) r.write(payload);
			r.end();
		});
	}
}
