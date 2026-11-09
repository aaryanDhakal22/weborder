// Copies main's pricing engine and its shared cases into the storefront (run after main changes
// them). Usage: npm run sync-engine [path/to/main] (default ../main). `--check` only compares.
import { cpSync, readFileSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const check = args.includes('--check');
const main = resolve(args.find((a) => !a.startsWith('--')) ?? '../main');
const engine = join(main, 'backend/frontend/src/lib/pricing/engine.ts');
const cases = join(main, 'backend/internal/domain/pricing/testdata/cases');
if (!existsSync(engine)) {
	console.error(`no engine at ${engine}`);
	process.exit(2);
}
if (check) {
	const same = (a: string, b: string) => readFileSync(a, 'utf8') === readFileSync(b, 'utf8');
	const bad: string[] = [];
	if (!same(engine, 'src/lib/engine.ts')) bad.push('src/lib/engine.ts');
	const theirs = readdirSync(cases).filter((f) => f.endsWith('.json')).sort();
	const ours = readdirSync('test/pricing-cases').filter((f) => f.endsWith('.json')).sort();
	if (theirs.join() !== ours.join()) bad.push('test/pricing-cases (file list)');
	else for (const f of theirs) if (!same(join(cases, f), join('test/pricing-cases', f))) bad.push(`test/pricing-cases/${f}`);
	if (bad.length) {
		console.error(`out of step with main: ${bad.join(', ')} (npm run sync-engine)`);
		process.exit(1);
	}
	console.log('engine + cases match main');
} else {
	cpSync(engine, 'src/lib/engine.ts');
	rmSync('test/pricing-cases', { recursive: true, force: true });
	cpSync(cases, 'test/pricing-cases', { recursive: true });
	console.log(`copied the engine and ${readdirSync('test/pricing-cases').length} cases from ${main}`);
}
