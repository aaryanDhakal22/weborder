// Starts the production build on a free port with a throwaway data folder, and makes requests
// with any Host header (store hosts, the admin host, unknown hosts) over node:http.
import { spawn, type ChildProcess } from 'node:child_process';
import http from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';

export const ADMIN_PASSWORD = 'e2e-pass';

async function freePort(): Promise<number> {
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
	dataDir = '';
	private proc?: ChildProcess;

	async start() {
		this.port = await freePort();
		this.dataDir = mkdtempSync(join(tmpdir(), 'quicc-e2e-'));
		this.proc = spawn(process.execPath, ['build'], {
			cwd: new URL('../..', import.meta.url).pathname,
			env: { ...process.env, PORT: String(this.port), DATA_DIR: this.dataDir, BASE_DOMAIN: 'localhost', ADMIN_HOST: 'admin.localhost', ADMIN_PASSWORD, SECRET: 'e2e-secret', DEMO_FLOOR: 'fast' },
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
		rmSync(this.dataDir, { recursive: true, force: true });
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
