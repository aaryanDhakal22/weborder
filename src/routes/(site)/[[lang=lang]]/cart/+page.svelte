<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import CouponCard from '$lib/components/CouponCard.svelte';
	import Miso from '$lib/components/Miso.svelte';
	import emptyArt from '$lib/miso/art/miso-empty-cart.svg?raw';
	import { cart } from '$lib/cart.svelte';
	import { t } from '$lib/i18n';
	import { money } from '$lib/fmt';
	import { contextOf, priceLine, suggestions } from '$lib/menu';
	import type { Quote } from '$lib/types';

	let { data } = $props();
	const S = $derived(data.store);
	const L = $derived(data.lang);
	const b = $derived(data.base);
	const T = (k: Parameters<typeof t>[1], v?: Record<string, string | number>) => t(L, k, v);
	const ctx = $derived(contextOf(S));
	const types = $derived(data.status?.order_types);
	let quote = $state<Quote | null>(null);
	let quoteErr = $state('');
	let couponGone = $state(false);

	$effect(() => {
		const lines = $state.snapshot(cart.entries).map((e) => e.line);
		const coupons = $state.snapshot(cart.coupons);
		const type = cart.fulfil;
		if (!cart.ready || !lines.length) {
			quote = null;
			return;
		}
		const ctl = new AbortController();
		const id = setTimeout(async () => {
			try {
				const r = await fetch('/api/quote', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type, lines, coupons, code: cart.code || '', tip_cents: 0 }), signal: ctl.signal });
				const d = await r.json();
				if (r.ok) {
					// a coupon main didn't apply no longer fits (an item changed, the coupon ended): it comes off
					if (coupons.length && cart.keepCoupons((d.coupons ?? []).map((c: { index: number }) => c.index))) {
						couponGone = true;
						return; // the cart changed: a new quote is on its way
					}
					quote = d;
					quoteErr = '';
				} else quoteErr = d.error ?? '';
			} catch {
				/* aborted or offline: keep the last quote */
			}
		}, 150);
		return () => {
			clearTimeout(id);
			ctl.abort();
		};
	});
	const sugg = $derived(suggestions(S, new Set(cart.entries.map((e) => e.line.item_id)), data.status?.sold_out ?? []));
	const afterDeals = $derived(quote ? quote.subtotal_cents - quote.discounts.reduce((s, d) => s + d.amount_cents, 0) : cart.subtotal);
	const lineErr = (i: number) => quote?.errors.filter((e) => e.line === i).map((e) => e.message).join(' ') ?? '';
	const cartErrs = $derived(quote?.errors.filter((e) => e.line === null && !e.code.startsWith('coupon_')).map((e) => e.message) ?? []);
	// the lines in an applied coupon (their totals are the coupon's prices: a coupon is not a discount)
	const inCoupon = $derived(new Set((quote?.coupons ?? []).flatMap((c) => c.lines)));
	const offers = $derived((quote?.coupon_offers ?? []).slice(0, 4));

	function addSugg(id: string) {
		const item = S.menu.categories.flatMap((c) => c.items).find((i) => i.id === id);
		if (!item) return;
		const line = { item_id: item.id, ...(item.sizes[0] ? { size_id: item.sizes[0].size_id } : {}), options: [], qty: 1 };
		const p = priceLine(ctx, line, cart.fulfil);
		cart.add({ line, name: p.name || item.name, mods: p.mods, unitCents: p.unit });
	}
</script>

<svelte:head>
	<title>{T('yourOrder')} · {S.name}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="backbar pad">
	<a class="btn btn-icon btn-ghost" href="{b}/menu" aria-label={T('back')}><Icon name="left" size={22} /></a>
	<h1>{T('yourOrder')}</h1>
	<span class="muted num">{T('items', { n: cart.count })}</span>
</div>

{#if cart.ready && !cart.entries.length}
	<div class="state">
		{#if S.look.miso.pages}<Miso art={emptyArt} size={170} decorative />{/if}
		<h2>{T('emptyCart')}</h2>
		<p>{T('emptyCartSub')}</p>
		<div class="actions">{#if S.deals.length}<a class="btn btn-p btn-lg btn-block" href="{b}/deals">{T('seeDeals')}</a>{/if}<a class="btn btn-lg btn-block" class:btn-p={!S.deals.length} href="{b}/menu">{T('browse')}</a></div>
	</div>
{:else}
	<div class="pad wrap">
		{#if types?.delivery.enabled && types?.pickup.enabled}
			<div class="seg full" role="radiogroup" aria-label="{T('delivery')} / {T('pickup')}">
				<button type="button" role="radio" aria-checked={cart.fulfil === 'delivery'} class:on={cart.fulfil === 'delivery'} onclick={() => cart.setFulfil('delivery')}><Icon name="scooter" size={16} />{T('delivery')}</button>
				<button type="button" role="radio" aria-checked={cart.fulfil === 'pickup'} class:on={cart.fulfil === 'pickup'} onclick={() => cart.setFulfil('pickup')}><Icon name="bag" size={16} />{T('pickup')}</button>
			</div>
		{/if}
		<ul class="lines">
			{#each cart.entries as e, i (i)}
				{@const q = quote?.lines.find((x) => x.index === i)}
				{@const qty = e.line.qty ?? 1}
				<li class="line">
					<span class="stepper sm">
						<button type="button" aria-label={qty === 1 ? T('remove') : T('less')} onclick={() => cart.setQty(i, qty - 1)}><Icon name={qty === 1 ? 'trash' : 'minus'} size={16} /></button>
						<b>{qty}</b>
						<button type="button" aria-label={T('more')} onclick={() => cart.setQty(i, qty + 1)}><Icon name="plus" size={16} /></button>
					</span>
					<div class="txt"><span class="nm">{e.name}{#if e.line.deal_id}{' '}<span class="tag tag-save">{T('deal')}</span>{/if}{#if inCoupon.has(i)}{' '}<span class="tag tag-brand">{T('coupon')}</span>{/if}</span>{#if e.mods.length}<span class="mods">{e.mods.join(' · ')}</span>{/if}{#if lineErr(i)}<span class="err">{lineErr(i)}</span>{/if}</div>
					<span class="pr num">{money(q?.total_cents ?? e.unitCents * qty)}{#if q?.regular_cents && q.regular_cents > q.unit_cents}<span class="was">{money(q.regular_cents * qty)}</span>{/if}</span>
				</li>
			{/each}
		</ul>
		{#if quote?.coupons?.length}
			<div class="coupons" aria-label={T('coupon')}>
				{#each quote.coupons as c (c.index)}
					<CouponCard name={c.name} card={c.card} price={c.total_cents} applied label={T('removeCoupon')} onclick={() => cart.removeCoupon(c.index)} />
				{/each}
			</div>
		{/if}
		{#if couponGone}<div class="banner warn"><Icon name="info" size={18} /><span class="grow">{T('couponGone')}</span></div>{/if}
		{#if offers.length}
			<section class="coupons" aria-label={T('couponsFor')}>
				<span class="eyebrow">{T('couponsFor')}</span>
				{#each offers as o (o.id + o.lines.join())}
					<CouponCard name={o.name} card={o.card} price={o.price_cents} label={T('applyCoupon')} onclick={() => { couponGone = false; cart.applyCoupon({ id: o.id, lines: o.lines }); }} />
				{/each}
			</section>
		{/if}
		{#each quote?.nudges ?? [] as n (n)}<div class="nudge"><Icon name="spark" size={18} /><span>{n}</span></div>{/each}
		{#if sugg.length}
			<div class="sugg-wrap">
				<span class="eyebrow">{T('goesWith')}</span>
				<div class="sugg">
					{#each sugg as s (s.id)}
						<div><span class="nm">{s.name}</span><div class="ft"><span class="num" style="font-weight:600">{money(s.sizes[0]?.price_cents ?? s.price_cents)}</span><button type="button" class="addbtn" aria-label="{T('add')} {s.name}" onclick={() => addSugg(s.id)}><Icon name="plus" size={16} stroke={2.5} /></button></div></div>
					{/each}
				</div>
			</div>
		{/if}
		<div class="totals">
			<div><span>{T('subtotal')}</span><span class="num">{money(quote?.subtotal_cents ?? cart.subtotal)}</span></div>
			{#each quote?.discounts ?? [] as d (d.label)}<div class="disc"><span>{d.label}</span><span class="num">−{money(d.amount_cents)}</span></div>{/each}
			{#if quote?.saved_cents}<div class="note"><span>{T('savedYou', { m: money(quote.saved_cents) })}</span></div>{/if}
		</div>
		{#each cartErrs as err (err)}<div class="banner warn"><Icon name="info" size={18} /><span class="grow">{err}</span></div>{/each}
		{#if quoteErr}<div class="banner warn"><Icon name="info" size={18} /><span class="grow">{quoteErr}</span></div>{/if}
		<a class="btn btn-p btn-lg btn-block go hide-m" href="{b}/checkout"><span class="split"><span>{T('goCheckout')}</span><span class="num">{money(afterDeals)}</span></span></a>
	</div>
	<div class="placebar only-m"><a class="btn btn-p btn-lg btn-block" href="{b}/checkout"><span class="split"><span>{T('goCheckout')}</span><span class="num">{money(afterDeals)}</span></span></a></div>
{/if}

<style>
	.wrap { display: flex; flex-direction: column; gap: 16px; padding-top: 8px; padding-bottom: 120px; max-width: 760px; }
	.lines { list-style: none; margin: 0; padding: 0; }
	.line { align-items: center; }
	.stepper.sm button { width: 34px; height: 34px; display: grid; place-items: center; }
	.stepper.sm b { min-width: 20px; font-size: 15px; }
	.err { color: var(--q-bad); font-size: 13px; font-weight: 600; }
	.sugg-wrap { display: flex; flex-direction: column; gap: 10px; }
	.coupons { display: flex; flex-direction: column; gap: 10px; }
	.sugg .addbtn { width: 30px; height: 30px; }
	.seg button { display: inline-flex; align-items: center; justify-content: center; flex: 1; gap: 6px; min-height: 40px; padding: 0 16px; border-radius: var(--q-btn-radius); font: 600 15px var(--q-font-body); color: var(--q-text2); }
	.seg button.on { background: var(--q-surface); color: var(--q-text); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18); }
	.actions { display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 340px; }
	.go { margin-top: 8px; }
	.placebar { display: block; }
	@media (min-width: 700px) { .placebar.only-m { display: none; } }
	@media (max-width: 699px) { :global(.sf.has-tabbar) .placebar { bottom: calc(74px + env(safe-area-inset-bottom, 0px)); } }
</style>
