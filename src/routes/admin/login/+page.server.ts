import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { ADMIN_COOKIE, checkPassword, startSession } from '$lib/server/auth';

export const actions = {
	login: async ({ request, cookies }) => {
		const form = await request.formData();
		if (!checkPassword(String(form.get('password') ?? ''))) return fail(401, { error: 'Wrong password.' });
		startSession(cookies, !dev);
		redirect(303, '/admin');
	},
	logout: async ({ cookies }) => {
		cookies.delete(ADMIN_COOKIE, { path: '/' });
		redirect(303, '/admin/login');
	}
};
