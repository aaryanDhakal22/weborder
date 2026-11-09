<!-- The order panel beside the menu on wide screens. -->
<script lang="ts">
	import Icon from './Icon.svelte';
	import { cart } from '$lib/cart.svelte';
	import { t } from '$lib/i18n';
	import { money } from '$lib/fmt';
	import type { Lang } from '$lib/types';

	let { lang, base }: { lang: Lang; base: string } = $props();
	const T = (k: Parameters<typeof t>[1], v?: Record<string, string | number>) => t(lang, k, v);
</script>

<aside class="cart-col" aria-label={T('yourOrder')}>
	<div class="ph"><h2>{T('yourOrder')}</h2><span class="muted num">{T('items', { n: cart.count })}</span></div>
	{#if cart.entries.length}
		<div>
			{#each cart.entries as e, i (i)}
				<div class="line">
					<span class="qty">{e.line.qty ?? 1}</span>
					<div class="txt"><span class="nm">{e.name}</span>{#if e.mods.length}<span class="mods">{e.mods.join(' · ')}</span>{/if}</div>
					<span class="pr num">{money(e.unitCents * (e.line.qty ?? 1))}</span>
				</div>
			{/each}
		</div>
		<div class="totals"><div><span>{T('subtotal')}</span><span class="num">{money(cart.subtotal)}</span></div></div>
		<a class="btn btn-p btn-lg btn-block" href="{base}/checkout"><span class="split"><span>{T('checkout')}</span><span class="num">{money(cart.subtotal)}</span></span></a>
		<a class="btn btn-ghost btn-sm" href="{base}/cart">{T('edit')}</a>
	{:else}
		<p class="muted empty"><Icon name="cart" size={18} /> {T('emptyCartSub')}</p>
	{/if}
</aside>

<style>
	.ph { display: flex; justify-content: space-between; align-items: baseline; }
	.ph h2 { font-size: 28px; }
	.empty { display: flex; gap: 8px; align-items: center; font-size: 14px; }
</style>
