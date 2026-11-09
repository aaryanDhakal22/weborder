<script lang="ts">
	import { goto } from '$app/navigation';
	import ItemConfigurator from '$lib/components/ItemConfigurator.svelte';
	import { cart } from '$lib/cart.svelte';
	import { t } from '$lib/i18n';
	import { contextOf, findItem } from '$lib/menu';
	import type { CartEntry } from '$lib/types';

	let { data } = $props();
	const L = $derived(data.lang);
	const b = $derived(data.base);
	const menu = $derived(data.store.menu);
	const item = $derived(findItem(menu, data.itemId)!);
	const ctx = $derived(contextOf(data.store));
	function add(entry: CartEntry) {
		cart.add(entry);
		goto(`${b}/menu#${data.category.slug}`);
	}
</script>

<svelte:head>
	<title>{data.title}</title>
	<meta name="description" content={data.desc} />
	<link rel="canonical" href="{data.origin}{b}/menu/{item.slug}" />
	<meta property="og:title" content={data.title} />
	<meta property="og:description" content={data.desc} />
	<meta property="og:type" content="product" />
	{@html `<script type="application/ld+json">${data.ld}</script>`}
</svelte:head>

<nav class="pad crumbs" aria-label={t(L, 'breadcrumb')}><a href="{b}/menu">{t(L, 'menu')}</a> / <a href="{b}/menu#{data.category.slug}">{data.category.name}</a></nav>
<div class="pad item-page">
	<div class="card item-card">
		<ItemConfigurator {item} {menu} {ctx} lang={L} soldOut={item.sold_out || (data.status?.sold_out ?? []).includes(item.id)} onsubmit={add} headingTag="h1" showTile />
	</div>
</div>

<style>
	.crumbs { padding-top: 16px; font-size: 14px; color: var(--q-muted); }
	.crumbs a { color: var(--q-brand-ink); font-weight: 600; }
	.item-page { padding-top: 12px; padding-bottom: 40px; }
	.item-card { overflow: hidden; max-width: 1000px; }
</style>
