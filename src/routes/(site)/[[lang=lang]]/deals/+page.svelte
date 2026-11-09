<script lang="ts">
	import DealCard from '$lib/components/DealCard.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Miso from '$lib/components/Miso.svelte';
	import noDealsArt from '$lib/miso/art/miso-no-deals.svg?raw';
	import { t } from '$lib/i18n';
	import { live } from '$lib/engine';

	let { data } = $props();
	const L = $derived(data.lang);
	const b = $derived(data.base);
	const S = $derived(data.store);
	let filter = $state<'all' | 'bundle' | 'auto' | 'code'>('all');
	const shown = $derived(S.deals.filter((d) => filter === 'all' || (filter === 'auto' ? d.kind === 'mix' || d.kind === 'nth' || d.kind === 'free_item' : d.kind === filter)));
	const desc = $derived(S.deals.length ? `${S.name} ${L === 'es' ? 'ofertas' : 'deals'}: ${S.deals.map((d) => d.name).join(', ')}.` : `${S.name} ${L === 'es' ? 'ofertas' : 'deals'}.`);
	const F = $derived([['all', t(L, 'all')], ['bundle', t(L, 'bundles')], ['auto', t(L, 'automatic')], ['code', t(L, 'codes')]] as const);
	const now = new Date();
</script>

<svelte:head>
	<title>{data.title}</title>
	<meta name="description" content={desc} />
	<link rel="canonical" href="{data.origin}{b}/deals" />
	{#if S.deals.length}{@html `<script type="application/ld+json">${data.ld}</script>`}{/if}
</svelte:head>

<div class="pad head">
	<span class="eyebrow">{t(L, 'thisWeek')}</span>
	<h1>{t(L, 'deals')}</h1>
	{#if S.deals.length > 1}
		<div class="chips" role="radiogroup" aria-label={t(L, 'filter')}>
			{#each F as [k, label] (k)}<button type="button" role="radio" aria-checked={filter === k} class="chip" class:on={filter === k} onclick={() => (filter = k)}>{label}</button>{/each}
		</div>
	{/if}
</div>
{#if S.deals.length}
	<div class="pad grid">
		{#each shown as d, i (d.id)}
			<DealCard deal={d} lang={L} live={live(d, S.timezone, now, '')} alt={i % 2 === 1} href="{b}/deals/{d.id}" />
		{/each}
	</div>
	<div class="pad foot-note"><div class="banner info"><Icon name="tag" size={20} /><span class="grow">{t(L, 'haveCode')}</span></div></div>
{:else}
	<div class="state">
		{#if S.look.miso.pages}<Miso art={noDealsArt} size={170} decorative />{/if}
		<h2>{t(L, 'noDeals')}</h2>
		<p>{t(L, 'noDealsSub')}</p>
		<a class="btn btn-p btn-lg" href="{b}/menu">{t(L, 'seeMenu')}</a>
	</div>
{/if}

<style>
	.head { padding-top: 24px; padding-bottom: 8px; display: flex; flex-direction: column; gap: 14px; }
	.head h1 { font-size: clamp(40px, 9vw, 72px); }
	.chips { display: flex; gap: 8px; flex-wrap: wrap; }
	.grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr)); padding-top: 12px; padding-bottom: 24px; }
	.grid :global(.deal) { flex: none; }
	.foot-note { padding-bottom: 24px; }
</style>
