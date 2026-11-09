import type { StoreView } from '$lib/types';

declare global {
	namespace App {
		interface Locals {
			/** The store this request's host serves (null on every other host). */
			store: StoreView | null;
			/** The host as main knows it (X-Site-Host on every call). */
			host: string;
			/** The customer's IP, forwarded to main for its sign-in limits. */
			ip: string;
			/** The customer's session (qcs_…) from the host-only cookie, if signed in. */
			session: string | null;
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
