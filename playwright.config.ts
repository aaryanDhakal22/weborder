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
	retries: 0,
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
