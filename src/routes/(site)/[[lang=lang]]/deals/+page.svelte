<script lang="ts">
	import DealCard from '$lib/components/DealCard.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { t, tr } from '$lib/i18n';

	let { data } = $props();
	const L = $derived(data.lang);
	const b = $derived(data.base);
	let filter = $state<'all' | 'bundle' | 'auto' | 'code'>('all');
	const shown = $derived(data.deals.filter((d) => filter === 'all' || (filter === 'auto' ? d.kind === 'mix' || d.kind === 'nth' : d.kind === filter)));
	const desc = $derived(`${data.store.name} deals: ${data.deals.map((d) => tr(d, 'name', L)).join(', ')}.`);
	const F = $derived([['all', t(L, 'all')], ['bundle', L === 'es' ? 'Paquetes' : 'Bundles'], ['auto', L === 'es' ? 'Automáticas' : 'Automatic'], ['code', L === 'es' ? 'Códigos' : 'Codes']] as const);
</script>

<svelte:head>
	<title>{data.title}</title>
	<meta name="description" content={desc} />
	<link rel="canonical" href="{data.origin}{b}/deals" />
	{@html `<script type="application/ld+json">${data.ld}</script>`}
</svelte:head>

<div class="pad head">
	<span class="eyebrow">{t(L, 'thisWeek')}</span>
	<h1>{t(L, 'deals')}</h1>
	<div class="chips" role="radiogroup" aria-label="Filter">
		{#each F as [k, label] (k)}<button type="button" role="radio" aria-checked={filter === k} class="chip" class:on={filter === k} onclick={() => (filter = k)}>{label}</button>{/each}
	</div>
</div>
<div class="pad grid">
	{#each shown as d, i (d.id)}
		<DealCard deal={d} lang={L} live={d.live} alt={i % 2 === 1} href={`${b}/deals/${d.slug}`} />
	{/each}
</div>
<div class="pad foot-note"><div class="banner info"><Icon name="tag" size={20} /><span class="grow">{t(L, 'haveCode')}</span></div></div>

<style>
	.head { padding-top: 24px; padding-bottom: 8px; display: flex; flex-direction: column; gap: 14px; }
	.head h1 { font-size: clamp(40px, 9vw, 72px); }
	.chips { display: flex; gap: 8px; flex-wrap: wrap; }
	.grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr)); padding-top: 12px; padding-bottom: 24px; }
	.grid :global(.deal) { flex: none; }
	.foot-note { padding-bottom: 24px; }
</style>
