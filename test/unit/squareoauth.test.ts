// Square's OAuth redirect relayed to main (DURABILITY-PLAN.md step 6), against a fake main: only a
// well-formed, unexpired state is relayed; the browser goes where main says; the code is never
// logged, shown or put in a header.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { squareCallback, stateLooksValid, type Forward, type ForwardAnswer } from '../../src/lib/server/squareoauth.ts';

const NOW = 1_800_000_000_000;
const LOC = '0b9f3c1e-6a2d-4f7e-9c11-2b3d4e5f6a7b';
const MAC = 'A'.repeat(43);
const state = (expS = NOW / 1000 + 600) => `${LOC}.${expS}.${MAC}`;
const CODE = 'sandbox-sq0cgb-SECRETcode_1234567890';
const BACK = 'http://192.168.1.221:1323/app/store/payments?square=';

function rig(answer: ForwardAnswer | Error = { status: 200, body: { result: 'connected', redirect: BACK + 'connected' } }) {
	const sent: unknown[] = [];
	const logs: string[] = [];
	const forward: Forward = async (b) => {
		sent.push(b);
		if (answer instanceof Error) throw answer;
		return answer;
	};
	return { sent, logs, deps: { forward, now: () => NOW, log: (m: string) => logs.push(m) } };
}

const url = (q: Record<string, string>) => new URL('https://order.quiccpos.com/square/oauth/callback?' + new URLSearchParams(q));

async function noCodeAnywhere(r: Response, logs: string[]) {
	const body = await r.clone().text();
	assert.ok(!body.includes(CODE), 'the code is in the page');
	for (const [, v] of r.headers) assert.ok(!v.includes(CODE), 'the code is in a header');
	assert.ok(!logs.join('\n').includes(CODE), 'the code was logged');
}

test('a good callback is relayed and the browser goes to main', async () => {
	const { sent, logs, deps } = rig();
	const r = await squareCallback(url({ code: CODE, state: state() }), deps);
	assert.equal(r.status, 303);
	assert.equal(r.headers.get('location'), BACK + 'connected');
	assert.equal(r.headers.get('referrer-policy'), 'no-referrer');
	assert.equal(r.headers.get('cache-control'), 'no-store');
	assert.deepEqual(sent, [{ code: CODE, state: state() }]);
	await noCodeAnywhere(r, logs);
});

test('the owner said no: relayed without a code', async () => {
	const { sent, deps } = rig({ status: 200, body: { result: 'denied', redirect: BACK + 'denied' } });
	const r = await squareCallback(url({ error: 'access_denied', state: state() }), deps);
	assert.equal(r.status, 303);
	assert.equal(r.headers.get('location'), BACK + 'denied');
	assert.deepEqual(sent, [{ state: state(), error: 'access_denied' }]);
});

test("main's refusal still sends the browser back with main's flag", async () => {
	const { logs, deps } = rig({ status: 400, body: { result: 'expired', code: 'bad_state', redirect: BACK + 'expired' } });
	const r = await squareCallback(url({ code: CODE, state: state() }), deps);
	assert.equal(r.status, 303);
	assert.equal(r.headers.get('location'), BACK + 'expired');
	await noCodeAnywhere(r, logs);
});

test('malformed or expired states are never relayed', async () => {
	const bad: Record<string, string>[] = [
		{ code: CODE },
		{ code: CODE, state: 'nope' },
		{ code: CODE, state: `${LOC}.123.short` },
		{ code: CODE, state: `not-a-uuid.${NOW / 1000 + 600}.${MAC}` },
		{ code: CODE, state: state() + '.extra' },
		{ state: state() }, // neither a code nor an error
		{ code: 'bad code with spaces', state: state() },
		{ code: 'x'.repeat(1025), state: state() },
		{ error: '<script>', state: state() },
		{ code: CODE, state: state(NOW / 1000 - 600) } // 10 min past main's 15-min expiry
	];
	for (const q of bad) {
		const { sent, logs, deps } = rig();
		const r = await squareCallback(url(q), deps);
		assert.equal(r.status, 400, JSON.stringify(q));
		assert.equal(sent.length, 0, `relayed ${JSON.stringify(q)}`);
		assert.match(r.headers.get('content-type') ?? '', /text\/html/);
		await noCodeAnywhere(r, logs);
	}
});

test('a small clock skew is allowed; main has the final word', () => {
	assert.ok(stateLooksValid(state(NOW / 1000 - 60), NOW));
	assert.ok(!stateLooksValid(state(NOW / 1000 - 600), NOW));
});

test("main unreachable, refusing our key, or answering without an absolute redirect: a page, no code", async () => {
	const cases: [ForwardAnswer | Error, number, RegExp][] = [
		[new Error('ECONNREFUSED ' + CODE), 502, /didn't answer/],
		[{ status: 401, body: { code: 'unauthorized' } as never }, 502, /didn't accept this server/],
		[{ status: 200, body: { result: 'connected', redirect: '/app/store/payments?square=connected' } }, 200, /Square is connected/],
		[{ status: 502, body: { result: 'error', redirect: 'javascript:alert(1)' } }, 400, /couldn't be connected/],
		[{ status: 500, body: null }, 502, /didn't accept this server/]
	];
	for (const [answer, status, text] of cases) {
		const { logs, deps } = rig(answer);
		const r = await squareCallback(url({ code: CODE, state: state() }), deps);
		assert.equal(r.status, status, String((answer as Error).message ?? JSON.stringify(answer)));
		assert.equal(r.headers.get('location'), null);
		assert.match(await r.clone().text(), text);
		await noCodeAnywhere(r, logs);
	}
});
