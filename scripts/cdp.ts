// A tiny Chrome DevTools Protocol client (Node's built-in WebSocket + fetch; no Puppeteer).
// Drives the chrome-headless-shell that Playwright's cache or the system already has.
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export function findChrome(): string {
	if (process.env.CHROME && existsSync(process.env.CHROME)) return process.env.CHROME;
	const cache = join(homedir(), '.cache/ms-playwright');
	if (existsSync(cache)) {
		for (const d of readdirSync(cache).filter((d) => d.startsWith('chromium_headless_shell')).sort().reverse()) {
			const p = join(cache, d, 'chrome-headless-shell-linux64/chrome-headless-shell');
			if (existsSync(p)) return p;
		}
	}
	for (const p of ['/usr/bin/chromium', '/usr/bin/google-chrome', '/usr/bin/chromium-browser']) if (existsSync(p)) return p;
	throw new Error('No Chrome found. Set CHROME=/path/to/chrome.');
}

export class Browser {
	private proc!: ChildProcess;
	private ws!: WebSocket;
	private id = 0;
	private waiting = new Map<number, (v: any) => void>();
	private listeners: ((m: any) => void)[] = [];
	session = '';

	static async launch(port = 9333): Promise<Browser> {
		const b = new Browser();
		b.proc = spawn(findChrome(), ['--headless', '--no-sandbox', '--hide-scrollbars', `--remote-debugging-port=${port}`, '--remote-allow-origins=*', 'about:blank'], { stdio: 'ignore' });
		let wsUrl = '';
		for (let i = 0; i < 50 && !wsUrl; i++) {
			await new Promise((r) => setTimeout(r, 100));
			try {
				wsUrl = (await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()).webSocketDebuggerUrl;
			} catch {
				/* not up yet */
			}
		}
		if (!wsUrl) throw new Error('Chrome did not start');
		b.ws = new WebSocket(wsUrl);
		await new Promise((r) => b.ws.addEventListener('open', r, { once: true }));
		b.ws.addEventListener('message', (ev) => {
			const m = JSON.parse(String(ev.data));
			if (m.id && b.waiting.has(m.id)) {
				b.waiting.get(m.id)!(m);
				b.waiting.delete(m.id);
			} else b.listeners.forEach((l) => l(m));
		});
		const { result } = await b.send('Target.createTarget', { url: 'about:blank' }, false);
		const att = await b.send('Target.attachToTarget', { targetId: result.targetId, flatten: true }, false);
		b.session = att.result.sessionId;
		await b.send('Page.enable');
		await b.send('Runtime.enable');
		return b;
	}

	send(method: string, params: Record<string, unknown> = {}, inSession = true): Promise<any> {
		const id = ++this.id;
		this.ws.send(JSON.stringify({ id, method, params, ...(inSession ? { sessionId: this.session } : {}) }));
		return new Promise((resolve, reject) =>
			this.waiting.set(id, (m) => {
				if (m.error) reject(new Error(`${method}: ${m.error.message}`));
				else resolve(m);
			})
		);
	}

	async viewport(width: number, height: number, mobile = width < 700) {
		await this.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
	}

	async goto(url: string, settleMs = 600) {
		const loaded = new Promise<void>((resolve) => {
			const l = (m: any) => {
				if (m.method === 'Page.loadEventFired') {
					this.listeners = this.listeners.filter((x) => x !== l);
					resolve();
				}
			};
			this.listeners.push(l);
		});
		await this.send('Page.navigate', { url });
		await Promise.race([loaded, new Promise((r) => setTimeout(r, 15000))]);
		await new Promise((r) => setTimeout(r, settleMs));
	}

	async eval<T = unknown>(expression: string): Promise<T> {
		const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
		if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? 'eval failed');
		return r.result.result.value as T;
	}

	async click(selector: string, settleMs = 400) {
		await this.eval(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) throw new Error('no element ' + ${JSON.stringify(selector)}); el.click(); })()`);
		await new Promise((r) => setTimeout(r, settleMs));
	}

	async type(selector: string, text: string) {
		await this.eval(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); el.focus(); el.value = ${JSON.stringify(text)}; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); })()`);
	}

	async setCookie(name: string, value: string, url: string) {
		await this.send('Network.setCookie', { name, value, url });
	}

	async screenshot(fullPage = false): Promise<Buffer> {
		let clip;
		if (fullPage) {
			const m = await this.send('Page.getLayoutMetrics');
			const { width, height } = m.result.cssContentSize;
			clip = { x: 0, y: 0, width, height: Math.min(height, 9000), scale: 1 };
		}
		const r = await this.send('Page.captureScreenshot', { format: 'png', ...(clip ? { clip, captureBeyondViewport: true } : {}) });
		return Buffer.from(r.result.data, 'base64');
	}

	async close() {
		try {
			this.ws.close();
		} catch {
			/* already closed */
		}
		this.proc.kill();
	}
}
