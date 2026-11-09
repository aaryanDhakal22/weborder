// Card payments in the browser. With Square (sandbox / production) the Web Payments SDK draws the
// card form in Square's own iframe and hands back a one-time token: card data never reaches the
// storefront or main (SAQ-A). Dev and staging without a Square app use stand-ins that produce the
// test tokens main's fakes accept, picked from a list instead of typed.
import type { Payments } from './types';

export type CardSetup = Payments['card'];

/** What the checkout shows: Square's form, the fake Square's test cards, or main's test card. */
export type CardMode = 'square' | 'fake-square' | 'test-card';

export function cardMode(card: CardSetup): CardMode {
	if (!card) return 'test-card';
	return card.env === 'fake' ? 'fake-square' : 'square';
}

/** Test tokens for the stand-ins (names shown on the page in place of a card form). */
export const TEST_TOKENS: Record<Exclude<CardMode, 'square'>, { token: string; label: string }[]> = {
	'fake-square': [
		{ token: 'cnon:card-nonce-ok', label: 'Visa 4111 · approved (tip can be raised)' },
		{ token: 'cnon:card-nonce-no-edit', label: 'Visa 4111 · approved (like most online holds)' },
		{ token: 'cnon:card-nonce-declined', label: 'Declined' },
		{ token: 'cnon:card-nonce-rejected-cvv', label: 'Wrong CVV' },
		{ token: 'cnon:card-nonce-verification', label: 'Bank asks to verify (3-D Secure)' }
	],
	'test-card': [
		{ token: 'tok_visa', label: 'Test Visa · approved' },
		{ token: 'tok_decline', label: 'Test card · declined' }
	]
};

interface SqTokenResult { status: string; token?: string; errors?: { message: string }[] }
interface SqMethod { attach(el: string | HTMLElement): Promise<void>; tokenize(): Promise<SqTokenResult>; destroy(): Promise<boolean> }
interface SqPayments {
	card(opts?: unknown): Promise<SqMethod>;
	paymentRequest(req: unknown): unknown;
	googlePay(req: unknown): Promise<SqMethod>;
	verifyBuyer(token: string, details: unknown): Promise<{ token?: string }>;
}
declare global {
	interface Window {
		Square?: { payments(appId: string, locationId: string): SqPayments };
	}
}

let sdk: Promise<void> | null = null;

function loadSdk(env: 'production' | 'sandbox'): Promise<void> {
	if (window.Square) return Promise.resolve();
	sdk ??= new Promise((resolve, reject) => {
		const s = document.createElement('script');
		s.src = env === 'production' ? 'https://web.squarecdn.com/v1/square.js' : 'https://sandbox.web.squarecdn.com/v1/square.js';
		s.onload = () => resolve();
		s.onerror = () => {
			sdk = null;
			reject(new Error('The card form could not load. Check your connection and try again.'));
		};
		document.head.appendChild(s);
	});
	return sdk;
}

export interface SquareForm {
	payments: SqPayments;
	card: SqMethod;
	google: SqMethod | null;
	destroy(): void;
}

/** Draws Square's card form into `cardEl` (and Google Pay into `googleEl` when the device offers it). */
export async function mountSquare(card: NonNullable<CardSetup>, cardEl: HTMLElement, googleEl: HTMLElement | null, totalCents: number): Promise<SquareForm> {
	if (card.env === 'fake') throw new Error('the fake Square has no card form');
	await loadSdk(card.env);
	const payments = window.Square!.payments(card.app_id, card.location_id);
	const c = await payments.card();
	await c.attach(cardEl);
	let google: SqMethod | null = null;
	if (googleEl) {
		try {
			const req = payments.paymentRequest({ countryCode: 'US', currencyCode: 'USD', total: { amount: (totalCents / 100).toFixed(2), label: 'Total' } });
			google = await payments.googlePay(req);
			await google.attach(googleEl);
		} catch {
			google = null; // not offered on this device / browser
		}
	}
	return {
		payments,
		card: c,
		google,
		destroy() {
			void c.destroy();
			void google?.destroy();
		}
	};
}

/** A one-time token from a Square payment method, or an error message for the customer. */
export async function tokenize(m: SqMethod): Promise<{ token: string } | { error: string }> {
	const r = await m.tokenize();
	if (r.status === 'OK' && r.token) return { token: r.token };
	return { error: r.errors?.map((e) => e.message).join(' ') || 'Check the card details.' };
}

/** 3-D Secure when the bank asks (main answered 402 verification_required). */
export async function verifyBuyer(form: SquareForm, token: string, totalCents: number, name: string, save: boolean): Promise<string | null> {
	const [givenName, ...rest] = name.trim().split(/\s+/);
	const r = await form.payments.verifyBuyer(token, {
		amount: (totalCents / 100).toFixed(2),
		currencyCode: 'USD',
		intent: save ? 'CHARGE_AND_STORE' : 'CHARGE',
		billingContact: { givenName, familyName: rest.join(' '), countryCode: 'US' }
	});
	return r.token ?? null;
}
