import { error } from '@sveltejs/kit';
import { raw } from '$lib/server/main';

/** The store's logo and cover photo (Store › Website uploads), from main. An id never changes, so
 *  browsers keep it for good; an SVG logo can't run anything (sandboxed). */
export const GET = async ({ locals, params }) => {
	if (!locals.store || !/^[0-9a-f-]{36}$/i.test(params.id)) error(404);
	const r = await raw(locals.host, `/channel/v1/site/images/${params.id}`).catch(() => null);
	if (!r) error(503);
	if (!r.ok) error(r.status === 404 ? 404 : 502);
	return new Response(r.body, {
		headers: {
			'content-type': r.headers.get('content-type') ?? 'application/octet-stream',
			'cache-control': 'public, max-age=31536000, immutable',
			'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
			'x-content-type-options': 'nosniff'
		}
	});
};
