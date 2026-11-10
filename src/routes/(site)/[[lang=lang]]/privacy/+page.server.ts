import { privacyText } from '$lib/server/copy';

export const load = async ({ locals, parent }) => {
	const { lang } = await parent();
	return { privacy: privacyText(locals.store!, lang) };
};
