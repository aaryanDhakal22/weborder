// Page weight and response time for every store's main pages → reports/perf.md.
// Run against a production server with published stores: PERF_PORT=3100 npm run perf
import http from 'node:http';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { mkdir, writeFile } from 'node:fs/promises';
import { Browser } from './cdp.ts';

const port = Number(process.env.PERF_PORT ?? 3000);
const STORES: Record<string, string[]> = { lombardis: ['/', '/menu', '/menu/build-your-own-pizza', '/deals', '/checkout'], fern: ['/', '/menu'], lumbre: ['/', '/menu'] };

function get(host: string, path: string, headers: Record<string, string> = {}): Promise<{ ms: number; body: Buffer; headers: http.IncomingHttpHeaders; status: number }> {
	const t0 = performance.now();
	return new Promise((resolve, reject) => {
		const r = http.request({ hostname: '127.0.0.1', port, path, headers: { host, ...headers } }, (res) => {
			let first = 0;
			const chunks: Buffer[] = [];
			res.on('data', (c) => {
				first ||= performance.now();
				chunks.push(c);
			});
			res.on('end', () => resolve({ ms: (first || performance.now()) - t0, body: Buffer.concat(chunks), headers: res.headers, status: res.statusCode ?? 0 }));
		});
		r.on('error', reject);
		r.end();
	});
}

const kb = (n: number) => (n / 1024).toFixed(1);
const rows: string[] = [];
const browser = await Browser.launch(9335);
await browser.viewport(390, 844);
/** Loads the page in Chrome: JS bytes over the wire and first contentful paint (mobile viewport, no throttling). */
async function inBrowser(url: string) {
	await browser.goto(url, 800);
	return browser.eval<{ js: number; fcp: number }>(`(() => {
		const js = performance.getEntriesByType('resource').filter((r) => r.name.endsWith('.js')).reduce((s, r) => s + (r.encodedBodySize || r.transferSize || 0), 0);
		const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0;
		return { js, fcp };
	})()`);
}
for (const [store, pages] of Object.entries(STORES)) {
	const host = `${store}.localhost`;
	for (const p of pages) {
		const snap = await get(host, p);
		const html = snap.body;
		const ssr = await get(host, `${p}?fresh=${Date.now()}`);
		const b = await inBrowser(`http://${host}:${port}${p}`);
		rows.push(`| ${store} | \`${p}\` | ${snap.headers['x-quicc-snapshot'] ? 'snapshot' : 'SSR'} | ${snap.ms.toFixed(1)} ms | ${ssr.ms.toFixed(1)} ms | ${kb(html.length)} | ${kb(gzipSync(html).length)} | ${kb(brotliCompressSync(html).length)} | ${kb(b.js)} | ${Math.round(b.fcp)} ms |`);
	}
}
await browser.close();
const md = `# Page weight and speed

Measured ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC against the production build on this machine (no network latency).

- **Served** = whether the page came from a published snapshot.
- **Snapshot / SSR time** = time to first byte from the snapshot vs. rendering the same page live.
- **HTML** includes all CSS (inlined) and the menu data; one request renders a styled, complete page.
- **JS KB** = compressed JavaScript the page downloads to become interactive, measured in Chrome (shared across pages and stores; cached by the service worker after the first visit).
- **FCP** = first contentful paint in headless Chrome at phone size, no network throttling (local server).

| Store | Page | Served | Snapshot TTFB | Live SSR TTFB | HTML KB | HTML gzip KB | HTML brotli KB | JS KB | FCP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows.join('\n')}
`;
await mkdir(new URL('../reports/', import.meta.url), { recursive: true });
await writeFile(new URL('../reports/perf.md', import.meta.url), md);
console.log(md);
