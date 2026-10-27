import { error } from '@sveltejs/kit';
import { buildTheme } from '$lib/theme';
import { esc } from '$lib/util';

/** The store's app icon, drawn from its brand color and initials (no image upload needed). */
export const GET = async ({ locals, url }) => {
	const store = locals.store;
	if (!store) error(404);
	const p = buildTheme(store.site.preset, store.site.brand).palette;
	const words = store.name.replace(/[^A-Za-z ]/g, '').split(/\s+/).filter(Boolean);
	const initials = (words.length > 1 && words[0].length <= 3 ? words[0][0] + words[1][0] : words[0]?.[0] ?? 'Q').toUpperCase();
	const pad = url.searchParams.has('maskable') ? 0 : 48;
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect x="${pad / 2}" y="${pad / 2}" width="${512 - pad}" height="${512 - pad}" rx="${pad ? 112 : 0}" fill="${p.brand}"/><text x="256" y="256" dy=".35em" text-anchor="middle" font-family="Arial Black, Helvetica, sans-serif" font-weight="900" font-size="${initials.length > 1 ? 200 : 280}" fill="${p['on-brand']}">${esc(initials)}</text></svg>`;
	return new Response(svg, { headers: { 'content-type': 'image/svg+xml', 'cache-control': 'public, max-age=86400' } });
};
