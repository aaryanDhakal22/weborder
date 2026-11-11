<!-- The menu in the store's layout preset: compact list (with initial tiles), tile grid or classic
     printed menu. Every item is a link to its own page; the menu page opens it in a sheet instead. -->
<script lang="ts">
	import Icon from './Icon.svelte';
	import ItemTile from './ItemTile.svelte';
	import type { Lang, Menu, MenuCategory, MenuItem } from '$lib/types';
	import { t } from '$lib/i18n';
	import { money } from '$lib/fmt';
	import { fromPrice, sizeShort } from '$lib/menu';

	let { categories, menu, layout, lang, base, soldOut, popular = [], onpick, wide = false }: { categories: MenuCategory[]; menu: Menu; layout: 'compact' | 'photo' | 'printed'; lang: Lang; base: string; soldOut: string[]; popular?: string[]; onpick: (e: MouseEvent, item: MenuItem) => void; wide?: boolean } = $props();
	const T = (k: Parameters<typeof t>[1], v?: Record<string, string | number>) => t(lang, k, v);
	const sold = (i: MenuItem) => i.sold_out || soldOut.includes(i.id);
	const many = (i: MenuItem) => i.sizes.length > 1 || (i.choices?.length ?? 0) > 1;
	const shorts = (i: MenuItem) => i.sizes.map((s) => sizeShort(menu, s.size_id, s.name));
</script>

{#if layout === 'printed'}
	<div class="printed pad">
		{#each categories as c (c.key)}
			<section class="p-sec" id={c.slug} aria-labelledby="h-{c.slug}">
				<h2 id="h-{c.slug}">{c.name}</h2>
				{#each c.items as i (i.id)}
					<a class="p-item" class:sold={sold(i)} href="{base}/menu/{i.slug}" onclick={(e) => onpick(e, i)}>
						<span class="nm">{i.name}{#if popular.includes(i.id)}{' '}<span class="tag tag-save"><Icon name="flame" size={11} /> {T('popular')}</span>{/if}{#if sold(i)}{' '}<span class="tag tag-brand">{T('soldOut')}</span>{/if}</span>
						<span class="lead"></span><span class="pr">{money(fromPrice(i))}</span>
						{#if i.description}<span class="ds">{i.description}</span>{/if}
					</a>
				{/each}
			</section>
		{/each}
	</div>
{:else if layout === 'photo'}
	{#each categories as c (c.key)}
		<section class="pad" id={c.slug} aria-labelledby="h-{c.slug}">
			<div class="cat-title"><h2 id="h-{c.slug}">{c.name}</h2><span class="muted">{T('items', { n: c.items.length })}</span></div>
			<div class="pgrid">
				{#each c.items as i (i.id)}
					<a class="pcard" class:sold={sold(i)} href="{base}/menu/{i.slug}" onclick={(e) => onpick(e, i)}>
						<ItemTile name={i.name} sizes={shorts(i)} />
						<div class="bd"><span class="nm">{i.name}</span>{#if i.description}<span class="ds">{i.description}</span>{/if}
							<div class="ft"><span class="pr num">{many(i) ? `${T('from')} ` : ''}{money(fromPrice(i))}</span>{#if sold(i)}<span class="tag tag-brand">{T('soldOut')}</span>{:else}<span class="addbtn"><Icon name="plus" size={18} stroke={2.5} /></span>{/if}</div>
						</div>
					</a>
				{/each}
			</div>
		</section>
	{/each}
{:else}
	{#each categories as c (c.key)}
		<section class="pad" id={c.slug} aria-labelledby="h-{c.slug}">
			<div class="cat-title"><h2 id="h-{c.slug}">{c.name}</h2><span class="muted">{T('items', { n: c.items.length })}</span></div>
			<div class="rows" class:two={wide}>
				{#each c.items as i (i.id)}
					<a class="row" class:sold={sold(i)} href="{base}/menu/{i.slug}" onclick={(e) => onpick(e, i)}>
						<ItemTile name={i.name} small />
						<div class="txt">
							<span class="nm">{i.name}{#if popular.includes(i.id)}{' '}<span class="tag tag-pop"><Icon name="flame" size={12} /> {T('popular')}</span>{/if}{#if sold(i)}{' '}<span class="tag tag-brand">{T('soldOut')}</span>{/if}</span>
							{#if i.description}<span class="ds">{i.description}</span>{/if}
							<span class="pr">{#if many(i)}<small>{T('from')}</small>{/if}{money(fromPrice(i))}</span>
							{#if i.sizes.length > 1}<span class="sizes hide-m">{#each i.sizes as s (s.size_id)}<span>{sizeShort(menu, s.size_id, s.name)} {money(s.price_cents)}</span>{/each}</span>{/if}
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
	.row { align-items: center; }
	.sold { opacity: 0.5; }
</style>
