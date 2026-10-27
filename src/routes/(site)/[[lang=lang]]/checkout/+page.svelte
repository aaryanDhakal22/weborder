<script lang="ts">
	import { goto } from '$app/navigation';
	import Icon from '$lib/components/Icon.svelte';
	import Mascot from '$lib/components/Mascot.svelte';
	import { cart } from '$lib/cart.svelte';
	import { fetchQuote } from '$lib/api';
	import { t } from '$lib/i18n';
	import { money } from '$lib/fmt';
	import { isOpen } from '$lib/hours';
	import type { Quote } from '$lib/types';

	let { data } = $props();
	const S = $derived(data.store);
	const L = $derived(data.lang);
	const b = $derived(data.base);
	const T = (k: Parameters<typeof t>[1], v?: Record<string, string | number>) => t(L, k, v);

	let name = $state('');
	let phone = $state('');
	let email = $state('');
	let optIn = $state(false);
	let line1 = $state('');
	let line2 = $state('');
	let zip = $state('');
	let notes = $state('');
	let asap = $state(true);
	let at = $state('');
	let tipPct = $state<number | null>(null);
	let tipOther = $state('');
	let pay = $state<'card' | 'cash'>('card');
	let cardNumber = $state('');
	let exp = $state('');
	let cvc = $state('');
	let code = $state('');
	let quote = $state<Quote | null>(null);
	let busy = $state(false);
	let failure = $state<{ code: string; message: string } | null>(null);
	const key = crypto.randomUUID?.() ?? String(Math.random());

	$effect.pre(() => {
		if (tipPct === null) tipPct = S.settings.tips.default;
		if (!code && cart.code) code = cart.code;
	});
	const tipCents = $derived(tipPct === -1 ? Math.round(Number(tipOther || 0) * 100) : undefined);
	const deliv = $derived(cart.fulfil === 'delivery');

	$effect(() => {
		const lines = $state.snapshot(cart.entries).map((e) => e.line);
		const body = { lines, fulfil: cart.fulfil, code: code.trim() || undefined, tipPct: tipPct === -1 ? undefined : (tipPct ?? undefined), tipCents, payment: pay };
		if (!cart.ready || !lines.length) return;
		const ctl = new AbortController();
		const id = setTimeout(() => fetchQuote(body, ctl.signal).then((q) => (quote = q)).catch(() => {}), 200);
		return () => {
			clearTimeout(id);
			ctl.abort();
		};
	});

	// Time slots in the store's timezone while it is open (std Intl only).
	const slots = $derived.by(() => {
		const out: { iso: string; label: string }[] = [];
		const step = S.settings.scheduling.slotMin * 60_000;
		const start = Math.ceil((Date.now() + 30 * 60_000) / step) * step;
		const end = Date.now() + S.settings.scheduling.daysAhead * 86400_000;
		const fmt = new Intl.DateTimeFormat(L === 'es' ? 'es-US' : 'en-US', { timeZone: S.timezone, weekday: 'short', hour: 'numeric', minute: '2-digit' });
		for (let ts = start; ts < end && out.length < 120; ts += step) if (isOpen(S.hours, S.timezone, new Date(ts))) out.push({ iso: new Date(ts).toISOString(), label: fmt.format(ts) });
		return out;
	});
	$effect.pre(() => {
		if (!data.live.open && asap && slots.length) {
			asap = false;
			at = slots[0].iso;
		}
	});

	async function place(e: SubmitEvent) {
		e.preventDefault();
		if (busy) return;
		busy = true;
		failure = null;
		try {
			const r = await fetch('/api/checkout', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					key,
					lines: $state.snapshot(cart.entries).map((x) => x.line),
					fulfil: cart.fulfil,
					when: asap ? { asap: true } : { asap: false, at },
					customer: { name, phone, email, optIn },
					address: deliv ? { line1, line2, zip, notes } : undefined,
					tipPct: tipPct === -1 ? undefined : tipPct,
					tipCents,
					code: code.trim() || undefined,
					payment: pay === 'cash' ? { method: 'cash' } : { method: 'card', card: { number: cardNumber, exp, cvc } }
				})
			});
			const res = await r.json();
			if (res.ok) {
				cart.clear();
				await goto(`${b}/order/${res.publicId}`, { replaceState: true });
				return;
			}
			failure = res;
			if (res.code === 'closed' || res.code === 'paused') asap = false;
			document.getElementById('failure')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
		} catch {
			failure = { code: 'network', message: T('offline') };
		} finally {
			busy = false;
		}
	}
	const pose = $derived(failure?.code === 'declined' ? 'card' : failure?.code === 'outside_zone' ? 'map' : failure?.code === 'paused' ? 'paused' : failure?.code === 'closed' ? 'sleep' : 'idle');
	const fmtCard = (v: string) => v.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
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
	<div class="state"><Mascot pose="bowl" size={160} /><h2>{T('emptyCart')}</h2><p>{T('emptyCartSub')}</p><a class="btn btn-p btn-lg" href="{b}/menu">{T('browse')}</a></div>
{:else}
	<form class="pad co-grid" onsubmit={place} novalidate>
		<div class="col">
			{#if failure}
				<div id="failure" class="card fail" role="alert">
					<Mascot {pose} size={96} />
					<div><b>{failure.code === 'declined' ? T('payFail') : failure.code === 'outside_zone' ? T('zoneTitle') : failure.code === 'closed' ? T('closedTitle') : failure.code === 'paused' ? T('pausedTitle') : (L === 'es' ? 'Revisa esto' : 'Check this')}</b><p>{failure.message}</p>
						{#if failure.code === 'outside_zone' && S.settings.pickup}<button type="button" class="btn btn-sm" onclick={() => { cart.setFulfil('pickup'); failure = null; }}>{T('switchPickup')}</button>{/if}
						{#if failure.code === 'declined' && S.settings.cash}<button type="button" class="btn btn-sm" onclick={() => { pay = 'cash'; failure = null; }}>{deliv ? T('cashDriver') : T('cashPickup')}</button>{/if}
					</div>
				</div>
			{/if}

			<section class="card co-sec">
				<h2><span class="stepno">1</span>{deliv ? T('delivery') : T('pickup')}</h2>
				{#if S.settings.delivery && S.settings.pickup}
					<div class="seg full" role="radiogroup">
						<button type="button" role="radio" aria-checked={deliv} class:on={deliv} onclick={() => cart.setFulfil('delivery')}><Icon name="scooter" size={16} />{T('delivery')}</button>
						<button type="button" role="radio" aria-checked={!deliv} class:on={!deliv} onclick={() => cart.setFulfil('pickup')}><Icon name="bag" size={16} />{T('pickup')}</button>
					</div>
				{/if}
				{#if deliv}
					<label class="field"><span>{T('address')}</span><input name="address" autocomplete="address-line1" required bind:value={line1} /></label>
					<div class="fields2">
						<label class="field"><span>{T('apt')}</span><input name="apt" autocomplete="address-line2" bind:value={line2} /></label>
						<label class="field"><span>{T('zip')}</span><input name="zip" autocomplete="postal-code" inputmode="numeric" maxlength="5" required bind:value={zip} /></label>
					</div>
					<label class="field"><span>{T('driverNotes')}</span><input name="notes" bind:value={notes} placeholder={L === 'es' ? 'Puerta lateral' : 'Side door, ring twice'} /></label>
				{:else}
					<div class="banner info"><Icon name="store" size={18} /><span class="grow">{S.address.line1}, {S.address.city}</span></div>
				{/if}
			</section>

			<section class="card co-sec">
				<h2><span class="stepno">2</span>{T('when')}</h2>
				<div class="seg full" role="radiogroup">
					<button type="button" role="radio" aria-checked={asap} class:on={asap} disabled={!data.live.open || !!data.live.pausedUntil} onclick={() => (asap = true)}>{T('asap')} · <span class="num">~{deliv ? data.live.eta.delivery : data.live.eta.pickup} {T('minutes')}</span></button>
					{#if S.settings.scheduling.enabled}<button type="button" role="radio" aria-checked={!asap} class:on={!asap} onclick={() => { asap = false; at ||= slots[0]?.iso ?? ''; }}>{T('schedule')}</button>{/if}
				</div>
				{#if !asap}
					<label class="field"><span>{T('chooseTime')}</span><select bind:value={at}>{#each slots as s (s.iso)}<option value={s.iso}>{s.label}</option>{/each}</select></label>
				{/if}
				{#if !data.live.open}<p class="muted small">{T('notOpenYet')}</p>{/if}
			</section>

			<section class="card co-sec">
				<h2><span class="stepno">3</span>{T('details')}</h2>
				<div class="fields2">
					<label class="field"><span>{T('name')}</span><input name="name" autocomplete="name" required bind:value={name} /></label>
					<label class="field"><span>{T('phone')}</span><input name="phone" type="tel" autocomplete="tel" inputmode="tel" required bind:value={phone} /></label>
				</div>
				<label class="field"><span>{T('email')}</span><input name="email" type="email" autocomplete="email" bind:value={email} /></label>
			</section>

			{#if S.settings.tips.enabled}
				<section class="card co-sec">
					<h2><span class="stepno">4</span>{deliv ? T('tipDriver') : T('tipTeam')}</h2>
					<div class="tipchips" role="radiogroup">
						{#each S.settings.tips.presets as p (p)}<button type="button" role="radio" aria-checked={tipPct === p} class:on={tipPct === p} onclick={() => (tipPct = p)}>{p}%<small>{quote ? money(Math.round(((quote.subtotalCents - quote.discounts.reduce((s, d) => s + d.amountCents, 0)) * p) / 100)) : ''}</small></button>{/each}
						<button type="button" role="radio" aria-checked={tipPct === -1} class:on={tipPct === -1} onclick={() => (tipPct = -1)}>{T('other')}</button>
					</div>
					{#if tipPct === -1}<label class="field"><span>{T('tip')} ($)</span><input inputmode="decimal" bind:value={tipOther} /></label>{/if}
				</section>
			{/if}

			<section class="card co-sec">
				<h2><span class="stepno">{S.settings.tips.enabled ? 5 : 4}</span>{T('payment')}</h2>
				<div class="paybtns" role="radiogroup">
					<button type="button" role="radio" aria-checked={pay === 'card'} class="payopt" class:on={pay === 'card'} onclick={() => (pay = 'card')}><span class="radio" class:on={pay === 'card'}></span><Icon name="card" /><span class="nm">{T('card')}</span></button>
					{#if pay === 'card'}
						<div class="cardbox">
							<label class="field"><span>{T('cardNumber')}</span><input inputmode="numeric" autocomplete="cc-number" value={cardNumber} oninput={(e) => (cardNumber = fmtCard(e.currentTarget.value))} placeholder="4242 4242 4242 4242" /></label>
							<div class="fields2">
								<label class="field"><span>{T('exp')}</span><input inputmode="numeric" autocomplete="cc-exp" maxlength="5" bind:value={exp} placeholder="12/29" /></label>
								<label class="field"><span>{T('cvc')}</span><input inputmode="numeric" autocomplete="cc-csc" maxlength="4" bind:value={cvc} placeholder="123" /></label>
							</div>
							<p class="muted small">{T('testCard')}</p>
						</div>
					{/if}
					{#if S.settings.cash}
						<button type="button" role="radio" aria-checked={pay === 'cash'} class="payopt" class:on={pay === 'cash'} onclick={() => (pay = 'cash')}><span class="radio" class:on={pay === 'cash'}></span><Icon name="cash" /><span class="nm">{deliv ? T('cashDriver') : T('cashPickup')}</span></button>
					{/if}
				</div>
				<label class="optin"><input type="checkbox" bind:checked={optIn} /><span>{T('optIn', { s: S.name })}</span></label>
			</section>
		</div>

		<aside class="card summary">
			<h2>{T('yourOrder')}</h2>
			<ul class="lines">
				{#each cart.entries as e, i (i)}
					<li class="line"><span class="qty">{e.line.qty}</span><div class="txt"><span class="nm">{e.name}</span>{#if e.mods.length}<span class="mods">{e.mods.join(' · ')}</span>{/if}</div><span class="pr num">{money((quote?.lines[i]?.unitCents ?? e.unitCents) * e.line.qty)}</span></li>
				{/each}
			</ul>
			<label class="field promo"><span>{T('promo')}</span><input bind:value={code} onchange={() => { cart.code = code.trim(); cart.save(); }} autocapitalize="characters" /></label>
			{#if quote}
				<div class="totals" aria-live="polite">
					<div><span>{T('subtotal')}</span><span class="num">{money(quote.subtotalCents)}</span></div>
					{#each quote.discounts as d (d.label)}<div class="disc"><span>{d.label}</span><span class="num">−{money(d.amountCents)}</span></div>{/each}
					{#if quote.deliveryFeeCents || deliv}<div><span>{T('deliveryFee')}</span><span class="num">{money(quote.deliveryFeeCents)}</span></div>{/if}
					{#if quote.serviceFeeCents}<div><span>{T('serviceFee')}</span><span class="num">{money(quote.serviceFeeCents)}</span></div>{/if}
					<div><span>{T('tax')} ({S.settings.taxBps / 100}%)</span><span class="num">{money(quote.taxCents)}</span></div>
					{#if quote.cardFeeCents}<div><span>{T('cardFee', { p: S.settings.cardFee.bps / 100 })}</span><span class="num">{money(quote.cardFeeCents)}</span></div><div class="note"><span>{L === 'es' ? 'Paga en efectivo y no pagas el cargo.' : 'Pay cash to skip the card fee.'}</span></div>{/if}
					{#if S.settings.tips.enabled}<div><span>{T('tip')}</span><span class="num">{money(quote.tipCents)}</span></div>{/if}
					<div class="grand"><span>{T('total')}</span><span class="num">{money(quote.totalCents)}</span></div>
				</div>
				{#each [...quote.errors, ...quote.warnings] as m (m)}<div class="banner warn small"><Icon name="info" size={16} /><span class="grow">{m}</span></div>{/each}
			{/if}
			<button class="btn btn-p btn-lg btn-block place hide-m" type="submit" disabled={busy || !!quote?.errors.length}>
				<span class="split"><span>{busy ? T('placing') : T('placeOrder')}</span><span class="num">{quote ? money(quote.totalCents) : ''}</span></span>
			</button>
			<p class="muted small center">{T('paidVia', { s: S.name })}</p>
		</aside>
		<div class="placebar only-m">
			<button class="btn btn-p btn-lg btn-block" type="submit" disabled={busy || !!quote?.errors.length}><span class="split"><span>{busy ? T('placing') : T('placeOrder')}</span><span class="num">{quote ? money(quote.totalCents) : ''}</span></span></button>
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
	.tipchips button { min-height: 54px; border-radius: var(--q-r-md); border: var(--q-border-w) solid var(--q-border); display: flex; flex-direction: column; align-items: center; justify-content: center; font: 700 16px var(--q-font-num); }
	.tipchips button small { font: 500 12px var(--q-font-num); color: var(--q-muted); }
	.tipchips button.on { border: 2px solid var(--q-brand); background: var(--q-brand-soft); }
	.payopt { width: 100%; text-align: left; }
	.cardbox { display: flex; flex-direction: column; gap: 10px; padding: 4px 2px 8px; }
	.optin { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: var(--q-text2); }
	.optin input { width: 20px; height: 20px; accent-color: var(--q-brand); margin-top: 1px; }
	.summary { padding: 20px; display: flex; flex-direction: column; gap: 12px; position: sticky; top: 90px; }
	.summary h2 { font-size: 22px; }
	.lines { list-style: none; padding: 0; margin: 0; }
	.place { margin-top: 4px; }
	.small { font-size: 13px; }
	.center { text-align: center; }
	.fail { display: flex; gap: 14px; align-items: center; padding: 14px 16px; border-color: var(--q-bad); }
	.fail p { color: var(--q-text2); font-size: 14px; margin: 2px 0 8px; }
	.placebar.only-m { display: block; }
	@media (min-width: 1200px) { .placebar.only-m { display: none; } }
	@media (max-width: 699px) { :global(.sf.has-tabbar) .placebar { bottom: calc(74px + env(safe-area-inset-bottom, 0px)); } }
</style>
