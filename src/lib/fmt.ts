// Display helpers shared by pages (pure).
import type { Lang } from './types.ts';
import { fmtTime, dayName } from './hours.ts';
import { t } from './i18n.ts';

export { money } from './pricing.ts';

export function clock(iso: string | null, tz: string): string {
	if (!iso) return '';
	return new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
}

export function whenOpens(next: { day: string; inDays: number; time: string } | null, lang: Lang): string {
	if (!next) return '';
	const d = next.inDays === 0 ? t(lang, 'today') : next.inDays === 1 ? t(lang, 'tomorrow') : dayName(next.day as never, lang);
	return t(lang, 'opensAt', { d, t: fmtTime(next.time) });
}

export function fromPrice(item: { priceCents: number; sizes?: { priceCents: number }[] }): number {
	return item.sizes?.length ? Math.min(...item.sizes.map((s) => s.priceCents)) : item.priceCents;
}
