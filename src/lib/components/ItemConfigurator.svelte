<!-- Configures one item: a choice (merged items), size, option groups (with halves), notes and
     quantity. Priced with main's engine copy, so the number shown is the number main quotes. -->
<script lang="ts">
	import Icon from './Icon.svelte';
	import Portion from './Portion.svelte';
	import PizzaPie from './PizzaPie.svelte';
	import ItemTile from './ItemTile.svelte';
	import type { CartEntry, Context, Lang, Menu, MenuGroup, MenuItem, Pick, Portion as P } from '$lib/types';
	import { groupsOf, optionPrice, priceLine, sizeShort } from '$lib/menu';
	import { money } from '$lib/fmt';
	import { t } from '$lib/i18n';

	let {
		item,
		menu,
		ctx,
		lang,
		soldOut = false,
		allowedSizes,
		submitLabel,
		onsubmit,
		onclose,
		headingTag = 'h2',
		showQty = true,
		showTile = false
	}: {
		item: MenuItem;
		menu: Menu;
		ctx: Context;
		lang: Lang;
		soldOut?: boolean;
		/** Size ids a deal slot allows (empty = any). */
		allowedSizes?: string[] | null;
		submitLabel?: string;
		onsubmit: (entry: CartEntry) => void;
		onclose?: () => void;
		headingTag?: 'h1' | 'h2';
		showQty?: boolean;
		showTile?: boolean;
	} = $props();

	const T = (k: Parameters<typeof t>[1], v?: Record<string, string | number>) => t(lang, k, v);
	const groups = $derived(groupsOf(menu, item));
	const choices = $derived((item.choices ?? []).filter((c) => !c.sold_out));
	let choiceId = $state<string | undefined>(undefined);
	const choice = $derived(choices.find((c) => c.item_id === choiceId));
	const baseSizes = $derived(choice ? choice.sizes : item.sizes);
	const sizes = $derived(baseSizes.filter((s) => !allowedSizes?.length || allowedSizes.includes(s.size_id)));
	let sizeId = $state<string | undefined>(undefined);
	let picks = $state<Pick[]>([]);
	let qty = $state(1);
	let note = $state('');

	// Reset when the item changes (the sheet is reused for another item).
	let lastItem = '';
	$effect.pre(() => {
		if (item.id === lastItem) return;
		lastItem = item.id;
		choiceId = choices[0]?.item_id;
		const ss = (choices[0]?.sizes ?? item.sizes).filter((s) => !allowedSizes?.length || allowedSizes.includes(s.size_id));
		sizeId = ss[0]?.size_id;
		picks = groups.flatMap((g) => g.options.filter((o) => o.is_default && !o.sold_out).map((o) => ({ group_id: g.id, option_id: o.id, ...(g.portions ? { portion: 'whole' } : {}) })));
		qty = 1;
		note = '';
	});
	// A size the new choice doesn't have: take its first.
	$effect.pre(() => {
		if (sizes.length && !sizes.some((s) => s.size_id === sizeId)) sizeId = sizes[0].size_id;
		if (!sizes.length) sizeId = undefined;
	});

	const line = $derived({ item_id: item.id, ...(choiceId ? { choice_id: choiceId } : {}), ...(sizeId ? { size_id: sizeId } : {}), options: picks, qty, ...(note.trim() ? { note: note.trim() } : {}) });
	const priced = $derived(priceLine(ctx, line));
	const need = (g: MenuGroup) => Math.max(g.min_select, g.required ? 1 : 0);
	const count = (g: MenuGroup) => picks.filter((p) => p.group_id === g.id).length;
	const missing = $derived(groups.find((g) => count(g) < need(g)));
	const isPizza = $derived(groups.some((g) => g.portions));
	const single = (g: MenuGroup) => g.max_select === 1;
	const toppings = $derived(
		groups.filter((g) => g.portions).flatMap((g) => picks.filter((p) => p.group_id === g.id).map((p) => ({ id: p.option_id, name: g.options.find((o) => o.id === p.option_id)?.name ?? '', p: (p.portion || 'whole') as P })))
	);

	const picked = (g: MenuGroup, o: string) => picks.find((p) => p.group_id === g.id && p.option_id === o);
	function toggle(g: MenuGroup, o: string) {
		if (single(g)) {
			const was = picked(g, o);
			picks = [...picks.filter((p) => p.group_id !== g.id), ...(was && need(g) === 0 ? [] : [{ group_id: g.id, option_id: o }])];
			return;
		}
		if (picked(g, o)) picks = picks.filter((p) => !(p.group_id === g.id && p.option_id === o));
		else if (!g.max_select || count(g) < g.max_select) picks = [...picks, { group_id: g.id, option_id: o, ...(g.portions ? { portion: 'whole' } : {}) }];
	}
	function setPortion(g: MenuGroup, o: string, portion: P) {
		picks = picks.map((x) => (x.group_id === g.id && x.option_id === o ? { ...x, portion } : x));
	}
	const rule = (g: MenuGroup) => (need(g) && single(g) ? T('pick', { n: 1 }) : g.max_select ? T('upTo', { n: g.max_select }) : T('pickAny'));

	function submit() {
		if (missing || soldOut || priced.error) return;
		const mods = note.trim() ? [...priced.mods, `“${note.trim()}”`] : priced.mods;
		onsubmit({ line: JSON.parse(JSON.stringify(line)), name: priced.name || item.name, mods, unitCents: priced.unit });
	}
</script>

<div class="cfg">
	<div class="cfg-head">
		{#if showTile && !isPizza}<ItemTile name={item.name} small />{/if}
		<div class="grow">
			<svelte:element this={headingTag} class="cfg-title">{item.name}</svelte:element>
			{#if item.description}<p class="t2 cfg-desc">{item.description}</p>{/if}
			{#if isPizza}<p class="muted cfg-desc">{T('toppingsHint')}</p>{/if}
		</div>
		{#if onclose}<button type="button" class="btn btn-icon btn-ghost" onclick={onclose} aria-label={T('close')}><Icon name="x" size={22} /></button>{/if}
	</div>

	<div class="builder-cols" class:solo={!isPizza}>
		{#if isPizza || sizes.length > 1 || choices.length > 1}
			<div class="pizza-top">
				{#if isPizza}<PizzaPie {toppings} />{/if}
				{#if choices.length > 1}
					<fieldset class="grp">
						<legend class="grp-h"><h3 class="grp-name">{T('choose')}</h3><span class="rule"><span class="req">{T('required')}</span></span></legend>
						{#each choices as c (c.item_id)}
							<div class="opt">
								<button type="button" class="opt-main" role="radio" aria-checked={choiceId === c.item_id} onclick={() => (choiceId = c.item_id)}>
									<span class="radio" class:on={choiceId === c.item_id}></span><span class="nm">{c.name}</span>
								</button>
							</div>
						{/each}
					</fieldset>
				{/if}
				{#if sizes.length > 1}
					<div class="sizes-seg" role="radiogroup" aria-label={T('size')}>
						{#each sizes as s (s.size_id)}
							{@const short = sizeShort(menu, s.size_id, s.name)}
							<button type="button" role="radio" aria-checked={sizeId === s.size_id} class:on={sizeId === s.size_id} onclick={() => (sizeId = s.size_id)}>
								<span class="s1">{short}</span>{#if short !== s.name}<span class="s2">{s.name.replace(short, '').trim()}</span>{/if}<span class="s3 num">{money(s.price_cents)}</span>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
		<div>
			{#each groups as g (g.id)}
				<fieldset class="grp">
					<legend class="grp-h"><h3 class="grp-name">{g.name}</h3><span class="rule">{#if need(g)}<span class="req">{T('required')}</span> · {/if}{rule(g)}</span></legend>
					{#each g.options as o (o.id)}
						{@const on = picked(g, o.id)}
						{@const p = optionPrice(o, sizeId)}
						<div class="opt" class:off={o.sold_out}>
							<button type="button" class="opt-main" role={single(g) ? 'radio' : 'checkbox'} aria-checked={!!on} disabled={o.sold_out && !on} onclick={() => toggle(g, o.id)}>
								<span class={single(g) ? 'radio' : 'check'} class:on={!!on}>{#if on && !single(g)}<Icon name="check" size={14} stroke={3} />{/if}</span>
								<span class="nm">{o.name}{#if o.sold_out} <span class="tag tag-brand">{T('soldOut')}</span>{/if}</span>
							</button>
							{#if g.portions && on}
								<span class="portion" role="radiogroup" aria-label="{o.name}: {T('whole')} / {T('left')} / {T('right')}">
									{#each ['left', 'whole', 'right'] as const as k (k)}
										<button type="button" role="radio" aria-checked={(on.portion || 'whole') === k} aria-label={T(k)} class:on={(on.portion || 'whole') === k} onclick={() => setPortion(g, o.id, k)}><Portion kind={k} /></button>
									{/each}
								</span>
							{/if}
							<span class="pr">{p ? '+' + money(p) : ''}</span>
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
	{#if showQty}
		<span class="stepper">
			<button type="button" aria-label={T('less')} onclick={() => (qty = Math.max(1, qty - 1))}><Icon name="minus" size={18} /></button>
			<b aria-live="polite">{qty}</b>
			<button type="button" aria-label={T('more')} onclick={() => (qty = Math.min(50, qty + 1))}><Icon name="plus" size={18} /></button>
		</span>
	{/if}
	<button type="button" class="btn btn-p btn-lg grow" disabled={!!missing || soldOut || !!priced.error} onclick={submit}>
		<span class="split"><span>{soldOut ? T('soldOut') : missing ? `${T('pick', { n: need(missing) })}: ${missing.name}` : (submitLabel ?? T('addToOrder'))}</span>{#if !soldOut && showQty}<span class="num">{money(priced.unit * qty)}</span>{/if}</span>
	</button>
</div>

<style>
	.cfg { display: flex; flex-direction: column; flex: 1 0 auto; }
	.cfg-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding: 16px 20px 6px; }
	.grow { flex: 1; min-width: 0; }
	.cfg-title { font-size: 32px; margin-top: 6px; }
	.cfg-desc { font-size: 15px; margin-top: 6px; }
	.grp { border: 0; margin: 0; min-width: 0; }
	.grp-h { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; width: 100%; padding: 0; }
	.grp-name { font-size: 20px; }
	.opt-main { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; min-height: 46px; text-align: left; }
	.opt.off { opacity: 0.55; }
	.sizes-seg button { border: var(--q-border-w) solid var(--q-border); border-radius: var(--q-r-md); padding: 10px; display: flex; flex-direction: column; gap: 2px; align-items: center; }
	.sizes-seg button.on { border: 2px solid var(--q-brand); background: var(--q-brand-soft); }
	.portion button { width: 34px; height: 30px; border-radius: 999px; display: grid; place-items: center; color: var(--q-muted); }
	.portion button.on { background: var(--q-brand); color: var(--q-on-brand); }
	.stepper button { width: 40px; height: 40px; display: grid; place-items: center; border-radius: calc(var(--q-btn-radius) - 2px); }
	.field { display: flex; flex-direction: column; gap: 4px; }
	.field input { min-height: 46px; border-radius: var(--q-r-md); border: var(--q-border-w) solid var(--q-border-strong); background: var(--q-field-bg); padding: 8px 12px; }
	.lbl { font-size: 13px; font-weight: 600; color: var(--q-text2); }
	.btn:disabled { opacity: 0.6; cursor: not-allowed; }
	.solo { display: block; }
</style>
