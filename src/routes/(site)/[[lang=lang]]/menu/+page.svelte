<script lang="ts">
	import { pushState } from '$app/navigation';
	import { page } from '$app/state';
	import MenuList from '$lib/components/MenuList.svelte';
	import CartPanel from '$lib/components/CartPanel.svelte';
	import ItemConfigurator from '$lib/components/ItemConfigurator.svelte';
	import { cart, type CartEntry } from '$lib/cart.svelte';
	import { toast } from '$lib/toast.svelte';
	import { t, tr } from '$lib/i18n';
	import type { Item } from '$lib/types';

	let { data } = $props();
	const L = $derived(data.lang);
	const b = $derived(data.base);
	const layout = $derived(data.theme.layout);
	const open = $derived<Item | null>(page.state.sheet ? (data.categories.flatMap((c) => c.items).find((i) => i.slug === page.state.sheet) ?? null) : null);
	const desc = $derived(`${data.store.name} menu: ${data.categories.map((c) => tr(c, 'name', L)).join(', ')}. ${L === 'es' ? 'Pide en línea.' : 'Order online.'}`);

	function pick(e: MouseEvent, item: Item) {
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
		e.preventDefault();
		pushState(`${b}/menu/${item.slug}`, { sheet: item.slug });
	}
	function close() {
		history.back();
	}
	function add(entry: CartEntry) {
		cart.add(entry);
		toast.show(`${t(L, 'add')}: ${entry.name}`);
		close();
	}
	function onkey(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) close();
	}
</script>

<svelte:window onkeydown={onkey} />
<svelte:head>
	<title>{data.title}</title>
	<meta name="description" content={desc} />
	<link rel="canonical" href="{data.origin}{b}/menu" />
	<meta property="og:title" content={data.title} />
	<meta property="og:description" content={desc} />
	{@html `<script type="application/ld+json">${data.menuLd}</script>`}
</svelte:head>

<h1 class="sr">{t(L, 'menu')} · {data.store.name}</h1>
<nav class="catbar pad" aria-label={t(L, 'menu')}>
	{#each data.categories as c, i (c.id)}<a class="chip" class:on={i === 0} href="#{c.slug}">{tr(c, 'name', L)}</a>{/each}
</nav>
<div class="menu-layout">
	<div class="menu-col">
		<MenuList categories={data.categories} layout={layout.menu} lang={L} base={b} soldOut={data.live.soldOut} onpick={pick} wide={layout.menu === 'compact'} />
	</div>
	{#if layout.nav === 'top'}<CartPanel lang={L} base={b} />{/if}
</div>

{#if open}
	<div class="scrim" onclick={close} role="presentation"></div>
	<div class="sheet {open.groups?.some((g) => data.groups[g]?.portions) ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label={tr(open, 'name', L)}>
		<div class="grab"></div>
		<div class="sheet-body">
			<ItemConfigurator item={open} groups={data.groups} lang={L} soldOut={data.live.soldOut.includes(open.id)} onsubmit={add} onclose={close} showArt={data.theme.layout.menu === 'photo'} />
		</div>
	</div>
{/if}
{#if toast.text}<div class="toast" role="status">{toast.text}</div>{/if}

<style>
	.catbar .chip.on { background: var(--q-text); border-color: var(--q-text); color: var(--q-canvas); }
	.sheet :global(.sheet-foot) { position: sticky; bottom: 0; }
	.toast { position: fixed; left: 50%; bottom: calc(96px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); z-index: 20; background: var(--q-text); color: var(--q-canvas); padding: 10px 16px; border-radius: 999px; font-weight: 700; box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5); animation: pop 0.38s cubic-bezier(0.34, 1.56, 0.64, 1); }
	@keyframes pop { from { transform: translate(-50%, 12px) scale(0.9); opacity: 0; } }
</style>
