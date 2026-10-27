import type { Store } from '$lib/types';

declare global {
	namespace App {
		interface Locals {
			/** The store this request's host resolved to (storefront hosts only). */
			store: Store | null;
			/** True on the admin host. */
			adminHost: boolean;
			/** True when an admin session cookie is valid. */
			admin: boolean;
			/** True for the publisher's own render requests and signed previews. */
			preview: boolean;
			/** The publisher's own render request (no preview banner, no noindex). */
			render: boolean;
			/** Preset/brand trial from a signed admin preview link. */
			previewOverrides: { preset?: string; brand?: string } | null;
		}
		interface PageState {
			sheet?: string;
			install?: boolean;
		}
		interface Error {
			message: string;
			code?: string;
		}
	}
}

export {};
