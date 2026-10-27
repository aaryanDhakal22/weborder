<script lang="ts">
	import Icon from './Icon.svelte';
	import type { Deal, Lang } from '$lib/types';
	import { tr, t } from '$lib/i18n';

	let { deal, lang, href, alt = false, live = true }: { deal: Deal; lang: Lang; href: string; alt?: boolean; live?: boolean } = $props();
	const dollars = $derived(deal.priceCents !== undefined ? (deal.priceCents / 100).toFixed(2) : null);
	const big = $derived(deal.kind === 'mix' && deal.mix ? (deal.mix.eachCents / 100).toFixed(2) : deal.kind === 'nth' && deal.nth ? (deal.nth.pct === 100 ? '2×1' : `${deal.nth.pct}% off`) : deal.kind === 'code' ? (deal.pct ? `${deal.pct}% off` : `$${((deal.amountCents ?? 0) / 100).toFixed(0)} off`) : null);
</script>

<a class="deal" class:alt class:dim={!live} {href}>
	{#if !alt}<i class="blob" style="width:160px;height:160px;right:-40px;top:-40px;background:#fff"></i><i class="blob" style="width:120px;height:120px;left:-30px;bottom:-40px;background:var(--q-deal-bg2)"></i>{/if}
	{#if deal.sticker}<span class="sticker tag tag-save">{tr(deal, 'sticker', lang)}</span>{/if}
	<h3>{tr(deal, 'name', lang)}</h3>
	<p class="desc">{tr(deal, 'desc', lang)}</p>
	<div class="price">
		<div class="pcol">
			{#if deal.regularCents}<span class="was">${(deal.regularCents / 100).toFixed(2)}</span>{/if}
			{#if dollars}<span class="big"><sup>$</sup>{dollars}</span>
			{:else if deal.kind === 'mix'}<span class="big"><sup>$</sup>{big}</span><span class="each">{t(lang, 'each')}</span>
			{:else}<span class="big">{big}</span>{/if}
		</div>
		<span class="go"><Icon name="right" size={22} stroke={2.5} /></span>
	</div>
</a>

<style>
	.pcol { display: flex; flex-direction: column; gap: 4px; }
	.each { font-size: 13px; font-weight: 600; }
	.dim { opacity: 0.55; }
</style>
