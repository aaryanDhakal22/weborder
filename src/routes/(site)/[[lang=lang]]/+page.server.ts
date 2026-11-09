import { homeCopy } from '$lib/server/copy';
import { homeTitle } from '$lib/server/seo';

export const load = async ({ locals, parent }) => {
	const store = locals.store!;
	const { lang } = await parent();
	return { copy: homeCopy(store, lang), title: homeTitle(store, lang) };
};
