<!-- The menu in the store's layout preset: compact list, photo grid or classic printed menu. -->
<script lang="ts">
	import Icon from './Icon.svelte';
	import FoodArt from './FoodArt.svelte';
	import type { Category, Item, Lang } from '$lib/types';
	import { t, tr } from '$lib/i18n';
	import { money, fromPrice } from '$lib/fmt';

	let { categories, layout, lang, base, soldOut, onpick, wide = false }: { categories: Category[]; layout: 'compact' | 'photo' | 'printed'; lang: Lang; base: string; soldOut: string[]; onpick: (e: MouseEvent, item: Item) => void; wide?: boolean } = $props();
	const T = (k: Parameters<typeof t>[1], v?: Record<string, string | number>) => t(lang, k, v);
	const sold = (i: Item) => soldOut.includes(i.id);
</script>

{#if layout === 'printed'}
	<div class="printed pad">
		{#each categories as c (c.id)}
			<section class="p-sec" id={c.slug} aria-labelledby="h-{c.slug}">
				<h2 id="h-{c.slug}">{tr(c, 'name', lang)}</h2>
				{#if tr(c, 'sub', lang)}<div class="sub">{tr(c, 'sub', lang)}</div>{/if}
				{#each c.items as i (i.id)}
					<a class="p-item" class:sold={sold(i)} href="{base}/menu/{i.slug}" onclick={(e) => onpick(e, i)}>
						<span class="nm">{tr(i, 'name', lang)}{#if i.popular} <span class="tag tag-save"><Icon name="flame" size={11} /> {T('popular')}</span>{/if}{#if sold(i)} <span class="tag tag-brand">{T('soldOut')}</span>{/if}</span>
						<span class="lead"></span><span class="pr">{money(fromPrice(i))}</span>
						{#if i.sub || tr(i, 'desc', lang)}<span class="ds">{#if i.sub}<span class="es">{i.sub}</span>{#if tr(i, 'desc', lang)} · {/if}{/if}{tr(i, 'desc', lang)}</span>{/if}
					</a>
				{/each}
			</section>
		{/each}
	</div>
{:else if layout === 'photo'}
	{#each categories as c (c.id)}
		<section class="pad" id={c.slug} aria-labelledby="h-{c.slug}">
			<div class="cat-title"><h2 id="h-{c.slug}">{tr(c, 'name', lang)}</h2><span class="muted">{T('items', { n: c.items.length })}</span></div>
			<div class="pgrid">
				{#each c.items as i (i.id)}
					<a class="pcard" class:sold={sold(i)} href="{base}/menu/{i.slug}" onclick={(e) => onpick(e, i)}>
						<FoodArt art={i.art} />
						<div class="bd"><span class="nm">{tr(i, 'name', lang)}</span>{#if tr(i, 'desc', lang)}<span class="ds">{tr(i, 'desc', lang)}</span>{/if}
							<div class="ft"><span class="pr num">{i.sizes?.length ? `${T('from')} ` : ''}{money(fromPrice(i))}</span>{#if sold(i)}<span class="tag tag-brand">{T('soldOut')}</span>{:else}<span class="addbtn"><Icon name="plus" size={18} stroke={2.5} /></span>{/if}</div>
						</div>
					</a>
				{/each}
			</div>
		</section>
	{/each}
{:else}
	{#each categories as c (c.id)}
		<section class="pad" id={c.slug} aria-labelledby="h-{c.slug}">
			<div class="cat-title"><h2 id="h-{c.slug}">{tr(c, 'name', lang)}</h2><span class="muted">{T('items', { n: c.items.length })}</span></div>
			<div class="rows" class:two={wide}>
				{#each c.items as i (i.id)}
					<a class="row" class:sold={sold(i)} href="{base}/menu/{i.slug}" onclick={(e) => onpick(e, i)}>
						<div class="txt">
							<span class="nm">{tr(i, 'name', lang)}{#if i.popular} <span class="tag tag-pop"><Icon name="flame" size={12} /> {T('popular')}</span>{/if}{#if sold(i)} <span class="tag tag-brand">{T('soldOut')}</span>{/if}</span>
							{#if tr(i, 'desc', lang)}<span class="ds">{tr(i, 'desc', lang)}</span>{/if}
							<span class="pr">{#if i.sizes?.length}<small>{T('from')}</small>{/if}{money(fromPrice(i))}</span>
							{#if i.sizes?.length}<span class="sizes hide-m">{#each i.sizes as s (s.id)}<span>{s.short ?? s.name} {money(s.priceCents)}</span>{/each}</span>{/if}
						</div>
						<span class="addbtn" aria-hidden="true"><Icon name="plus" size={18} stroke={2.5} /></span>
					</a>
				{/each}
			</div>
		</section>
	{/each}
{/if}

<style>
	.p-item, .row, .pcard { cursor: pointer; }
	.sold { opacity: 0.5; }
</style>
