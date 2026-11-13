// Starts the production build on a free port against a main, and makes requests with any Host
// header (store hosts, unknown hosts) over node:http.
import { spawn, type ChildProcess } from 'node:child_process';
import http from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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

	/** The server's stdout + stderr when started with `capture` (tests that check what is logged). */
	output = '';

	async start(env: Record<string, string>, o: { capture?: boolean } = {}) {
		// PORT=0: the server binds a free port itself and says which ("Listening on http://…:N"). Picking
		// one here and handing it over raced with every other process on the box: on grace the gate's
		// other storefront lane took it in between (EADDRINUSE, gate 20261113-140031), and the ready poll
		// below then talked to that one's server.
		this.dataDir = mkdtempSync(join(tmpdir(), 'storefront-test-'));
		const proc = spawn(process.execPath, ['build'], {
			cwd: new URL('../..', import.meta.url).pathname,
			env: { ...process.env, PORT: '0', REFRESH_SECONDS: '5', OUTBOX_PATH: join(this.dataDir, 'outbox.db'), ...env },
			stdio: ['ignore', 'pipe', o.capture ? 'pipe' : 'inherit']
		});
		this.proc = proc;
		let out = '';
		const listening = new Promise<number>((resolve, reject) => {
			const timer = setTimeout(() => reject(new Error(`server did not start:\n${out}`)), 15_000);
			let up = false;
			proc.stdout?.on('data', (c) => {
				if (o.capture) this.output += c;
				if (up) return; // drained, not kept
				out += c;
				const m = /Listening on http:\/\/[^\s]*:(\d+)/.exec(out);
				if (m) {
					up = true;
					clearTimeout(timer);
					resolve(Number(m[1]));
				}
			});
			proc.on('exit', (code) => {
				clearTimeout(timer);
				reject(new Error(`server exited (${code}) before listening:\n${out}`));
			});
		});
		if (o.capture) {
			proc.stderr?.on('data', (c) => {
				this.output += c;
				process.stderr.write(c);
			});
		}
		this.port = await listening;
		for (let i = 0; i < 100; i++) {
			try {
				await this.req('nobody.localhost', '/');
				return;
			} catch {
				await new Promise((r) => setTimeout(r, 100));
			}
		}
		throw new Error('server did not answer');
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
