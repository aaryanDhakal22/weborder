<script lang="ts">
	import Icon from './Icon.svelte';
	import type { Deal, Lang } from '$lib/types';
	import { t } from '$lib/i18n';
	import { money } from '$lib/fmt';

	let { deal, lang, href, alt = false, live = true }: { deal: Deal; lang: Lang; href: string; alt?: boolean; live?: boolean } = $props();
	const off = (d: Deal) => (d.pct ? `${d.pct}% ${t(lang, 'off')}` : d.amount_cents ? `${money(d.amount_cents)} ${t(lang, 'off')}` : '');
	const big = $derived(
		deal.kind === 'bundle' && deal.price_cents ? money(deal.price_cents)
		: deal.kind === 'mix' && deal.each_cents ? money(deal.each_cents)
		: deal.kind === 'nth' ? (deal.pct === 100 ? t(lang, 'free') : `${deal.pct}% ${t(lang, 'off')}`)
		: deal.kind === 'free_item' ? t(lang, 'free')
		: off(deal)
	);
	const sub = $derived(deal.kind === 'mix' ? `${deal.qty}+ · ${t(lang, 'each')}` : deal.kind === 'code' && deal.code ? `${t(lang, 'code')}: ${deal.code}` : '');
</script>

<a class="deal" class:alt class:dim={!live} {href}>
	{#if !alt}<i class="blob" style="width:160px;height:160px;right:-40px;top:-40px;background:#fff"></i><i class="blob" style="width:120px;height:120px;left:-30px;bottom:-40px;background:var(--q-deal-bg2)"></i>{/if}
	{#if !live}<span class="sticker tag tag-save">{t(lang, 'notNowDeal')}</span>{/if}
	<h3>{deal.name}</h3>
	{#if deal.description}<p class="desc">{deal.description}</p>{/if}
	<div class="price">
		<div class="pcol">
			<span class="big">{big}</span>
			{#if sub}<span class="each">{sub}</span>{/if}
		</div>
		<span class="go"><Icon name="right" size={22} stroke={2.5} /></span>
	</div>
</a>

<style>
	.pcol { display: flex; flex-direction: column; gap: 4px; }
	.each { font-size: 13px; font-weight: 600; }
	.dim { opacity: 0.55; }
</style>
