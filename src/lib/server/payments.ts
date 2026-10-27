// Payments behind a Stripe-shaped seam. The mock behaves like Stripe test mode
// (4242… approves, 4000 0000 0000 0002 declines, 4000 0000 0000 9995 insufficient funds).
// Real Stripe later: create a PaymentIntent on the store's connected account (Stripe Connect Standard),
// confirm with the Payment Element in the browser, and place the order from the webhook
// (payment_intent.succeeded), keyed by the client's idempotency key. See docs/MAIN-API.md.
import type { Store } from '$lib/types';

export type AuthResult = { ok: true; last4: string; ref: string } | { ok: false; code: string; message: string };

function luhn(num: string) {
	let sum = 0;
	let alt = false;
	for (let i = num.length - 1; i >= 0; i--) {
		let n = +num[i];
		if (alt) {
			n *= 2;
			if (n > 9) n -= 9;
		}
		sum += n;
		alt = !alt;
	}
	return sum % 10 === 0;
}

export async function authorize(_store: Store, amountCents: number, card?: { number: string; exp: string; cvc: string }): Promise<AuthResult> {
	const number = String(card?.number ?? '').replace(/\D/g, '');
	const exp = String(card?.exp ?? '').replace(/\s/g, '');
	const cvc = String(card?.cvc ?? '').replace(/\D/g, '');
	if (number.length < 13 || !luhn(number)) return { ok: false, code: 'card_number', message: 'That card number looks off. Check the digits.' };
	const m = /^(\d{2})\/?(\d{2})$/.exec(exp);
	if (!m || +m[1] < 1 || +m[1] > 12) return { ok: false, code: 'card_exp', message: 'Add the expiry as MM/YY.' };
	const expEnd = new Date(2000 + +m[2], +m[1], 1);
	if (expEnd < new Date()) return { ok: false, code: 'card_exp', message: 'That card has expired.' };
	if (cvc.length < 3) return { ok: false, code: 'card_cvc', message: 'Add the 3-digit code on the back.' };
	if (amountCents <= 0) return { ok: false, code: 'amount', message: 'Nothing to charge.' };
	if (number === '4000000000000002') return { ok: false, code: 'declined', message: 'Your bank declined the payment. Nothing was charged. Try another card or pay with cash.' };
	if (number === '4000000000009995') return { ok: false, code: 'declined', message: 'The card has insufficient funds. Nothing was charged.' };
	return { ok: true, last4: number.slice(-4), ref: `pi_mock_${Date.now().toString(36)}` };
}
