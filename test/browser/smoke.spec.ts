import { test, expect } from './fixtures.ts';

test('the home page opens on the store host', async ({ page, go }) => {
	await go('/');
	await expect(page.locator('header')).toContainText('Test Pizza');
});
