<script lang="ts">
	import { goto } from '$app/navigation';
	import { onDestroy, untrack } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Miso from '$lib/components/Miso.svelte';
	import emptyArt from '$lib/miso/art/miso-empty-cart.svg?raw';
	import declinedArt from '$lib/miso/art/miso-declined.svg?raw';
	import outsideArt from '$lib/miso/art/miso-outside.svg?raw';
	import pausedArt from '$lib/miso/art/miso-paused.svg?raw';
	import closedArt from '$lib/miso/art/miso-closed.svg?raw';
	import lostArt from '$lib/miso/art/miso-lost.svg?raw';
	import loadingArt from '$lib/miso/art/miso-loading.svg?raw';
	import { cart } from '$lib/cart.svelte';
	import { account } from '$lib/account.svelte';
	import { t } from '$lib/i18n';
	import { money, clock, dayLabel, localDate, fmtPhone } from '$lib/fmt';
	import { pct } from '$lib/engine';
	import { cardMode, mountSquare, tokenize, verifyBuyer, TEST_TOKENS, type SquareForm } from '$lib/square';
	import type { DeliveryCheck, PlacedOrder, Quote } from '$lib/types';

	let { data } = $props();
	const S = $derived(data.store);
	const L = $derived(data.lang);
	const b = $derived(data.base);
	const T = (k: Parameters<typeof t>[1], v?: Record<string, string | number>) => t(L, k, v);
	const st = $derived(data.status);
	const types = $derived(st?.order_types ?? { pickup: { enabled: S.pricing.types.pickup, eta_minutes: 0 }, delivery: { enabled: S.pricing.types.delivery, eta_minutes: 0 } });
	const methods = $derived(S.payments.methods);
	const mode = $derived(cardMode(S.payments.card));
	const tips = $derived(S.pricing.settings.tips);
	const deliv = $derived(cart.fulfil === 'delivery');
	const me = $derived(account.me);

	// --- details
	let name = $state('');
	let phone = $state('');
	let email = $state('');
	let notes = $state('');
	let filled = false;
	$effect(() => {
		if (me && !filled) {
			filled = true;
			name ||= me.name;
			phone ||= fmtPhone(me.phone);
			email ||= me.email;
			const def = me.addresses.find((a) => a.default) ?? me.addresses[0];
			if (def && !addrId) addrId = def.id;
			if (me.cards.length && !cardId) cardId = me.cards[0].id;
		}
	});

	// --- address
	let addrId = $state(''); // a saved address, or '' = typed
	let line1 = $state('');
	let line2 = $state('');
	let city = $state('');
	let zip = $state('');
	let driverNotes = $state('');
	const saved = $derived(me?.addresses.find((a) => a.id === addrId) ?? null);
	const address = $derived(saved ? { line1: saved.line1, line2: saved.line2, city: saved.city, state: saved.state, zip: saved.zip, notes: driverNotes || saved.notes } : { line1: line1.trim(), line2: line2.trim(), city: city.trim(), state: '', zip: zip.trim(), notes: driverNotes.trim() });
	let check = $state<DeliveryCheck | null>(null);
	let checking = $state(false);
	$effect(() => {
		const a = address;
		if (!deliv || !a.line1 || (!a.zip && !a.city)) {
			check = null;
			return;
		}
		const ctl = new AbortController();
		const id = setTimeout(async () => {
			checking = true;
			try {
				const r = await fetch('/api/delivery-check', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ line1: a.line1, city: a.city, state: a.state, zip: a.zip }), signal: ctl.signal });
				check = r.ok ? await r.json() : null;
			} catch {
				/* aborted */
			}
			checking = false;
		}, 600);
		return () => {
			clearTimeout(id);
			ctl.abort();
		};
	});
	function useCandidate(c: DeliveryCheck['candidates'][number]) {
		addrId = '';
		line1 = c.line1;
		city = c.city;
		zip = c.postal_code;
	}

	// --- when
	let asap = $state(untrack(() => data.status?.accepting ?? true));
	const days = $derived.by(() => {
		const n = st?.scheduling.days_ahead ?? 0;
		const out: { date: string; label: string }[] = [];
		const now = new Date();
		for (let i = 0; i <= n; i++) {
			const at = new Date(now.getTime() + i * 86_400_000);
			const date = localDate(at, S.timezone);
			out.push({ date, label: i === 0 ? T('today') : i === 1 ? T('tomorrow') : dayLabel(at.toISOString(), S.timezone, L) });
		}
		return out;
	});
	let day = $state('');
	let slot = $state('');
	let times = $state<string[] | null>(null);
	$effect(() => {
		if (asap || !days.length) return;
		const d = day || days[0].date;
		const type = cart.fulfil;
		const ctl = new AbortController();
		times = null;
		fetch(`/api/times?type=${type}&date=${d}`, { signal: ctl.signal })
			.then((r) => (r.ok ? r.json() : { times: [] }))
			.then((x) => {
				times = x.times ?? [];
				if (!times!.includes(slot)) slot = times![0] ?? '';
			})
			.catch(() => {});
		return () => ctl.abort();
	});

	// --- tip (card orders)
	let tipChoice = $state<number | 'custom' | 'none'>(untrack(() => data.store.pricing.settings.tips.default_pct || 'none'));
	let tipCustom = $state('');
	// --- payment
	let pay = $state<'card' | 'cash'>(untrack(() => (data.store.payments.methods.includes('card') ? 'card' : 'cash')));
	let cardId = $state(''); // a saved card, or '' = a new card
	let saveCard = $state(false);
	let testToken = $state(untrack(() => (cardMode(data.store.payments.card) === 'square' ? '' : TEST_TOKENS[cardMode(data.store.payments.card) as 'test-card'][0].token)));
	const tipBody = $derived(
		pay !== 'card' || !tips.enabled ? { tip_cents: 0 } : tipChoice === 'none' ? { tip_cents: 0 } : tipChoice === 'custom' ? { tip_cents: Math.max(0, Math.round(Number(tipCustom.replace(/[^\d.]/g, '') || 0) * 100)) } : { tip_pct: tipChoice }
	);

	// --- quote
	let code = $state(untrack(() => cart.code));
	let quote = $state<Quote | null>(null);
	let quoting = $state(false);
	$effect(() => {
		const lines = $state.snapshot(cart.entries).map((e) => e.line);
		const body = { type: cart.fulfil, payment: pay, lines, code: code.trim(), ...tipBody };
		if (!cart.ready || !lines.length) return;
		const ctl = new AbortController();
		quoting = true;
		const id = setTimeout(async () => {
			try {
				const r = await fetch('/api/quote', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: ctl.signal });
				if (r.ok) quote = await r.json();
			} catch {
				/* aborted */
			}
			quoting = false;
		}, 200);
		return () => {
			clearTimeout(id);
			ctl.abort();
		};
	});
	const tipBase = $derived(quote ? quote.subtotal_cents - quote.discounts.reduce((s, d) => s + d.amount_cents, 0) : cart.subtotal);

	// --- Square's card form
	let cardEl = $state<HTMLElement | null>(null);
	let googleEl = $state<HTMLElement | null>(null);
	let form = $state<SquareForm | null>(null);
	let formErr = $state('');
	const needForm = $derived(pay === 'card' && !cardId && mode === 'square');
	$effect(() => {
		if (!needForm || !cardEl || form) return;
		const total = untrack(() => quote?.total_cents ?? cart.subtotal);
		mountSquare(S.payments.card!, cardEl, googleEl, total)
			.then((f) => (form = f))
			.catch((e) => (formErr = e.message));
	});
	onDestroy(() => form?.destroy());

	// --- placing
	let busy = $state(false);
	let failure = $state<{ code: string; message: string } | null>(null);
	const phoneOk = $derived(phone.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '').length === 10);
	const missing = $derived(
		!name.trim() ? T('name') : !phoneOk ? T('phoneShort') : deliv && !address.line1 ? T('address') : deliv && !address.zip && !address.city ? T('zip') : !asap && !slot ? T('chooseTime') : ''
	);

	async function cardPayment(): Promise<{ method: 'card'; token?: string; card_id?: string; save_card?: boolean } | null> {
		if (cardId) return { method: 'card', card_id: cardId };
		let token = testToken;
		if (mode === 'square') {
			if (!form) {
				failure = { code: 'card', message: formErr || T('cardLoading') };
				return null;
			}
			const r = await tokenize(form.card);
			if ('error' in r) {
				failure = { code: 'card', message: r.error };
				return null;
			}
			token = r.token;
		}
		return { method: 'card', token, ...(me && saveCard ? { save_card: true } : {}) };
	}

	async function googlePay() {
		if (!form?.google || busy) return;
		const r = await tokenize(form.google);
		if ('error' in r) {
			failure = { code: 'card', message: r.error };
			return;
		}
		await place(undefined, { method: 'card', token: r.token });
	}

	async function place(e?: SubmitEvent, payment?: Record<string, unknown>) {
		e?.preventDefault();
		if (busy) return;
		failure = null;
		if (missing) {
			failure = { code: 'missing', message: T('fillIn', { f: missing }) };
			return;
		}
		busy = true;
		try {
			const p = payment ?? (pay === 'cash' ? { method: 'cash' } : await cardPayment());
			if (!p) return;
			const body = {
				client_order_id: cart.clientOrderId,
				type: cart.fulfil,
				lines: $state.snapshot(cart.entries).map((x) => x.line),
				code: code.trim(),
				...tipBody,
				payment: p,
				customer: { name: name.trim(), phone, email: email.trim() },
				address: deliv ? address : null,
				promised_at: asap ? null : slot,
				notes: notes.trim(),
				expected_total_cents: quote?.total_cents ?? null
			};
			let r = await fetch('/api/orders', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
			let res = await r.json();
			if (r.status === 402 && res.code === 'verification_required' && form && typeof p.token === 'string') {
				const v = await verifyBuyer(form, p.token, quote?.total_cents ?? 0, name, !!p.save_card).catch(() => null);
				if (!v) {
					failure = { code: 'payment_declined', message: T('verifyFailed') };
					return;
				}
				r = await fetch('/api/orders', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...body, payment: { ...p, verification_token: v } }) });
				res = await r.json();
			}
			if (r.ok) {
				const o = res as PlacedOrder;
				cart.clear();
				await goto(`${b}/order/${o.track_token}`, { replaceState: true, state: { placed: true } });
				return;
			}
			failure = { code: res.code ?? 'error', message: res.issues?.map((i: { message: string }) => i.message).join(' ') || res.error || T('tryAgain') };
			if (res.code === 'store_closed' || res.code === 'store_paused') asap = false;
			document.getElementById('failure')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
		} catch {
			failure = { code: 'network', message: T('offline') };
		} finally {
			busy = false;
		}
	}
	const failTitle = $derived(
		!failure ? '' : failure.code === 'payment_declined' ? T('payFail') : failure.code === 'outside_area' ? T('zoneTitle') : failure.code === 'store_closed' ? T('closedTitle') : failure.code === 'store_paused' ? T('pausedTitle') : failure.code === 'price_changed' ? T('priceChanged') : T('checkThis')
	);
	// errors always show Miso
	const failArt = $derived(failure?.code === 'payment_declined' ? declinedArt : failure?.code === 'outside_area' ? outsideArt : failure?.code === 'store_paused' ? pausedArt : failure?.code === 'store_closed' ? closedArt : lostArt);
</script>

<svelte:head>
	<title>{T('checkout')} · {S.name}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="backbar pad">
	<a class="btn btn-icon btn-ghost" href="{b}/cart" aria-label={T('back')}><Icon name="left" size={22} /></a>
	<h1>{T('checkout')}</h1>
</div>

{#if cart.ready && !cart.entries.length}
	<div class="state">{#if S.look.miso.pages}<Miso art={emptyArt} size={160} decorative />{/if}<h2>{T('emptyCart')}</h2><p>{T('emptyCartSub')}</p><a class="btn btn-p btn-lg" href="{b}/menu">{T('browse')}</a></div>
{:else}
	<form class="pad co-grid" onsubmit={place} novalidate>
		<div class="col">
			{#if failure}
				<div id="failure" class="card fail" role="alert">
					<Miso art={failArt} size={96} decorative />
					<div><b>{failTitle}</b><p>{failure.message}</p>
						{#if failure.code === 'outside_area' && types.pickup.enabled}<button type="button" class="btn btn-sm" onclick={() => { cart.setFulfil('pickup'); failure = null; }}>{T('switchPickup')}</button>{/if}
						{#if failure.code === 'payment_declined' && methods.includes('cash')}<button type="button" class="btn btn-sm" onclick={() => { pay = 'cash'; failure = null; }}>{deliv ? T('cashDriver') : T('cashPickup')}</button>{/if}
					</div>
				</div>
			{/if}

			{#if !me}
				<div class="banner info signin"><Icon name="user" size={18} /><span class="grow">{T('haveAccount')}</span><a class="btn btn-sm" href="{b}/account?next=checkout">{T('signIn')}</a></div>
			{/if}

			<section class="card co-sec">
				<h2><span class="stepno">1</span>{deliv ? T('delivery') : T('pickup')}</h2>
				{#if types.delivery.enabled && types.pickup.enabled}
					<div class="seg full" role="radiogroup">
						<button type="button" role="radio" aria-checked={deliv} class:on={deliv} onclick={() => cart.setFulfil('delivery')}><Icon name="scooter" size={16} />{T('delivery')}</button>
						<button type="button" role="radio" aria-checked={!deliv} class:on={!deliv} onclick={() => cart.setFulfil('pickup')}><Icon name="bag" size={16} />{T('pickup')}</button>
					</div>
				{/if}
				{#if deliv}
					{#if me?.addresses.length}
						<div class="choices" role="radiogroup" aria-label={T('savedAddresses')}>
							{#each me.addresses as a (a.id)}
								<button type="button" role="radio" aria-checked={addrId === a.id} class="payopt" class:on={addrId === a.id} onclick={() => (addrId = a.id)}><span class="radio" class:on={addrId === a.id}></span><span class="nm">{a.label || a.line1}<small>{[a.line1, a.line2, a.city, a.zip].filter(Boolean).join(', ')}</small></span></button>
							{/each}
							<button type="button" role="radio" aria-checked={!addrId} class="payopt" class:on={!addrId} onclick={() => (addrId = '')}><span class="radio" class:on={!addrId}></span><span class="nm">{T('newAddress')}</span></button>
						</div>
					{/if}
					{#if !saved}
						<label class="field"><span>{T('address')}</span><input name="address" autocomplete="address-line1" required bind:value={line1} /></label>
						<div class="fields2">
							<label class="field"><span>{T('apt')}</span><input name="apt" autocomplete="address-line2" bind:value={line2} /></label>
							<label class="field"><span>{T('zip')}</span><input name="zip" autocomplete="postal-code" inputmode="numeric" maxlength="10" required bind:value={zip} /></label>
						</div>
						<label class="field"><span>{T('city')}</span><input name="city" autocomplete="address-level2" bind:value={city} /></label>
					{/if}
					<label class="field"><span>{T('driverNotes')}</span><input name="notes" bind:value={driverNotes} placeholder={saved?.notes || T('driverNotesPh')} /></label>
					{#if checking}<p class="muted small">{T('checkingArea')}</p>
					{:else if check}
						{#if check.deliverable}<div class="banner ok small"><Icon name="check" size={16} /><span class="grow">{T('weDeliver')}</span></div>
						{:else if check.result === 'outside'}<div class="banner warn small"><Icon name="pin" size={16} /><span class="grow">{T('zoneSub')}</span>{#if types.pickup.enabled}<button type="button" class="btn btn-sm" onclick={() => cart.setFulfil('pickup')}>{T('switchPickup')}</button>{/if}</div>
						{:else if check.candidates.length}
							<div class="banner info small"><Icon name="info" size={16} /><span class="grow">{T('didYouMean')}</span></div>
							<div class="choices">{#each check.candidates as c (c.label)}<button type="button" class="payopt" onclick={() => useCandidate(c)}><Icon name="pin" size={16} /><span class="nm">{c.label}</span></button>{/each}</div>
						{:else if check.result === 'not_found'}<div class="banner warn small"><Icon name="info" size={16} /><span class="grow">{T('addressNotFound')}</span></div>{/if}
					{/if}
				{:else if S.address.line1}
					<div class="banner info"><Icon name="store" size={18} /><span class="grow">{T('pickupAt', { a: [S.address.line1, S.address.line2].filter(Boolean).join(', ') })}</span></div>
				{/if}
			</section>

			<section class="card co-sec">
				<h2><span class="stepno">2</span>{T('when')}</h2>
				<div class="seg full" role="radiogroup">
					<button type="button" role="radio" aria-checked={asap} class:on={asap} disabled={!st?.accepting} onclick={() => (asap = true)}>{T('asap')}{#if st?.accepting} · <span class="num">~{deliv ? types.delivery.eta_minutes : types.pickup.eta_minutes} {T('minutes')}</span>{/if}</button>
					{#if (st?.scheduling.days_ahead ?? 0) > 0}<button type="button" role="radio" aria-checked={!asap} class:on={!asap} onclick={() => (asap = false)}>{T('schedule')}</button>{/if}
				</div>
				{#if !asap}
					<div class="daychips" role="radiogroup" aria-label={T('day')}>
						{#each days as d, i (d.date)}<button type="button" role="radio" aria-checked={(day || days[0].date) === d.date} class="chip" class:on={(day || days[0].date) === d.date} onclick={() => (day = d.date)}>{d.label}</button>{/each}
					</div>
					{#if times === null}<p class="muted small loading-times"><Miso art={loadingArt} size={48} decorative />{T('loadingTimes')}</p>
					{:else if !times.length}<p class="muted small">{T('noTimes')}</p>
					{:else}
						<label class="field"><span>{T('chooseTime')}</span><select bind:value={slot}>{#each times as x (x)}<option value={x}>{clock(x, S.timezone)}</option>{/each}</select></label>
					{/if}
				{/if}
				{#if !st?.accepting}<p class="muted small">{st?.state === 'paused' ? T('pausedSchedule') : T('notOpenYet')}</p>{/if}
			</section>

			<section class="card co-sec">
				<h2><span class="stepno">3</span>{T('details')}</h2>
				<div class="fields2">
					<label class="field"><span>{T('name')}</span><input name="name" autocomplete="name" required bind:value={name} /></label>
					<label class="field"><span>{T('phone')}</span><input name="phone" type="tel" autocomplete="tel" inputmode="tel" required bind:value={phone} /></label>
				</div>
				<label class="field"><span>{T('email')}</span><input name="email" type="email" autocomplete="email" bind:value={email} /></label>
				<label class="field"><span>{T('orderNotes')}</span><input name="order-notes" maxlength="300" bind:value={notes} placeholder={T('orderNotesPh')} /></label>
			</section>

			<section class="card co-sec">
				<h2><span class="stepno">4</span>{T('payment')}</h2>
				<div class="paybtns" role="radiogroup">
					{#if methods.includes('card')}
						<button type="button" role="radio" aria-checked={pay === 'card'} class="payopt" class:on={pay === 'card'} onclick={() => (pay = 'card')}><span class="radio" class:on={pay === 'card'}></span><Icon name="card" /><span class="nm">{T('card')}</span></button>
						{#if pay === 'card'}
							<div class="cardbox">
								{#if me?.cards.length}
									<div class="choices" role="radiogroup" aria-label={T('savedCards')}>
										{#each me.cards as c (c.id)}
											<button type="button" role="radio" aria-checked={cardId === c.id} class="payopt" class:on={cardId === c.id} onclick={() => (cardId = c.id)}><span class="radio" class:on={cardId === c.id}></span><span class="nm">{c.brand} •••• {c.last4}<small>{T('expires', { d: `${String(c.exp_month).padStart(2, '0')}/${String(c.exp_year).slice(-2)}` })}</small></span></button>
										{/each}
										<button type="button" role="radio" aria-checked={!cardId} class="payopt" class:on={!cardId} onclick={() => (cardId = '')}><span class="radio" class:on={!cardId}></span><span class="nm">{T('newCard')}</span></button>
									</div>
								{/if}
								{#if !cardId}
									{#if mode === 'square'}
										<!-- Square draws the Google Pay button here when the device offers it. -->
										<div class="sq-google" bind:this={googleEl} onclick={googlePay} role="presentation"></div>
										<div class="sq-card" bind:this={cardEl}>{#if !form && !formErr}<span class="muted small">{T('cardLoading')}</span>{/if}</div>
										{#if formErr}<p class="err small">{formErr}</p>{/if}
									{:else}
										<label class="field"><span>{mode === 'fake-square' ? T('fakeSquare') : T('testCardLabel')}</span>
											<select bind:value={testToken}>{#each TEST_TOKENS[mode] as x (x.token)}<option value={x.token}>{x.label}</option>{/each}</select>
										</label>
									{/if}
									{#if me}<label class="optin"><input type="checkbox" bind:checked={saveCard} /><span>{T('saveCard')}</span></label>{/if}
								{/if}
								<p class="muted small">{T('holdNote')}</p>
							</div>
						{/if}
					{/if}
					{#if methods.includes('cash')}
						<button type="button" role="radio" aria-checked={pay === 'cash'} class="payopt" class:on={pay === 'cash'} onclick={() => (pay = 'cash')}><span class="radio" class:on={pay === 'cash'}></span><Icon name="cash" /><span class="nm">{deliv ? T('cashDriver') : T('cashPickup')}</span></button>
					{/if}
				</div>
			</section>

			{#if pay === 'card' && tips.enabled}
				<section class="card co-sec">
					<h2><span class="stepno">5</span>{deliv ? T('tipDriver') : T('tipTeam')}</h2>
					<div class="tipchips" role="radiogroup">
						{#each tips.presets as p (p)}<button type="button" role="radio" aria-checked={tipChoice === p} class:on={tipChoice === p} onclick={() => (tipChoice = p)}>{p}%<small>{money(pct(tipBase, p * 100))}</small></button>{/each}
						<button type="button" role="radio" aria-checked={tipChoice === 'custom'} class:on={tipChoice === 'custom'} onclick={() => (tipChoice = 'custom')}>{T('custom')}</button>
						<button type="button" role="radio" aria-checked={tipChoice === 'none'} class:on={tipChoice === 'none'} onclick={() => (tipChoice = 'none')}>{T('noTip')}</button>
					</div>
					{#if tipChoice === 'custom'}<label class="field"><span>{T('tip')} ($)</span><input inputmode="decimal" bind:value={tipCustom} placeholder="5.00" /></label>{/if}
					<p class="muted small">{T('tipLater')}</p>
				</section>
			{/if}
		</div>

		<aside class="card summary">
			<h2>{T('yourOrder')}</h2>
			<ul class="lines">
				{#each cart.entries as e, i (i)}
					{@const q = quote?.lines.find((x) => x.index === i)}
					<li class="line"><span class="qty">{e.line.qty ?? 1}</span><div class="txt"><span class="nm">{e.name}</span>{#if e.mods.length}<span class="mods">{e.mods.join(' · ')}</span>{/if}</div><span class="pr num">{money(q?.total_cents ?? e.unitCents * (e.line.qty ?? 1))}</span></li>
				{/each}
			</ul>
			<label class="field promo"><span>{T('promo')}</span><input bind:value={code} onchange={() => cart.setCode(code.trim())} autocapitalize="characters" /></label>
			{#if quote}
				<div class="totals" aria-live="polite" class:stale={quoting}>
					<div><span>{T('subtotal')}</span><span class="num">{money(quote.subtotal_cents)}</span></div>
					{#each quote.discounts as d (d.label)}<div class="disc"><span>{d.label}</span><span class="num">−{money(d.amount_cents)}</span></div>{/each}
					{#if deliv}<div><span>{T('deliveryFee')}</span><span class="num">{money(quote.delivery_fee_cents)}</span></div>{/if}
					{#if quote.service_fee_cents}<div><span>{T('serviceFee')}</span><span class="num">{money(quote.service_fee_cents)}</span></div>{/if}
					<div><span>{T('tax')}</span><span class="num">{money(quote.tax_cents)}</span></div>
					{#if quote.card_fee_cents}<div><span>{T('cardFee', { p: S.pricing.settings.card_fee.bps / 100 })}</span><span class="num">{money(quote.card_fee_cents)}</span></div>{/if}
					{#if quote.tip_cents}<div><span>{T('tip')}</span><span class="num">{money(quote.tip_cents)}</span></div>{/if}
					<div class="grand"><span>{T('total')}</span><span class="num">{money(quote.total_cents)}</span></div>
				</div>
				{#each [...quote.errors.map((x) => x.message), ...quote.warnings, ...quote.nudges] as m (m)}<div class="banner warn small"><Icon name="info" size={16} /><span class="grow">{m}</span></div>{/each}
			{/if}
			<button class="btn btn-p btn-lg btn-block place hide-m" type="submit" disabled={busy || !!quote?.errors.length}>
				<span class="split"><span>{busy ? T('placing') : T('placeOrder')}</span><span class="num">{quote ? money(quote.total_cents) : ''}</span></span>
			</button>
			{#if pay === 'card' && mode === 'square'}<p class="muted small center">{T('payTo', { s: S.name })}</p>{/if}
		</aside>
		<div class="placebar only-m">
			<button class="btn btn-p btn-lg btn-block" type="submit" disabled={busy || !!quote?.errors.length}><span class="split"><span>{busy ? T('placing') : T('placeOrder')}</span><span class="num">{quote ? money(quote.total_cents) : ''}</span></span></button>
		</div>
	</form>
{/if}

<style>
	.col { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
	.co-grid { padding-bottom: 120px; }
	.co-sec h2 { font-size: 22px; display: flex; gap: 10px; align-items: center; }
	.stepno { width: 28px; height: 28px; border-radius: 50%; background: var(--q-elev); display: grid; place-items: center; font: 700 14px var(--q-font-num); }
	.field { display: flex; flex-direction: column; gap: 4px; min-height: 0; padding: 0; border: 0; background: none; }
	.field > span { font-size: 12px; color: var(--q-muted); font-weight: 600; }
	.field input, .field select { min-height: 50px; padding: 8px 14px; border-radius: var(--q-r-md); border: var(--q-border-w) solid var(--q-border-strong); background: var(--q-field-bg); font-size: 16px; }
	.seg button { display: inline-flex; align-items: center; justify-content: center; flex: 1; gap: 6px; min-height: 42px; padding: 0 12px; border-radius: var(--q-btn-radius); font: 600 15px var(--q-font-body); color: var(--q-text2); }
	.seg button.on { background: var(--q-surface); color: var(--q-text); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18); }
	.seg button:disabled { opacity: 0.45; }
	.daychips { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px; }
	.daychips .chip { white-space: nowrap; }
	.daychips .chip.on { background: var(--q-text); border-color: var(--q-text); color: var(--q-canvas); }
	.tipchips { display: grid; grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)); gap: 8px; }
	.tipchips button { min-height: 54px; border-radius: var(--q-r-md); border: var(--q-border-w) solid var(--q-border); display: flex; flex-direction: column; align-items: center; justify-content: center; font: 700 16px var(--q-font-num); }
	.tipchips button small { font: 500 12px var(--q-font-num); color: var(--q-muted); }
	.tipchips button.on { border: 2px solid var(--q-brand); background: var(--q-brand-soft); }
	.choices { display: flex; flex-direction: column; gap: 6px; }
	.payopt { width: 100%; text-align: left; }
	.payopt .nm { display: flex; flex-direction: column; }
	.payopt .nm small { color: var(--q-muted); font-size: 13px; font-weight: 500; }
	.cardbox { display: flex; flex-direction: column; gap: 10px; padding: 4px 2px 8px; }
	.sq-card { min-height: 90px; }
	.sq-google:empty { display: none; }
	.optin { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: var(--q-text2); }
	.optin input { width: 20px; height: 20px; accent-color: var(--q-brand); margin-top: 1px; }
	.signin .btn { flex-shrink: 0; }
	.summary { padding: 20px; display: flex; flex-direction: column; gap: 12px; position: sticky; top: 90px; }
	.summary h2 { font-size: 22px; }
	.lines { list-style: none; padding: 0; margin: 0; }
	.totals.stale { opacity: 0.6; }
	.place { margin-top: 4px; }
	.small { font-size: 13px; }
	.err { color: var(--q-bad); }
	.center { text-align: center; }
	.loading-times { display: flex; align-items: center; gap: 10px; }
	.fail { display: flex; gap: 14px; align-items: center; padding: 14px 16px; border-color: var(--q-bad); }
	.fail p { color: var(--q-text2); font-size: 14px; margin: 2px 0 8px; }
	.placebar.only-m { display: block; }
	@media (min-width: 1200px) { .placebar.only-m { display: none; } }
	@media (max-width: 699px) { :global(.sf.has-tabbar) .placebar { bottom: calc(74px + env(safe-area-inset-bottom, 0px)); } }
</style>
