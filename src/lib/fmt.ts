// Display helpers shared by pages (pure).
import type { Lang } from './types.ts';
import { t } from './i18n.ts';

export { money } from './engine.ts';

/** "7:30 PM" in the store's zone. */
export function clock(iso: string | null | undefined, tz: string): string {
	if (!iso) return '';
	return new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
}

/** "Mon, Nov 10" in the store's zone. */
export function dayLabel(iso: string, tz: string, lang: Lang): string {
	return new Intl.DateTimeFormat(lang === 'es' ? 'es-US' : 'en-US', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(iso));
}

/** The local date (YYYY-MM-DD) of an instant in the store's zone. */
export function localDate(at: Date, tz: string): string {
	const p = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(at);
	return p;
}

/** "Opens today at 11:00 AM" from main's next_open_at. */
export function whenOpens(nextOpen: string | null, tz: string, lang: Lang, now = new Date()): string {
	if (!nextOpen) return '';
	const at = new Date(nextOpen);
	const days = Math.round((Date.parse(localDate(at, tz)) - Date.parse(localDate(now, tz))) / 86_400_000);
	const d = days <= 0 ? t(lang, 'today') : days === 1 ? t(lang, 'tomorrow') : new Intl.DateTimeFormat(lang === 'es' ? 'es-US' : 'en-US', { timeZone: tz, weekday: 'long' }).format(at);
	return t(lang, 'opensAt', { d, t: clock(nextOpen, tz) });
}

/** "11:00" → "11 AM", "23:30" → "11:30 PM". */
export function fmtHHMM(s: string): string {
	const [h, m] = s.split(':').map(Number);
	const ap = h % 24 >= 12 ? 'PM' : 'AM';
	const h12 = h % 12 === 0 ? 12 : h % 12;
	return m ? `${h12}:${String(m).padStart(2, '0')} ${ap}` : `${h12} ${ap}`;
}

/** (410) 555-0101 from any 10 digits. */
export function fmtPhone(p: string): string {
	const d = p.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
	return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : p;
}

export const telHref = (p: string) => `tel:+1${p.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '')}`;

/** The week from main's store status as rows: "Mon · 11 AM – 11 PM", today first. */
export function weekRows(week: { date: string; closed: boolean; hours: { open: string; close: string }[]; note: string }[], lang: Lang, closedLabel: string, alwaysLabel: string, hoursSet = true) {
	return week.map((d, i) => {
		const day = new Intl.DateTimeFormat(lang === 'es' ? 'es-US' : 'en-US', { timeZone: 'UTC', weekday: 'short' }).format(new Date(`${d.date}T12:00:00Z`));
		const text = !hoursSet ? alwaysLabel : d.closed || !d.hours.length ? closedLabel : d.hours.map((h) => `${fmtHHMM(h.open)} – ${fmtHHMM(h.close)}`).join(', ');
		return { date: d.date, day, today: i === 0, text, note: d.note };
	});
}
