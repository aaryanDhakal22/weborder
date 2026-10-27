// Opening hours in the store's timezone (a port of main's domain/tenancy/hours.go IsOpen).
// Pure module: runs in the browser (open-now badge), on the server and under node:test.
import type { Day, Hours, Lang } from './types.ts';

const WEEK: Day[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const SHORT: Record<string, Day> = { Sun: 'sun', Mon: 'mon', Tue: 'tue', Wed: 'wed', Thu: 'thu', Fri: 'fri', Sat: 'sat' };

export interface LocalNow {
	day: Day;
	minutes: number;
	date: string;
}

export function localNow(at: Date, tz: string): LocalNow {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: tz,
		weekday: 'short',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23'
	}).formatToParts(at);
	const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
	return {
		day: SHORT[get('weekday')],
		minutes: Number(get('hour')) * 60 + Number(get('minute')),
		date: `${get('year')}-${get('month')}-${get('day')}`
	};
}

export const toMin = (s: string) => {
	const [h, m] = s.split(':').map(Number);
	return h * 60 + (m || 0);
};

/** True when `at` falls in an opening period; handles periods past midnight. */
export function isOpen(hours: Hours, tz: string, at: Date = new Date()): boolean {
	const now = localNow(at, tz);
	for (const p of hours[now.day] ?? []) {
		const o = toMin(p.open);
		const c = toMin(p.close);
		if (c <= o ? now.minutes >= o : now.minutes >= o && now.minutes < c) return true;
	}
	const prev = WEEK[(WEEK.indexOf(now.day) + 6) % 7];
	for (const p of hours[prev] ?? []) {
		const o = toMin(p.open);
		const c = toMin(p.close);
		if (c <= o && now.minutes < c) return true;
	}
	return false;
}

/** Closing time of the period open right now, e.g. "23:00". */
export function closesAt(hours: Hours, tz: string, at: Date = new Date()): string | null {
	const now = localNow(at, tz);
	for (const p of hours[now.day] ?? []) {
		const o = toMin(p.open);
		const c = toMin(p.close);
		if (c <= o ? now.minutes >= o : now.minutes >= o && now.minutes < c) return p.close;
	}
	const prev = WEEK[(WEEK.indexOf(now.day) + 6) % 7];
	for (const p of hours[prev] ?? []) if (toMin(p.close) <= toMin(p.open) && now.minutes < toMin(p.close)) return p.close;
	return null;
}

/** Next opening after `at`: which day (0 = today) and time. */
export function nextOpen(hours: Hours, tz: string, at: Date = new Date()): { day: Day; inDays: number; time: string } | null {
	const now = localNow(at, tz);
	const start = WEEK.indexOf(now.day);
	for (let d = 0; d < 8; d++) {
		const day = WEEK[(start + d) % 7];
		const periods = [...(hours[day] ?? [])].sort((a, b) => toMin(a.open) - toMin(b.open));
		for (const p of periods) if (d > 0 || toMin(p.open) > now.minutes) return { day, inDays: d, time: p.open };
	}
	return null;
}

export function fmtTime(s: string): string {
	const m = toMin(s) % (24 * 60);
	const h = Math.floor(m / 60);
	const mm = m % 60;
	const h12 = h % 12 === 0 ? 12 : h % 12;
	return `${h12}${mm ? ':' + String(mm).padStart(2, '0') : ''} ${h < 12 ? 'AM' : 'PM'}`;
}

const DAY_NAMES: Record<Lang, Record<Day, string>> = {
	en: { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' },
	es: { mon: 'Lun', tue: 'Mar', wed: 'Mié', thu: 'Jue', fri: 'Vie', sat: 'Sáb', sun: 'Dom' }
};
export const dayName = (d: Day, lang: Lang = 'en') => DAY_NAMES[lang][d];

/** Rows like "Mon–Thu · 11 AM – 11 PM", consecutive days with equal hours merged. */
export function hourRows(hours: Hours, lang: Lang = 'en', closedLabel = 'Closed'): { days: Day[]; label: string; text: string }[] {
	const order: Day[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
	const text = (d: Day) => (hours[d]?.length ? hours[d]!.map((p) => `${fmtTime(p.open)} – ${fmtTime(p.close)}`).join(', ') : closedLabel);
	const rows: { days: Day[]; label: string; text: string }[] = [];
	for (const d of order) {
		const last = rows[rows.length - 1];
		if (last && last.text === text(d)) last.days.push(d);
		else rows.push({ days: [d], label: '', text: text(d) });
	}
	for (const r of rows) r.label = r.days.length === 1 ? dayName(r.days[0], lang) : `${dayName(r.days[0], lang)}–${dayName(r.days[r.days.length - 1], lang)}`;
	return rows;
}

/** Schema.org openingHoursSpecification. */
export function openingSpec(hours: Hours) {
	const full: Record<Day, string> = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };
	const out: { '@type': string; dayOfWeek: string; opens: string; closes: string }[] = [];
	for (const d of Object.keys(hours) as Day[]) for (const p of hours[d] ?? []) out.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: full[d], opens: p.open, closes: p.close });
	return out;
}
