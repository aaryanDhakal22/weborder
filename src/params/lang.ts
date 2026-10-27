import type { ParamMatcher } from '@sveltejs/kit';

export const match: ParamMatcher = (p) => p === 'en' || p === 'es';
