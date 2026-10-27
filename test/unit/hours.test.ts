import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isOpen, nextOpen, closesAt, hourRows, fmtTime } from '../../src/lib/hours.ts';
import type { Hours } from '../../src/lib/types.ts';

const TZ = 'America/New_York';
const late: Hours = { fri: [{ open: '11:00', close: '02:00' }], sat: [{ open: '11:00', close: '00:00' }] };

test('regular hours in the store timezone', () => {
	const h: Hours = { tue: [{ open: '11:00', close: '23:00' }] };
	assert.equal(isOpen(h, TZ, new Date('2026-10-27T14:59:00Z')), false); // 10:59 EDT
	assert.equal(isOpen(h, TZ, new Date('2026-10-27T15:00:00Z')), true); // 11:00
	assert.equal(isOpen(h, TZ, new Date('2026-10-28T02:59:00Z')), true); // 22:59
	assert.equal(isOpen(h, TZ, new Date('2026-10-28T03:00:00Z')), false); // 23:00
});

test('periods past midnight belong to the day they start', () => {
	assert.equal(isOpen(late, TZ, new Date('2026-10-31T05:30:00Z')), true); // Sat 01:30, Friday's period
	assert.equal(closesAt(late, TZ, new Date('2026-10-31T05:30:00Z')), '02:00');
	assert.equal(isOpen(late, TZ, new Date('2026-10-31T06:30:00Z')), false); // Sat 02:30
	assert.equal(isOpen(late, TZ, new Date('2026-11-01T03:59:00Z')), true); // Sat 23:59 (EDT)
});

test('next opening, today or later in the week', () => {
	const h: Hours = { tue: [{ open: '11:00', close: '23:00' }], thu: [{ open: '12:00', close: '20:00' }] };
	assert.deepEqual(nextOpen(h, TZ, new Date('2026-10-27T13:00:00Z')), { day: 'tue', inDays: 0, time: '11:00' });
	assert.deepEqual(nextOpen(h, TZ, new Date('2026-10-28T03:30:00Z')), { day: 'thu', inDays: 2, time: '12:00' });
});

test('hour rows merge equal days; times print like a menu board', () => {
	const rows = hourRows({ mon: [{ open: '11:00', close: '23:00' }], tue: [{ open: '11:00', close: '23:00' }], sun: [{ open: '06:30', close: '15:00' }] });
	assert.equal(rows[0].label, 'Mon–Tue');
	assert.equal(rows[0].text, '11 AM – 11 PM');
	assert.equal(fmtTime('06:30'), '6:30 AM');
	assert.equal(fmtTime('00:00'), '12 AM');
});
