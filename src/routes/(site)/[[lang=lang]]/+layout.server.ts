import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { Lang } from '$lib/types';
import { buildTheme } from '$lib/theme';
import { statusFor } from '$lib/server/store';
import { ldJson, restaurantLd } from '$lib/server/seo';
import { announcing } from '$lib/look';
import { localDate } from '$lib/fmt';

// Runs once per full page load: client-side navigation keeps this data (it never reads the URL path),
// so the menu crosses the wire once per visit.
export const load = async ({ locals, params, url, untrack }) => {
	const store = locals.store;
	if (!store) error(404, 'Not found');
	const langs = store.look.languages;
	if (params.lang && (params.lang === langs[0] || !langs.includes(params.lang as Lang))) error(404, 'Not found');
	const lang = (params.lang ?? langs[0]) as Lang;
	// root = "/p/<token>" on Store › Website's preview link, so every link stays in the preview.
	const root = locals.root;
	const base = root + (params.lang ? `/${params.lang}` : '');
	const theme = buildTheme(store.look.preset, store.look.brand);
	const origin = dev ? untrack(() => url.origin) : `https://${store.host}`;
	const status = await statusFor(locals.host);
	const look = store.look;
	const ann = look.announcement;
	const announcement = announcing(look, localDate(new Date(), store.timezone)) ? (lang === 'es' && ann.text_es) || ann.text : '';
	return {
		store,
		status,
		lang,
		langs,
		base,
		root,
		origin,
		announcement,
		theme: {
			css: theme.css,
			fontFaces: theme.fontFaces,
			preloads: theme.preloads,
			themeColor: theme.themeColor,
			layout: { ...theme.preset.layout, menu: look.menuLayout ?? theme.preset.layout.menu },
			mode: theme.preset.mode,
			preset: theme.preset.id
		},
		restaurantLd: ldJson(restaurantLd(store, status, origin))
	};
};
