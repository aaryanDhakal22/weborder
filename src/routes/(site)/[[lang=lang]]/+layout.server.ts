import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { Lang } from '$lib/types';
import { buildTheme } from '$lib/theme';
import { liveState } from '$lib/live';
import { primaryHost, toPublic } from '$lib/server/tenancy';
import { ldJson, restaurantLd } from '$lib/server/seo';

export const load = async ({ locals, params, url }) => {
	const store = locals.store;
	if (!store) error(404, 'Not found');
	const langs = store.site.languages;
	if (params.lang && (params.lang === langs[0] || !langs.includes(params.lang as Lang))) error(404, 'Not found');
	const lang = (params.lang ?? langs[0]) as Lang;
	const base = params.lang ? `/${params.lang}` : '';
	const ov = locals.previewOverrides;
	const theme = buildTheme(ov?.preset ?? store.site.preset, ov?.brand ?? store.site.brand);
	const origin = dev ? url.origin : `https://${primaryHost(store)}`;
	const rest = base ? url.pathname.slice(base.length) || '/' : url.pathname;
	return {
		store: toPublic(store),
		lang,
		langs,
		base,
		origin,
		rest,
		live: liveState(store),
		banner: locals.preview && !locals.render ? (store.status === 'draft' ? 'draft' : 'preview') : null,
		theme: {
			css: theme.css,
			fontFaces: theme.fontFaces,
			preloads: theme.preloads,
			themeColor: theme.themeColor,
			layout: theme.preset.layout,
			mode: theme.preset.mode,
			preset: theme.preset.id
		},
		restaurantLd: ldJson(restaurantLd(store, origin, lang))
	};
};
