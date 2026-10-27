// What changes by the minute: open/closed, paused, busy, sold out. Pure; used by /api/live and the page.
import type { Hours, Settings } from './types.ts';
import { closesAt, isOpen, nextOpen } from './hours.ts';

export interface LiveState {
	open: boolean;
	closesAt: string | null;
	nextOpen: { day: string; inDays: number; time: string } | null;
	pausedUntil: string | null;
	busyEtaMin: number | null;
	eta: { pickup: number; delivery: number };
	soldOut: string[];
	now: string;
}

export function liveState(store: { hours: Hours; timezone: string; settings: Settings }, now: Date = new Date()): LiveState {
	const s = store.settings;
	const open = isOpen(store.hours, store.timezone, now);
	const paused = s.pausedUntil && new Date(s.pausedUntil) > now ? s.pausedUntil : null;
	const busy = s.busyEtaMin ?? 0;
	return {
		open,
		closesAt: open ? closesAt(store.hours, store.timezone, now) : null,
		nextOpen: open ? null : nextOpen(store.hours, store.timezone, now),
		pausedUntil: paused,
		busyEtaMin: s.busyEtaMin,
		eta: { pickup: Math.max(busy, s.etaPickupMin), delivery: Math.max(busy, s.etaDeliveryMin) },
		soldOut: s.soldOut,
		now: now.toISOString()
	};
}
