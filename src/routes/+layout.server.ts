import { buildTheme } from '$lib/theme';

/** Only for URLs that match no route: give the store's 404 page its theme (matched pages get it from their layout). */
export const load = async ({ locals, route }) => {
	if (route.id || !locals.store) return {};
	const t = buildTheme(locals.store.site.preset, locals.store.site.brand);
	return { theme: { css: t.css, fontFaces: t.fontFaces }, lang: locals.store.site.languages[0], base: '' };
};
