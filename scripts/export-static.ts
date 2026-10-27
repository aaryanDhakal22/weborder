// Turns published snapshots into a self-contained, browsable folder (export/) for sharing:
// no JavaScript (cart and checkout need the live server), relative links, fonts copied.
// Usage: EXPORT_DATA=<DATA_DIR> node scripts/export-static.ts [--all]
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const data = process.env.EXPORT_DATA ?? join(root, 'data');
const out = join(root, 'export');
const all = process.argv.includes('--all');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(join(root, 'static/fonts'), join(out, 'fonts'), { recursive: true });

async function walk(dir: string): Promise<string[]> {
	const out: string[] = [];
	for (const e of await readdir(dir, { withFileTypes: true })) {
		const p = join(dir, e.name);
		if (e.isDirectory()) out.push(...(await walk(p)));
		else if (e.name.endsWith('.html')) out.push(p);
	}
	return out;
}

const stores = (await readdir(join(data, 'sites'))).filter((s) => existsSync(join(data, 'sites', s, 'current')));
const summary: { id: string; name: string; pages: number }[] = [];
for (const id of stores) {
	const src = join(data, 'sites', id, 'current');
	const files = await walk(src);
	// Every page with --all; otherwise the main pages plus up to six popular item pages.
	const chosen: string[] = [];
	let items = 0;
	for (const f of files) {
		const r = relative(src, f);
		if (all || !r.startsWith('menu/') || r === 'menu/index.html') chosen.push(f);
		else if (items < 6 && /class="tag tag-pop"/.test(await readFile(f, 'utf8'))) {
			chosen.push(f);
			items++;
		}
	}
	const exported = new Set(chosen.map((f) => relative(src, f)));
	let name = id;
	for (const f of chosen) {
		const rel = relative(src, f);
		const depth = rel.split('/').length - 1;
		const up = '../'.repeat(depth);
		let html = await readFile(f, 'utf8');
		name = /<meta property="og:site_name" content="([^"]+)"/.exec(html)?.[1] ?? name;
		html = html
			.replace(/<script(?![^>]*application\/ld\+json)[\s\S]*?<\/script>/g, '')
			.replace(/<link[^>]+rel="modulepreload"[^>]*>/g, '')
			.replace(/<link rel="(manifest|icon|apple-touch-icon)"[^>]*>/g, '')
			.replace(/url\(\/fonts\//g, `url(${up}../fonts/`)
			.replace(/href="\/fonts\//g, `href="${up}../fonts/`)
			.replace(/href="(\/[^"#?]*)(#[^"]*)?"/g, (_m, path: string, hash = '') => {
				const target = path === '/' ? 'index.html' : `${path.slice(1).replace(/\/$/, '')}/index.html`;
				if (!exported.has(target)) return `href="${up}${path.startsWith('/menu') ? 'menu/index.html' : 'index.html'}${hash}"`;
				return `href="${up}${target}${hash}"`;
			})
			.replace('</body>', `<div style="position:fixed;left:8px;bottom:8px;z-index:99;background:#241b47;color:#f4f1fb;font:600 12px system-ui;padding:6px 10px;border-radius:8px;opacity:.9">Static export · cart and checkout run on the live server</div></body>`);
		const dest = join(out, id, rel);
		await mkdir(dirname(dest), { recursive: true });
		await writeFile(dest, html);
	}
	summary.push({ id, name, pages: chosen.length });
}
await writeFile(join(out, 'stores.json'), JSON.stringify(summary, null, 2));
console.log(summary.map((s) => `${s.id}: ${s.pages} pages`).join('\n'));
