<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import Mascot from '$lib/components/Mascot.svelte';
	import { cart } from '$lib/cart.svelte';
	import { fetchQuote } from '$lib/api';
	import { t, tr } from '$lib/i18n';
	import { money } from '$lib/fmt';
	import type { Quote } from '$lib/types';

	let { data } = $props();
	const S = $derived(data.store);
	const L = $derived(data.lang);
	const b = $derived(data.base);
	const T = (k: Parameters<typeof t>[1], v?: Record<string, string | number>) => t(L, k, v);
	let quote = $state<Quote | null>(null);

	$effect(() => {
		const lines = $state.snapshot(cart.entries).map((e) => e.line);
		const fulfil = cart.fulfil;
		if (!cart.ready || !lines.length) {
			quote = null;
			return;
		}
		const ctl = new AbortController();
		const id = setTimeout(() => fetchQuote({ lines, fulfil, code: cart.code || undefined, tipCents: 0 }, ctl.signal).then((q) => (quote = q)).catch(() => {}), 150);
		return () => {
			clearTimeout(id);
			ctl.abort();
		};
	});
	const sugg = $derived(data.suggestions.filter((s) => !cart.entries.some((e) => e.line.kind === 'item' && e.line.itemId === s.id)).slice(0, 3));
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
		<Mascot pose="bowl" size={180} />
		<h2>{T('emptyCart')}</h2>
		<p>{T('emptyCartSub')}</p>
		<div class="actions"><a class="btn btn-p btn-lg btn-block" href="{b}/deals">{T('seeDeals')}</a><a class="btn btn-lg btn-block" href="{b}/menu">{T('browse')}</a></div>
	</div>
{:else}
	<div class="pad wrap">
		{#if S.settings.delivery && S.settings.pickup}
			<div class="seg full" role="radiogroup" aria-label="{T('delivery')} / {T('pickup')}">
				<button type="button" role="radio" aria-checked={cart.fulfil === 'delivery'} class:on={cart.fulfil === 'delivery'} onclick={() => cart.setFulfil('delivery')}><Icon name="scooter" size={16} />{T('delivery')}</button>
				<button type="button" role="radio" aria-checked={cart.fulfil === 'pickup'} class:on={cart.fulfil === 'pickup'} onclick={() => cart.setFulfil('pickup')}><Icon name="bag" size={16} />{T('pickup')}</button>
			</div>
		{/if}
		<ul class="lines">
			{#each cart.entries as e, i (i)}
				{@const q = quote?.lines[i]}
				<li class="line">
					<span class="stepper sm">
						<button type="button" aria-label="{T('remove')} 1" onclick={() => cart.setQty(i, e.line.qty - 1)}><Icon name={e.line.qty === 1 ? 'trash' : 'minus'} size={16} /></button>
						<b>{e.line.qty}</b>
						<button type="button" aria-label="+1" onclick={() => cart.setQty(i, e.line.qty + 1)}><Icon name="plus" size={16} /></button>
					</span>
					<div class="txt"><span class="nm">{e.name}{#if e.line.kind === 'deal'} <span class="tag tag-save">{L === 'es' ? 'Oferta' : 'Deal'}</span>{/if}</span>{#if e.mods.length}<span class="mods">{e.mods.join(' · ')}</span>{/if}{#if q?.error}<span class="err">{q.error}</span>{/if}</div>
					<span class="pr num">{money((q?.unitCents ?? e.unitCents) * e.line.qty)}{#if q?.regularCents && q.regularCents > q.unitCents}<span class="was">{money(q.regularCents * e.line.qty)}</span>{/if}</span>
				</li>
			{/each}
		</ul>
		{#each quote?.nudges ?? [] as n (n)}<div class="nudge"><Icon name="spark" size={18} /><span>{n}</span></div>{/each}
		{#if sugg.length}
			<div class="sugg-wrap">
				<span class="eyebrow">{T('goesWith')}</span>
				<div class="sugg">
					{#each sugg as s (s.id)}
						<div><span class="nm">{tr(s, 'name', L)}</span><div class="ft"><span class="num" style="font-weight:600">{money(s.priceCents)}</span><button type="button" class="addbtn" aria-label="{T('add')} {tr(s, 'name', L)}" onclick={() => cart.add({ line: { kind: 'item', itemId: s.id, sizeId: s.sizeId, opts: [], qty: 1 }, name: s.name, mods: [], unitCents: s.priceCents })}><Icon name="plus" size={16} stroke={2.5} /></button></div></div>
					{/each}
				</div>
			</div>
		{/if}
		<div class="totals">
			<div><span>{T('subtotal')}</span><span class="num">{money(quote?.subtotalCents ?? cart.subtotal)}</span></div>
			{#each quote?.discounts ?? [] as d (d.label)}<div class="disc"><span>{d.label}</span><span class="num">−{money(d.amountCents)}</span></div>{/each}
			{#if quote?.savedCents}<div class="note"><span>{T('savedYou', { m: money(quote.savedCents) })}</span></div>{/if}
		</div>
		{#each quote?.errors ?? [] as err (err)}<div class="banner warn"><Icon name="info" size={18} /><span class="grow">{err}</span></div>{/each}
		<a class="btn btn-p btn-lg btn-block go hide-m" href="{b}/checkout"><span class="split"><span>{T('goCheckout')}</span><span class="num">{money(quote ? quote.subtotalCents - quote.discounts.reduce((s, d) => s + d.amountCents, 0) : cart.subtotal)}</span></span></a>
	</div>
	<div class="placebar only-m"><a class="btn btn-p btn-lg btn-block" href="{b}/checkout"><span class="split"><span>{T('goCheckout')}</span><span class="num">{money(quote ? quote.subtotalCents - quote.discounts.reduce((s, d) => s + d.amountCents, 0) : cart.subtotal)}</span></span></a></div>
{/if}

<style>
	.wrap { display: flex; flex-direction: column; gap: 16px; padding-top: 8px; padding-bottom: 120px; max-width: 760px; }
	.lines { list-style: none; margin: 0; padding: 0; }
	.line { align-items: center; }
	.stepper.sm button { width: 34px; height: 34px; display: grid; place-items: center; }
	.stepper.sm b { min-width: 20px; font-size: 15px; }
	.err { color: var(--q-bad); font-size: 13px; font-weight: 600; }
	.sugg-wrap { display: flex; flex-direction: column; gap: 10px; }
	.sugg .addbtn { width: 30px; height: 30px; }
	.seg button { display: inline-flex; align-items: center; justify-content: center; flex: 1; gap: 6px; min-height: 40px; padding: 0 16px; border-radius: var(--q-btn-radius); font: 600 15px var(--q-font-body); color: var(--q-text2); }
	.seg button.on { background: var(--q-surface); color: var(--q-text); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18); }
	.actions { display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 340px; }
	.go { margin-top: 8px; }
	.placebar { display: block; }
	@media (min-width: 700px) { .placebar.only-m { display: none; } }
	@media (max-width: 699px) { :global(.sf.has-tabbar) .placebar { bottom: calc(74px + env(safe-area-inset-bottom, 0px)); } }
</style>
