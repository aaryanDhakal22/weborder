// Screenshots of every page × breakpoint of one store into reports/screenshots/, plus an index.html
// gallery. Needs a running storefront and main: BASE_PORT=5180 STORE_HOST=lombardis.localhost npm run shots
// The cart is filled through the real UI (the first item with sizes, a half topping, and a side).
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Browser } from './cdp.ts';

const port = process.env.BASE_PORT ?? '5180';
const host = process.env.STORE_HOST ?? 'lombardis.localhost';
const out = new URL('../reports/screenshots/', import.meta.url).pathname;
const WIDTHS: [number, number, string][] = [[390, 844, 'mobile'], [834, 1194, 'tablet'], [1440, 900, 'laptop']];
const origin = `http://${host}:${port}`;

await mkdir(out, { recursive: true });
const b = await Browser.launch(9334);
const shots: { page: string; device: string; file: string }[] = [];
try {
	await b.viewport(1440, 900);
	await b.goto(`${origin}/menu`, 900);
	// The first item with a portion group (a pizza) and the first plain item: added through the item pages.
	const slugs = (await b.eval(`(() => {
		const rows = [...document.querySelectorAll('a.row')];
		return JSON.stringify(rows.map((a) => a.getAttribute('href')));
	})()`)) as string;
	const hrefs: string[] = JSON.parse(slugs);
	const pizza = hrefs.find((h) => /pizza/.test(h)) ?? hrefs[0];
	const side = hrefs.find((h) => /fries|soda|naan|garlic|wings/.test(h)) ?? hrefs[1];
	const item = process.env.ITEM_PAGE ?? pizza;
	for (const h of [pizza, side]) {
		await b.goto(origin + h, 900);
		await b.eval(`(() => {
			const sz = document.querySelectorAll('.sizes-seg button'); if (sz.length > 2) sz[2].click();
			for (const f of document.querySelectorAll('fieldset.grp')) {
				const opts = f.querySelectorAll('.opt-main:not([disabled])');
				const need = f.querySelector('.req');
				if (need && opts[0] && opts[0].getAttribute('aria-checked') !== 'true') opts[0].click();
			}
			const top = [...document.querySelectorAll('fieldset.grp')].find((f) => /topping/i.test(f.textContent));
			const o = top?.querySelectorAll('.opt-main');
			if (o && o[1]) { o[1].click(); }
			return true;
		})()`);
		await new Promise((r) => setTimeout(r, 200));
		await b.eval(`(() => { const l = document.querySelector('.portion button[aria-label]'); if (l) l.click(); return true; })()`);
		await new Promise((r) => setTimeout(r, 200));
		await b.click('.sheet-foot .btn-p', 700);
	}
	const pages = ['/', '/menu', item, '/deals', '/cart', '/checkout', '/account', '/contact', '/es', '/nope'];
	for (const page of pages) {
		for (const [w, h, device] of WIDTHS) {
			await b.viewport(w, h);
			await b.goto(origin + page, 1200);
			const file = `${page === '/' ? '_home' : page.replace(/\//g, '_')}-${device}.png`;
			await writeFile(join(out, file), await b.screenshot(true));
			shots.push({ page, device, file });
		}
	}
	// The item sheet over the menu (laptop: the side panel).
	for (const [w, h, device] of [WIDTHS[0], WIDTHS[2]]) {
		await b.viewport(w, h);
		await b.goto(`${origin}/menu`, 900);
		await b.eval(`(() => { const a = [...document.querySelectorAll('a.row')].find((x) => x.getAttribute('href') === ${JSON.stringify(pizza)}); a?.click(); return true; })()`);
		await new Promise((r) => setTimeout(r, 700));
		const file = `sheet-${device}.png`;
		await writeFile(join(out, file), await b.screenshot(false));
		shots.push({ page: 'item sheet', device, file });
	}
} finally {
	await b.close();
}

const groups = [...new Set(shots.map((s) => s.page))];
const rows = groups.map((p) => `<section><h3>${p}</h3><div class="row">${shots.filter((s) => s.page === p).map((s) => `<figure><a href="${s.file}"><img src="${s.file}" alt="${p} ${s.device}" loading="lazy"></a><figcaption>${s.device}</figcaption></figure>`).join('')}</div></section>`).join('');
await writeFile(
	join(out, 'index.html'),
	`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Storefront screenshots</title><style>body{font:14px system-ui;margin:24px;background:#f4f1fb;color:#1a1530}.row{display:flex;gap:16px;align-items:flex-start;overflow-x:auto}figure{margin:0}img{max-height:640px;border:1px solid #ddd;border-radius:8px;background:#fff}</style><h1>Storefront screenshots · ${host}</h1>${rows}`
);
console.log(`${shots.length} screenshots → reports/screenshots/index.html`);
