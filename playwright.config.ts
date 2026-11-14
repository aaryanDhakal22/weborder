// Browser tests: every page and control of the storefront, clicked in Chromium against a running
// main (dev by default; MAIN_BASE_URL + ADMIN_API_KEY for another). Each worker makes its own
// throwaway store + platform key and starts the production build on a free port
// (test/browser/fixtures.ts), so workers share nothing. Run: npm run test:browser
// (builds first). Browsers: `npx playwright install chromium` once.
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'test/browser',
	outputDir: 'reports/browser',
	snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}',
	fullyParallel: true,
	workers: process.env.CI ? 2 : 4,
	// The gate's rule (scripts/gate.sh "Retry"): a failing test is retried once in a loaded parallel run and a pass
	// on the retry is a flake, listed as "flaky" in the report. The checkout tests' "Place order does nothing"
	// under a loaded release gate (2026-11-14, .dev/notes/agent-batches-2026-11-14.md "Flakes to fix properly") is
	// still open: this keeps a staging-only site from blocking releases meanwhile, it doesn't fix it.
	retries: process.env.GATE_PARALLEL ? 1 : 0,
	timeout: 45_000,
	expect: {
		timeout: 8_000,
		toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: 'disabled', caret: 'hide', scale: 'css' }
	},
	reporter: process.env.CI ? 'line' : [['list'], ['html', { outputFolder: 'reports/browser-html', open: 'never' }]],
	use: {
		reducedMotion: 'reduce', // Miso's still pose; no CSS transitions mid-screenshot
		locale: 'en-US',
		timezoneId: 'America/New_York',
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure'
	},
	projects: [
		{ name: 'phone', use: { ...devices['Pixel 7'], browserName: 'chromium' } },
		{ name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 860 } } }
	]
});
