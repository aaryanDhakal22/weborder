import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { Lang } from '$lib/types';
import { buildTheme } from '$lib/theme';
import { statusFor } from '$lib/server/store';
import { ldJson, restaurantLd } from '$lib/server/seo';

// Runs once per full page load: client-side navigation keeps this data (it never reads the URL path),
// so the menu crosses the wire once per visit.
export const load = async ({ locals, params, url, untrack }) => {
	const store = locals.store;
	if (!store) error(404, 'Not found');
	const langs = store.look.languages;
	if (params.lang && (params.lang === langs[0] || !langs.includes(params.lang as Lang))) error(404, 'Not found');
	const lang = (params.lang ?? langs[0]) as Lang;
	const base = params.lang ? `/${params.lang}` : '';
	const theme = buildTheme(store.look.preset, store.look.brand);
	const origin = dev ? untrack(() => url.origin) : `https://${store.host}`;
	const status = await statusFor(locals.host);
	return {
		store,
		status,
		lang,
		langs,
		base,
		origin,
		theme: {
			css: theme.css,
			fontFaces: theme.fontFaces,
			preloads: theme.preloads,
			themeColor: theme.themeColor,
			layout: theme.preset.layout,
			mode: theme.preset.mode,
			preset: theme.preset.id
		},
		restaurantLd: ldJson(restaurantLd(store, status, origin))
	};
};
