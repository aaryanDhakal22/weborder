// The hours card's rows (weekRows): a dated exception shows on a store with or without regular hours.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { weekRows } from '../../src/lib/fmt.ts';

const day = (date: string, closed: boolean, hours: { open: string; close: string }[] = [], note = '') => ({ date, closed, hours, note });

test('weekRows: regular hours, a closed date and a short day', () => {
	const rows = weekRows([day('2026-11-09', false, [{ open: '11:00', close: '22:00' }]), day('2026-11-10', true, [], 'Private event'), day('2026-11-11', false)], 'en', 'Closed', 'Open', true);
	assert.deepEqual(rows.map((r) => [r.day, r.today, r.note]), [['Mon', true, ''], ['Tue', false, 'Private event'], ['Wed', false, '']]);
	assert.match(rows[0].text, /11/);
	assert.equal(rows[1].text, 'Closed');
	assert.equal(rows[2].text, 'Closed', 'no hours on a store with hours = closed that day');
});

test('weekRows: no regular hours = open, but a closed date still says closed and a dated short day its hours', () => {
	const rows = weekRows([day('2026-11-09', false), day('2026-11-10', true, [], 'Private event'), day('2026-11-11', false, [{ open: '12:00', close: '15:00' }], 'Short day')], 'en', 'Closed', 'Open', false);
	assert.equal(rows[0].text, 'Open');
	assert.equal(rows[1].text, 'Closed');
	assert.match(rows[2].text, /12/);
	assert.notEqual(rows[2].text, 'Open');
});
