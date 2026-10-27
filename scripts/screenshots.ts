// Screenshots of every store × page × breakpoint into reports/screenshots/, plus an index.html gallery.
// Needs a running server (dev or `npm start`): BASE_PORT=5173 npm run shots
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Browser } from './cdp.ts';

const port = process.env.BASE_PORT ?? '5173';
const out = new URL('../reports/screenshots/', import.meta.url).pathname;
const WIDTHS: [number, number, string][] = [[390, 844, 'mobile'], [834, 1194, 'tablet'], [1440, 900, 'laptop']];
const CART: Record<string, unknown[]> = {
	lombardis: [
		{ kind: 'item', itemId: 'build-your-own-pizza', sizeId: 's-14', opts: [{ g: 'pizza-sauce', o: 'regular' }, { g: 'pizza-toppings', o: 'pepperoni', p: 'left' }, { g: 'pizza-toppings', o: 'mushrooms', p: 'whole' }], qty: 1 },
		{ kind: 'item', itemId: 'cheesesteak-sub', sizeId: 's-12', opts: [{ g: 'sub-toppings', o: 'fried-onions' }], qty: 1 },
		{ kind: 'item', itemId: 'garlic-naan', opts: [], qty: 2 }
	],
	fern: [{ kind: 'item', itemId: 'latte', opts: [{ g: 'coffee-size', o: '12oz' }, { g: 'milk', o: 'oat' }], qty: 1 }, { kind: 'item', itemId: 'almond-croissant', opts: [], qty: 1 }],
	lumbre: [{ kind: 'item', itemId: 'al-pastor', opts: [{ g: 'salsa', o: 'verde' }, { g: 'taco-incluye', o: 'cebolla' }, { g: 'taco-incluye', o: 'cilantro' }], qty: 3 }, { kind: 'item', itemId: 'horchata', opts: [{ g: 'agua-size', o: 'chica' }], qty: 2 }]
};
const PAGES: Record<string, string[]> = {
	lombardis: ['/', '/menu', '/menu/build-your-own-pizza', '/deals', '/deals/game-day', '/cart', '/checkout', '/contact', '/nope'],
	fern: ['/', '/menu', '/menu/latte', '/deals', '/cart', '/checkout'],
	lumbre: ['/', '/menu', '/menu/al-pastor', '/deals/taco-tuesday', '/cart', '/checkout', '/en']
};

await mkdir(out, { recursive: true });
const b = await Browser.launch(9334);
const shots: { store: string; page: string; device: string; file: string }[] = [];
try {
	for (const [store, pages] of Object.entries(PAGES)) {
		const origin = `http://${store}.localhost:${port}`;
		await b.viewport(1200, 800);
		await b.goto(`${origin}/`);
		// Fill the cart the way the site does (prices from the server's quote).
		await b.eval(`(async () => {
			const lines = ${JSON.stringify(CART[store])};
			const q = await (await fetch('/api/quote', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ lines, fulfil: 'pickup' }) })).json();
			const entries = lines.map((line, i) => ({ line, name: q.lines[i].name, mods: q.lines[i].mods, unitCents: q.lines[i].unitCents }));
			localStorage.setItem('qcart', JSON.stringify({ entries, fulfil: ${store === 'fern' ? "'pickup'" : "'delivery'"}, code: '', at: Date.now() }));
		})()`);
		for (const page of pages) {
			for (const [w, h, device] of WIDTHS) {
				await b.viewport(w, h);
				await b.goto(origin + page, 900);
				const file = `${store}${page.replace(/\//g, '_') || '_home'}-${device}.png`;
				await writeFile(join(out, file), await b.screenshot(true));
				shots.push({ store, page, device, file });
			}
		}
	}
} finally {
	await b.close();
}

const rows = Object.keys(PAGES)
	.map((store) => `<h2>${store}</h2>${PAGES[store].map((p) => `<section><h3>${p}</h3><div class="row">${shots.filter((s) => s.store === store && s.page === p).map((s) => `<figure><a href="${s.file}"><img src="${s.file}" alt="${store} ${p} ${s.device}" loading="lazy"></a><figcaption>${s.device}</figcaption></figure>`).join('')}</div></section>`).join('')}`)
	.join('');
await writeFile(
	join(out, 'index.html'),
	`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Storefront screenshots</title><style>body{font:14px system-ui;margin:24px;background:#f4f1fb;color:#1a1530}.row{display:flex;gap:16px;align-items:flex-start;overflow-x:auto}figure{margin:0}img{max-height:640px;border:1px solid #ddd;border-radius:8px;background:#fff}h2{margin-top:40px;text-transform:capitalize}</style><h1>Storefront screenshots</h1>${rows}`
);
console.log(`${shots.length} screenshots → reports/screenshots/index.html`);
