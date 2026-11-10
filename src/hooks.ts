// Store › Website's private preview link: /p/<token>/… shows the same pages as /… with the store's
// draft look. The prefix only selects the draft (hooks.server.ts reads it); pages and links keep it
// through data.base, in the server and in the browser alike.
import type { Reroute } from '@sveltejs/kit';

export const PREVIEW = /^\/p\/(qpv_[0-9a-f]{8,64})(?=\/|$)/;

export const reroute: Reroute = ({ url }) => {
	const m = PREVIEW.exec(url.pathname);
	if (m) return url.pathname.slice(m[0].length) || '/';
};
