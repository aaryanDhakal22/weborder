<script lang="ts">
	import { pushState } from '$app/navigation';
	import { page } from '$app/state';
	import MenuList from '$lib/components/MenuList.svelte';
	import CartPanel from '$lib/components/CartPanel.svelte';
	import ItemConfigurator from '$lib/components/ItemConfigurator.svelte';
	import { cart } from '$lib/cart.svelte';
	import { toast } from '$lib/toast.svelte';
	import { t } from '$lib/i18n';
	import { contextOf, groupsOf, itemBySlug } from '$lib/menu';
	import type { CartEntry, MenuItem } from '$lib/types';

	let { data } = $props();
	const L = $derived(data.lang);
	const b = $derived(data.base);
	const menu = $derived(data.store.menu);
	const ctx = $derived(contextOf(data.store));
	const layout = $derived(data.theme.layout);
	const soldOut = $derived(data.status?.sold_out ?? []);
	const open = $derived<MenuItem | null>(page.state.sheet ? (itemBySlug(menu, page.state.sheet) ?? null) : null);
	const categories = $derived(menu.categories.filter((c) => c.items.length));
	const desc = $derived(`${data.store.name} ${L === 'es' ? 'menú' : 'menu'}: ${categories.map((c) => c.name).join(', ')}. ${L === 'es' ? 'Pide en línea.' : 'Order online.'}`);
	let current = $state('');

	function pick(e: MouseEvent, item: MenuItem) {
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
		e.preventDefault();
		pushState(`${b}/menu/${item.slug}`, { sheet: item.slug });
	}
	function close() {
		history.back();
	}
	function add(entry: CartEntry) {
		cart.add(entry);
		toast.show(`${t(L, 'added')}: ${entry.name}`);
		close();
	}
	function onkey(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) close();
	}
	$effect(() => {
		const io = new IntersectionObserver((es) => {
			for (const e of es) if (e.isIntersecting) current = e.target.id;
		}, { rootMargin: '-30% 0px -60% 0px' });
		for (const c of categories) {
			const el = document.getElementById(c.slug);
			if (el) io.observe(el);
		}
		return () => io.disconnect();
	});
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
	{#each categories as c, i (c.key)}<a class="chip" class:on={current ? current === c.slug : i === 0} href="#{c.slug}">{c.name}</a>{/each}
</nav>
<div class="menu-layout">
	<div class="menu-col">
		<MenuList {categories} {menu} layout={layout.menu} lang={L} base={b} {soldOut} onpick={pick} wide={layout.menu === 'compact'} />
	</div>
	{#if layout.nav === 'top'}<CartPanel lang={L} base={b} />{/if}
</div>

{#if open}
	<div class="scrim" onclick={close} role="presentation"></div>
	<div class="sheet {groupsOf(menu, open).some((g) => g.portions) ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label={open.name}>
		<div class="grab"></div>
		<div class="sheet-body">
			<ItemConfigurator item={open} {menu} {ctx} lang={L} soldOut={open.sold_out || soldOut.includes(open.id)} onsubmit={add} onclose={close} />
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
