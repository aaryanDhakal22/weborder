import { error } from '@sveltejs/kit';
import { buildTheme } from '$lib/theme';

/** Per-host web app manifest: an installed storefront carries the store's own name, icon and colors. */
export const GET = async ({ locals }) => {
	const store = locals.store;
	if (!store) error(404);
	const theme = buildTheme(store.look.preset, store.look.brand);
	const manifest = {
		id: '/',
		name: store.name,
		short_name: store.name.length > 12 ? store.name.split(/\s+/)[0] : store.name,
		description: `Order from ${store.name}`,
		start_url: '/',
		scope: '/',
		display: 'standalone',
		background_color: theme.palette.canvas,
		theme_color: theme.palette.canvas,
		lang: store.look.languages[0],
		// The store's logo (Store › Website, 512 × 512) is its app icon; else one drawn from its initials.
		icons: store.look.logo
			? [{ src: `/media/${store.look.logo}`, sizes: '512x512', purpose: 'any' }, { src: '/icon.svg?maskable', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }]
			: [
					{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
					{ src: '/icon.svg?maskable', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }
				]
	};
	return new Response(JSON.stringify(manifest), { headers: { 'content-type': 'application/manifest+json', 'cache-control': 'public, max-age=3600' } });
};
