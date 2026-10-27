// CLI for the admin API: create, list and publish stores from the terminal.
//   npm run store -- list
//   npm run store -- create --name "Tony's Pizza" --preset pizzeria-loud --brand "#C0392B" \
//        --type pizza_delivery --street "1 Main St" --city Towson --state MD --zip 21204 \
//        --phone "(410) 555-0100" --cuisine "Pizza, Subs" --csv menu.csv --publish
//   npm run store -- publish <id>
// Env: ADMIN_URL (default http://127.0.0.1:5173), ADMIN_HOST (admin.localhost), ADMIN_PASSWORD (quicc-dev).
import http from 'node:http';
import https from 'node:https';
import { readFile } from 'node:fs/promises';

const base = new URL(process.env.ADMIN_URL ?? 'http://127.0.0.1:5173');
const host = process.env.ADMIN_HOST ?? 'admin.localhost';
const password = process.env.ADMIN_PASSWORD ?? 'quicc-dev';

function call(method: string, path: string, body?: unknown): Promise<{ status: number; data: any }> {
	const lib = base.protocol === 'https:' ? https : http;
	const payload = body ? JSON.stringify(body) : undefined;
	return new Promise((resolve, reject) => {
		const req = lib.request(
			{ hostname: base.hostname, port: base.port, path, method, headers: { host: base.hostname === '127.0.0.1' ? `${host}:${base.port}` : base.host, authorization: `Bearer ${password}`, 'content-type': 'application/json', ...(payload ? { 'content-length': Buffer.byteLength(payload) } : {}) } },
			(res) => {
				let raw = '';
				res.on('data', (c) => (raw += c));
				res.on('end', () => {
					try {
						resolve({ status: res.statusCode ?? 0, data: JSON.parse(raw) });
					} catch {
						resolve({ status: res.statusCode ?? 0, data: raw });
					}
				});
			}
		);
		req.on('error', reject);
		if (payload) req.write(payload);
		req.end();
	});
}

function flags(args: string[]) {
	const out: Record<string, string | boolean> = {};
	for (let i = 0; i < args.length; i++) {
		if (!args[i].startsWith('--')) continue;
		const k = args[i].slice(2);
		const v = args[i + 1];
		if (v === undefined || v.startsWith('--')) out[k] = true;
		else {
			out[k] = v;
			i++;
		}
	}
	return out;
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'list') {
	const r = await call('GET', '/admin/api/stores');
	if (r.status !== 200) throw new Error(JSON.stringify(r.data));
	for (const s of r.data) console.log(`${s.id.padEnd(16)} ${s.status.padEnd(6)} v${String(s.version).padEnd(4)} ${String(s.items).padStart(4)} items  ${s.preset.padEnd(14)} ${s.url}`);
} else if (cmd === 'create') {
	const f = flags(rest);
	if (!f.name) throw new Error('--name is required');
	const body = {
		name: f.name, slug: f.slug, storeType: f.type, preset: f.preset, brand: f.brand, line1: f.street, city: f.city, state: f.state, zip: f.zip,
		phone: f.phone, cuisine: f.cuisine, timezone: f.timezone, languages: typeof f.languages === 'string' ? f.languages.split(',') : undefined,
		hours: f.hours, zips: f.zips, csv: typeof f.csv === 'string' ? await readFile(f.csv, 'utf8') : undefined, publish: !!f.publish
	};
	const r = await call('POST', '/admin/api/stores', body);
	if (r.status !== 201) {
		console.error('Failed:', r.data?.error ?? r.data);
		process.exit(1);
	}
	console.log(`Created ${r.data.id} → ${r.data.url}`);
	if (r.data.report) console.log(`Menu: ${r.data.report.items} items, ${r.data.report.dropped} POS leftovers dropped, ${r.data.report.popular} popular`);
	if (r.data.published) console.log(`Published v${r.data.published.version}: ${r.data.published.pages} pages in ${r.data.published.ms} ms`);
	else console.log('Draft: open the admin to preview, then publish.');
} else if (cmd === 'publish') {
	const id = rest[0];
	const r = await call('POST', `/admin/api/stores/${encodeURIComponent(id)}/publish`);
	if (r.status !== 200) {
		console.error('Failed:', r.data?.error ?? r.data);
		process.exit(1);
	}
	console.log(`Published ${id} v${r.data.version}: ${r.data.pages} pages in ${r.data.ms} ms`);
} else {
	console.log('Usage: npm run store -- list | create --name … [--csv file] [--publish] | publish <id>');
}
