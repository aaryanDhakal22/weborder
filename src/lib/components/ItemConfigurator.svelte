<!-- Configures one item: size, option groups (with halves), notes and quantity. Prices with the same
     function the server uses, so what the customer sees is what the quote returns. -->
<script lang="ts">
	import Icon from './Icon.svelte';
	import Portion from './Portion.svelte';
	import PizzaPie from './PizzaPie.svelte';
	import FoodArt from './FoodArt.svelte';
	import type { Group, Item, Lang, Menu, OptPick, Portion as P } from '$lib/types';
	import { priceSelection, money } from '$lib/pricing';
	import { t, tr } from '$lib/i18n';
	import type { CartEntry } from '$lib/cart.svelte';

	let {
		item,
		groups,
		lang,
		soldOut = false,
		freeOptions = 0,
		allowedSizes,
		submitLabel,
		onsubmit,
		onclose,
		showArt = false,
		headingTag = 'h2'
	}: {
		item: Item;
		groups: Record<string, Group>;
		lang: Lang;
		soldOut?: boolean;
		freeOptions?: number;
		allowedSizes?: string[];
		submitLabel?: string;
		onsubmit: (entry: CartEntry) => void;
		onclose?: () => void;
		showArt?: boolean;
		headingTag?: 'h1' | 'h2';
	} = $props();

	const T = (k: Parameters<typeof t>[1], v?: Record<string, string | number>) => t(lang, k, v);
	const itemGroups = $derived((item.groups ?? []).map((g) => groups[g]).filter(Boolean));
	const sizes = $derived((item.sizes ?? []).filter((s) => !allowedSizes?.length || allowedSizes.includes(s.name)));
	let sizeId = $state<string | undefined>(undefined);
	let picks = $state<OptPick[]>([]);
	let qty = $state(1);
	let note = $state('');

	// Reset when the item changes (sheet reused for another item).
	let lastItem = '';
	$effect.pre(() => {
		if (item.id === lastItem) return;
		lastItem = item.id;
		sizeId = (sizes.find((s) => s.default) ?? sizes[0])?.id;
		picks = itemGroups.flatMap((g) => g.options.filter((o) => o.default).map((o) => ({ g: g.id, o: o.id, ...(g.portions ? { p: 'whole' as P } : {}) })));
		qty = 1;
		note = '';
	});

	const menuLike = $derived<Menu>({ categories: [{ id: '_', slug: '_', name: '', items: [item] }], groups });
	const priced = $derived(priceSelection(menuLike, { itemId: item.id, sizeId, opts: picks }, freeOptions));
	const missing = $derived(itemGroups.find((g) => picks.filter((p) => p.g === g.id).length < g.min));
	const isPizza = $derived(itemGroups.some((g) => g.portions));
	const toppings = $derived(
		itemGroups.filter((g) => g.portions).flatMap((g) => picks.filter((p) => p.g === g.id).map((p) => ({ id: p.o, name: g.options.find((o) => o.id === p.o)?.name ?? '', p: p.p ?? ('whole' as P) })))
	);

	const picked = (g: Group, o: string) => picks.find((p) => p.g === g.id && p.o === o);
	function toggle(g: Group, o: string) {
		const has = picked(g, o);
		if (g.max === 1) {
			picks = [...picks.filter((p) => p.g !== g.id), { g: g.id, o }];
			return;
		}
		if (has) picks = picks.filter((p) => !(p.g === g.id && p.o === o));
		else if (!g.max || picks.filter((p) => p.g === g.id).length < g.max) picks = [...picks, { g: g.id, o, ...(g.portions ? { p: 'whole' as P } : {}) }];
	}
	function setPortion(g: Group, o: string, p: P) {
		picks = picks.map((x) => (x.g === g.id && x.o === o ? { ...x, p } : x));
	}
	const rule = (g: Group) => (g.min && g.max === 1 ? T('pick', { n: 1 }) : g.max ? T('upTo', { n: g.max }) : T('pickAny'));
	const optPrice = (o: { priceCents: number; sizePrices?: Record<string, number> }) => (sizeId && o.sizePrices?.[sizeId] !== undefined ? o.sizePrices[sizeId] : o.priceCents);

	function submit() {
		if (missing || soldOut) return;
		const mods = note.trim() ? [...priced.mods, `“${note.trim()}”`] : priced.mods;
		onsubmit({ line: { kind: 'item', itemId: item.id, sizeId, opts: picks, qty, ...(note.trim() ? { note: note.trim() } : {}) }, name: item.name, mods, unitCents: priced.unitCents });
	}
</script>

<div class="cfg">
	{#if showArt && !isPizza}<FoodArt art={item.art} />{/if}
	<div class="cfg-head">
		<div>
			{#if item.popular}<span class="tag tag-pop"><Icon name="flame" size={12} /> {T('popular')}</span>{/if}
			<svelte:element this={headingTag} class="cfg-title">{tr(item, 'name', lang)}</svelte:element>
			{#if tr(item, 'desc', lang)}<p class="t2 cfg-desc">{tr(item, 'desc', lang)}</p>{/if}
			{#if isPizza}<p class="muted cfg-desc">{T('halvesSame')}</p>{/if}
		</div>
		{#if onclose}<button type="button" class="btn btn-icon btn-ghost" onclick={onclose} aria-label={T('close')}><Icon name="x" size={22} /></button>{/if}
	</div>

	<div class="builder-cols" class:solo={!isPizza}>
		{#if isPizza || sizes.length > 1}
			<div class="pizza-top">
				{#if isPizza}<PizzaPie {toppings} />{/if}
				{#if sizes.length > 1}
					<div class="sizes-seg" role="radiogroup" aria-label={T('size')}>
						{#each sizes as s (s.id)}
							<button type="button" role="radio" aria-checked={sizeId === s.id} class:on={sizeId === s.id} onclick={() => (sizeId = s.id)}>
								<span class="s1">{s.short ?? s.name}</span>{#if s.short}<span class="s2">{s.name.replace(s.short, '').trim()}</span>{/if}<span class="s3 num">{money(s.priceCents)}</span>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
		<div>
			{#each itemGroups as g (g.id)}
				<fieldset class="grp">
					<legend class="grp-h"><h3 class="grp-name">{tr(g, 'name', lang)}</h3><span class="rule">{#if g.min}<span class="req">{T('required')}</span> · {/if}{rule(g)}</span></legend>
					{#if g.portions}<p class="muted hint">{T('toppingsHint')}</p>{/if}
					{#each g.options as o (o.id)}
						{@const on = picked(g, o.id)}
						<div class="opt">
							<button type="button" class="opt-main" role={g.max === 1 ? 'radio' : 'checkbox'} aria-checked={!!on} onclick={() => toggle(g, o.id)}>
								<span class={g.max === 1 ? 'radio' : 'check'} class:on={!!on}>{#if on && g.max !== 1}<Icon name="check" size={14} stroke={3} />{/if}</span>
								<span class="nm">{tr(o, 'name', lang)}</span>
							</button>
							{#if g.portions && on}
								<span class="portion" role="radiogroup" aria-label="{tr(o, 'name', lang)}: {T('whole')} / {T('left')} / {T('right')}">
									{#each ['left', 'whole', 'right'] as const as k (k)}
										<button type="button" role="radio" aria-checked={on.p === k} aria-label={T(k)} class:on={on.p === k} onclick={() => setPortion(g, o.id, k)}><Portion kind={k} /></button>
									{/each}
								</span>
							{/if}
							<span class="pr">{optPrice(o) ? '+' + money(optPrice(o)) : ''}</span>
						</div>
					{/each}
				</fieldset>
			{/each}
			<div class="grp">
				<label class="field">
					<span class="lbl">{T('notes')}</span>
					<input type="text" maxlength="140" bind:value={note} placeholder={T('notesPh')} />
				</label>
			</div>
		</div>
	</div>
</div>
<div class="sheet-foot">
	<span class="stepper">
		<button type="button" aria-label="−" onclick={() => (qty = Math.max(1, qty - 1))}><Icon name="minus" size={18} /></button>
		<b aria-live="polite">{qty}</b>
		<button type="button" aria-label="+" onclick={() => (qty = Math.min(50, qty + 1))}><Icon name="plus" size={18} /></button>
	</span>
	<button type="button" class="btn btn-p btn-lg grow" disabled={!!missing || soldOut} onclick={submit}>
		<span class="split"><span>{soldOut ? T('soldOut') : missing ? `${T('pick', { n: missing.min })}: ${tr(missing, 'name', lang)}` : (submitLabel ?? T('addToOrder'))}</span>{#if !soldOut}<span class="num">{money(priced.unitCents * qty)}</span>{/if}</span>
	</button>
</div>

<style>
	.cfg { display: flex; flex-direction: column; }
	.cfg :global(.photo) { min-height: 170px; border-radius: 0; }
	.cfg-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding: 16px 20px 6px; }
	.cfg-title { font-size: 32px; margin-top: 6px; }
	.cfg-desc { font-size: 15px; margin-top: 6px; }
	.grp { border: 0; margin: 0; min-width: 0; }
	.grp-h { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; width: 100%; padding: 0; }
	.grp-name { font-size: 20px; }
	.hint { font-size: 13px; margin-top: -4px; }
	.opt-main { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; min-height: 46px; text-align: left; }
	.sizes-seg button { border: var(--q-border-w) solid var(--q-border); border-radius: var(--q-r-md); padding: 10px; display: flex; flex-direction: column; gap: 2px; align-items: center; }
	.sizes-seg button.on { border: 2px solid var(--q-brand); background: var(--q-brand-soft); }
	.portion button { width: 34px; height: 30px; border-radius: 999px; display: grid; place-items: center; color: var(--q-muted); }
	.portion button.on { background: var(--q-brand); color: var(--q-on-brand); }
	.stepper button { width: 40px; height: 40px; display: grid; place-items: center; border-radius: calc(var(--q-btn-radius) - 2px); }
	.field { display: flex; flex-direction: column; gap: 4px; }
	.field input { min-height: 46px; border-radius: var(--q-r-md); border: var(--q-border-w) solid var(--q-border-strong); background: var(--q-field-bg); padding: 8px 12px; }
	.lbl { font-size: 13px; font-weight: 600; color: var(--q-text2); }
	.grow { flex: 1; }
	.btn:disabled { opacity: 0.6; cursor: not-allowed; }
	.solo { display: block; }
</style>
