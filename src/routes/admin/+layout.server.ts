import { error, redirect } from '@sveltejs/kit';

export const load = async ({ locals, url }) => {
	if (!locals.adminHost) error(404, 'Not found');
	if (!locals.admin && url.pathname !== '/admin/login') redirect(303, '/admin/login');
	return { admin: locals.admin };
};
