<script lang="ts">
	// A coupon on the cart page (the owner, 2026-11-12: coupons work on the website as at the counter): an
	// offer the order fully fits (Apply) or one applied (Remove). A coupon re-prices its lines — no
	// discount row, no "you saved": the card shows its name, what is in it and its price.
	import Icon from './Icon.svelte';
	import { money } from '$lib/fmt';

	let { name, card, price, applied = false, label, onclick }: {
		name: string; card: string[]; price: number; applied?: boolean; label: string; onclick: () => void;
	} = $props();
</script>

<div class="coupon" class:applied data-testid={applied ? 'coupon-applied' : 'coupon-offer'}>
	<div class="txt">
		<span class="nm">{name}</span>
		{#if card.length}<span class="card-lines">{card.join(' · ')}</span>{/if}
	</div>
	<span class="pr num">{money(price)}</span>
	{#if applied}
		<button type="button" class="btn btn-icon btn-ghost" aria-label={label} {onclick}><Icon name="x" size={18} /></button>
	{:else}
		<button type="button" class="btn btn-p btn-sm" {onclick}>{label}</button>
	{/if}
</div>

<style>
	.coupon { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: var(--q-r-md); border: 2px dashed var(--q-brand); background: var(--q-surface); }
	.coupon.applied { border-style: solid; background: var(--q-brand-soft); }
	.txt { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
	.nm { font-weight: 700; }
	.card-lines { font-size: 13px; color: var(--q-text2); }
	.pr { font-weight: 700; }
</style>
