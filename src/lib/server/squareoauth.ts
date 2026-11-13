// Square's OAuth redirect, relayed to main (DURABILITY-PLAN.md step 6). main sits on a private
// network, so the Square app's one registered redirect URL is this server's public
// `/square/oauth/callback`, on any host it answers (it never needs a store: main's signed `state`
// names the store). The storefront checks the shape of what Square sent, relays `{code, state}` (or
// `{state, error}` when the owner said no) server to server to main's `POST /square/oauth/forward`
// with its platform key, and sends the manager's browser to main's answer: Store › Settings › Payments with
// `?square=connected|denied|expired|error`. main checks the state's signature and expiry and does
// the code exchange; nothing is stored here.
// **The code is never logged or kept**: not in logs, pages or headers, and the browser leaves with
// `Referrer-Policy: no-referrer` so the callback URL never reaches main's page as a Referer.
// Pure (no $env): hooks.server.ts wires it with cfg; unit-tested with a fake main.

export const SQUARE_CALLBACK = '/square/oauth/callback';

/** main's answer: `{result, redirect}` (plus `{error, code}` when refused). */
export interface ForwardAnswer {
	status: number;
	body: { result?: string; redirect?: string; code?: string } | null;
}

export type Forward = (body: { code?: string; state: string; error?: string }) => Promise<ForwardAnswer>;

export interface CallbackDeps {
	forward: Forward;
	now?: () => number;
	/** A line for the server log; never given the code. */
	log?: (msg: string) => void;
}

// main's state: <location uuid>.<unix expiry>.<base64url HMAC-SHA256> (squarepay.state), ≤ 15 min.
const STATE = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(\d{9,11})\.([A-Za-z0-9_-]{43})$/;
const CODE = /^[A-Za-z0-9_-]{1,1024}$/; // Square: sq0cgp-… / sandbox-sq0cgb-…
const ERROR = /^[a-z_]{1,64}$/; // access_denied, …
const SKEW_S = 120; // our clock may run ahead of main's; main has the final word

/** Is this what main's Connect Square link could have produced and not yet expired? (Shape only:
 * the signature is main's to check.) */
export function stateLooksValid(state: string, nowMs: number): boolean {
	const m = STATE.exec(state);
	return !!m && Number(m[2]) + SKEW_S >= Math.floor(nowMs / 1000);
}

const PAGE_CSS = `body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0f0d1a;color:#f4f1fb;font:16px/1.5 system-ui,sans-serif;text-align:center;padding:24px}
.q{width:48px;height:48px;border-radius:13px;background:#ac94f4;color:#241b47;display:grid;place-items:center;font:800 28px system-ui;margin:0 auto 16px}p{color:#b8b0d4;max-width:32em}`;

function page(status: number, title: string, text: string): Response {
	const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title><style>${PAGE_CSS}</style></head><body><main><div class="q">q</div><h1>${title}</h1><p>${text}</p></main></body></html>`;
	return new Response(html, { status, headers: { ...SAFE, 'content-type': 'text/html; charset=utf-8' } });
}

const SAFE = { 'cache-control': 'no-store', 'referrer-policy': 'no-referrer', 'x-robots-tag': 'noindex', 'x-content-type-options': 'nosniff' };

const AGAIN = 'Go back to Store › Settings › Payments in quicc and press Connect Square again.';
const RESULT_TEXT: Record<string, [string, string]> = {
	connected: ['Square is connected', 'You can close this tab and go back to Store › Settings › Payments in quicc.'],
	denied: ['Square was not connected', `Square wasn't given access. ${AGAIN}`],
	expired: ['This link expired', `The Square sign-in link is too old or isn't valid. ${AGAIN}`],
	error: ["Square couldn't be connected", `Something went wrong while connecting. ${AGAIN}`]
};

function resultPage(result: string | undefined): Response {
	const [title, text] = RESULT_TEXT[result ?? 'error'] ?? RESULT_TEXT.error;
	return page(result === 'connected' ? 200 : 400, title, text);
}

/** Where main says to send the browser: only an absolute http(s) URL (a relative one would be
 * relative to this server, not main). */
function absolute(u: unknown): string | null {
	if (typeof u !== 'string') return null;
	try {
		const p = new URL(u);
		return p.protocol === 'https:' || p.protocol === 'http:' ? p.href : null;
	} catch {
		return null;
	}
}

/** GET /square/oauth/callback?code=&state= (or &error=): relay to main, send the browser on. */
export async function squareCallback(url: URL, deps: CallbackDeps): Promise<Response> {
	const now = deps.now ?? Date.now;
	const log = deps.log ?? ((m: string) => console.warn(m));
	const q = url.searchParams;
	const state = q.get('state') ?? '';
	const code = q.get('code') ?? '';
	const error = q.get('error') ?? '';
	if (!STATE.test(state) || (code && !CODE.test(code)) || (error && !ERROR.test(error)) || (!code && !error)) {
		log('square oauth: refused a malformed callback (not relayed)');
		return page(400, "This link isn't valid", AGAIN);
	}
	if (!stateLooksValid(state, now())) {
		log('square oauth: refused an expired state (not relayed)');
		return resultPage('expired');
	}
	let a: ForwardAnswer;
	try {
		a = await deps.forward(error ? { state, error } : { code, state });
	} catch (e) {
		log(`square oauth: main unreachable (${(e as Error).name})`);
		return page(502, "Square couldn't be connected", `quicc didn't answer. ${AGAIN}`);
	}
	if (a.status === 401) log('square oauth: main refused the platform key');
	else if (a.status >= 500) log(`square oauth: main answered ${a.status} ${a.body?.code ?? ''}`.trim());
	const to = absolute(a.body?.redirect);
	if (to) return new Response(null, { status: 303, headers: { ...SAFE, location: to } });
	if (a.status === 401 || !a.body?.result) return page(502, "Square couldn't be connected", `quicc didn't accept this server. ${AGAIN}`);
	return resultPage(a.body.result);
}

/** The relay to main: platform key only (no X-Site-Host: the state names the store). */
export function mainForwarder(mainUrl: string, platformKey: string, timeoutMs = 20_000): Forward {
	return async (body) => {
		const res = await fetch(mainUrl.replace(/\/+$/, '') + '/square/oauth/forward', {
			method: 'POST',
			headers: { authorization: `Bearer ${platformKey}`, 'content-type': 'application/json', accept: 'application/json' },
			body: JSON.stringify(body),
			signal: AbortSignal.timeout(timeoutMs)
		});
		let parsed: ForwardAnswer['body'] = null;
		try {
			parsed = (await res.json()) as ForwardAnswer['body'];
		} catch {
			parsed = null;
		}
		return { status: res.status, body: parsed };
	};
}
