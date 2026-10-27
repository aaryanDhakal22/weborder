// Downloads the latin-subset woff2 files for every preset font into static/fonts/
// and writes src/lib/fonts.json (family → faces). Run once; the files are committed.
// Std lib only: fetch + fs.
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const FAMILIES: Record<string, string> = {
	Barlow: 'wght@400;500;600;700;800',
	'Barlow Condensed': 'wght@600;700;800',
	'Barlow Semi Condensed': 'wght@500;600;700;800',
	'Young Serif': '',
	'Instrument Sans': 'wght@400;500;600;700',
	'Bowlby One': '',
	Rubik: 'wght@400;500;600;700;800',
	Inter: 'wght@400;500;600;700',
	'JetBrains Mono': 'wght@500;600;800'
};

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const root = new URL('..', import.meta.url).pathname;
const outDir = join(root, 'static/fonts');
await mkdir(outDir, { recursive: true });

const manifest: Record<string, { weight: string; file: string }[]> = {};
for (const [family, axis] of Object.entries(FAMILIES)) {
	const q = family.replace(/ /g, '+') + (axis ? ':' + axis : '');
	const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${q}&display=swap`, { headers: { 'user-agent': UA } })).text();
	// Each @font-face block is preceded by a /* subset */ comment; keep latin only.
	const blocks = css.split('/* ').filter((b) => b.startsWith('latin */'));
	const seen = new Map<string, string[]>();
	for (const b of blocks) {
		const url = /url\((https:[^)]+\.woff2)\)/.exec(b)?.[1];
		const weight = /font-weight:\s*([^;]+);/.exec(b)?.[1].trim() ?? '400';
		if (!url) continue;
		seen.set(url, [...(seen.get(url) ?? []), weight]);
	}
	manifest[family] = [];
	for (const [url, weights] of seen) {
		const slug = family.toLowerCase().replace(/ /g, '-');
		const variable = weights.length > 1;
		const weight = variable ? `${weights[0]} ${weights[weights.length - 1]}` : weights[0];
		const file = `${slug}-${variable ? 'var' : weights[0]}.woff2`;
		const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
		await writeFile(join(outDir, file), buf);
		manifest[family].push({ weight, file });
		console.log(`${file}  ${weight}  ${(buf.length / 1024).toFixed(1)} KB`);
	}
}
await writeFile(join(root, 'src/lib/fonts.json'), JSON.stringify(manifest, null, '\t') + '\n');
