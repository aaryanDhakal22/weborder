// MAIN_URL: https always; plain http only to a private network (DURABILITY-PLAN.md, "Network").
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mainUrlProblem } from '../../src/lib/server/mainurl.ts';

test('https and private http are fine', () => {
	for (const u of [
		'https://main.quiccpos.com',
		'https://203.0.113.9:1323',
		'http://localhost:1323',
		'http://127.0.0.1:1323',
		'http://[::1]:1323',
		'http://192.168.1.221:1323',
		'http://10.0.0.5',
		'http://172.20.1.1',
		'http://100.101.102.103:1323', // Tailscale
		'http://home-server.tail1234.ts.net:1323',
		'http://main:1323', // a compose service
		'http://[fd7a:115c:a1e0::1]:1323' // Tailscale IPv6
	])
		assert.equal(mainUrlProblem(u), null, u);
});

test('plain http to a public address is refused unless allowed', () => {
	for (const u of ['http://main.quiccpos.com', 'http://203.0.113.9:1323', 'http://172.32.0.1', 'http://100.128.0.1', 'http://8.8.8.8'])
		assert.match(mainUrlProblem(u) ?? '', /plain http/, u);
	assert.equal(mainUrlProblem('http://main.quiccpos.com', true), null);
	assert.match(mainUrlProblem('ftp://x') ?? '', /http/);
	assert.match(mainUrlProblem('not a url') ?? '', /isn't a URL/);
});
