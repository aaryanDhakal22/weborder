<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import Mascot from '$lib/components/Mascot.svelte';
	import ItemConfigurator from '$lib/components/ItemConfigurator.svelte';
	import { cart, type CartEntry } from '$lib/cart.svelte';
	import { t, tr } from '$lib/i18n';
	import { money, fromPrice } from '$lib/fmt';
	import { priceSelection } from '$lib/pricing';
	import type { DealPick, Item, Menu } from '$lib/types';

	let { data } = $props();
	const L = $derived(data.lang);
	const b = $derived(data.base);
	const D = $derived(data.deal);
	const T = (k: Parameters<typeof t>[1], v?: Record<string, string | number>) => t(L, k, v);

	let picks = $state<(CartEntry | null)[]>([]);
	let step = $state(0);
	let choosing = $state<Item | null>(null);
	let done = $state(false);
	$effect.pre(() => {
		if (picks.length !== data.slots.length) picks = data.slots.map(() => null);
	});

	const menuLike = $derived<Menu>({ categories: [{ id: '_', slug: '_', name: '', items: data.slots.flatMap((s) => s.items) }], groups: data.groups });
	const extras = $derived(picks.reduce((s, p, i) => (p && p.line.kind === 'item' ? s + priceSelection(menuLike, { itemId: p.line.itemId, sizeId: p.line.sizeId, opts: p.line.opts }, data.slots[i].includedOptions ?? 0).extrasCents : s), 0));
	const regular = $derived(picks.reduce((s, p) => (p && p.line.kind === 'item' ? s + priceSelection(menuLike, { itemId: p.line.itemId, sizeId: p.line.sizeId, opts: p.line.opts }).unitCents : s), 0));
	const total = $derived((D.priceCents ?? 0) + extras);
	const save = $derived(Math.max(0, (picks.every(Boolean) ? regular : (D.regularCents ?? regular)) - total));
	const filled = $derived(picks.filter(Boolean).length);
	const pct = $derived(Math.round(((filled + (choosing ? 0.5 : 0)) / Math.max(1, data.slots.length)) * 100));

	function choose(item: Item) {
		choosing = item;
	}
	function onpick(entry: CartEntry) {
		if (entry.line.kind !== 'item') return;
		picks[step] = entry;
		choosing = null;
		const next = picks.findIndex((p) => !p);
		if (next >= 0) step = next;
		else finish();
	}
	function finish() {
		const lines: DealPick[] = picks.map((p) => (p!.line.kind === 'item' ? { itemId: p!.line.itemId, sizeId: p!.line.sizeId, opts: p!.line.opts } : { itemId: '', opts: [] }));
		cart.add({ line: { kind: 'deal', dealId: D.id, picks: lines, qty: 1 }, name: D.name, mods: picks.map((p) => [p!.name, ...p!.mods].join(' · ')), unitCents: total });
		done = true;
	}
	function restart() {
		picks = data.slots.map(() => null);
		step = 0;
		done = false;
	}
	const fromLabel = (i: Item, sizes?: string[]) => money(i.sizes?.length ? Math.min(...i.sizes.filter((s) => !sizes?.length || sizes.includes(s.name)).map((s) => s.priceCents)) : fromPrice(i));
</script>

<svelte:head>
	<title>{data.title}</title>
	<meta name="description" content="{tr(D, 'desc', L)} {D.priceCents !== undefined ? money(D.priceCents) : ''}" />
	<link rel="canonical" href="{data.origin}{b}/deals/{D.slug}" />
	{@html `<script type="application/ld+json">${data.ld}</script>`}
</svelte:head>

<div class="backbar pad">
	<a class="btn btn-icon btn-ghost" href="{b}/deals" aria-label={T('back')}><Icon name="left" size={22} /></a>
	<h1>{tr(D, 'name', L)}</h1>
	{#if D.priceCents !== undefined}<span class="num big">{money(total)}</span>{/if}
</div>

{#if !D.live}
	<div class="pad"><div class="banner warn"><Icon name="clock" size={18} /><span class="grow">{L === 'es' ? 'Esta oferta no está disponible ahora mismo.' : "This deal isn't on right now."} {tr(D, 'desc', L)}</span></div></div>
{/if}

{#if D.kind === 'bundle'}
	{#if done}
		<div class="state celebrate" role="status">
			<div class="confetti" aria-hidden="true">{#each Array(22) as _, i (i)}<i style="left:{(i * 37) % 100}%;top:{8 + ((i * 53) % 46)}%;background:{['var(--q-brand)', 'var(--q-save)', 'var(--q-ok)', 'var(--q-info)'][i % 4]};transform:rotate({(i * 47) % 180}deg)"></i>{/each}</div>
			<Mascot pose="happy" size={180} />
			<h2>{T('dealDone')}</h2>
			<p>{tr(D, 'name', L)} · {T('savedYou', { m: money(save) })}</p>
			<div class="actions"><a class="btn btn-p btn-lg btn-block" href="{b}/cart">{T('viewOrder')}</a><button type="button" class="btn btn-lg btn-block" onclick={restart}>{L === 'es' ? 'Armar otro' : 'Build another'}</button></div>
		</div>
	{:else}
		<div class="pad progress-wrap">
			<div class="row-between"><span class="eyebrow">{T('step', { a: Math.min(filled + 1, data.slots.length), b: data.slots.length })}</span>{#if save > 0}<span class="savings"><Icon name="spark" size={16} stroke={2.5} /> {T('youSave')} <span class="num">{money(save)}</span></span>{/if}</div>
			<div class="progress" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100"><i style="width:{pct}%"></i></div>
		</div>
		<div class="pad two-col builder">
			<ol class="slots">
				{#each data.slots as s, i (i)}
					<li>
						<button type="button" class="slot" class:done={!!picks[i]} class:now={i === step} onclick={() => { step = i; choosing = null; }}>
							<span class="n">{#if picks[i]}<Icon name="check" size={18} stroke={3} />{:else}{i + 1}{/if}</span>
							<span class="txt"><span class="l1">{tr(s, 'label', L)}</span><span class="l2">{picks[i] ? [picks[i]!.name, ...picks[i]!.mods].join(' · ') : s.includedOptions ? (L === 'es' ? `${s.includedOptions} ingrediente incluido` : `${s.includedOptions} topping included`) : ''}</span></span>
							{#if picks[i]}<span class="change">{T('change')}</span>{/if}
						</button>
					</li>
				{/each}
			</ol>
			<div class="card picker">
				{#if choosing}
					<ItemConfigurator item={choosing} groups={data.groups} lang={L} freeOptions={data.slots[step].includedOptions ?? 0} allowedSizes={data.slots[step].eligible.sizes} submitLabel={filled + 1 >= data.slots.length && !picks[step] ? T('addDeal') : T('next')} onsubmit={onpick} onclose={() => (choosing = null)} />
				{:else}
					<div class="pick-head"><span class="eyebrow">{T('nowPicking')}</span><h2>{tr(data.slots[step], 'label', L)}</h2></div>
					<ul class="choices">
						{#each data.slots[step].items as i (i.id)}
							<li><button type="button" class="choice" onclick={() => choose(i)} disabled={data.live.soldOut.includes(i.id)}><span class="nm">{tr(i, 'name', L)}</span><span class="muted num">{data.live.soldOut.includes(i.id) ? T('soldOut') : (L === 'es' ? 'normal ' : 'usually ') + fromLabel(i, data.slots[step].eligible.sizes)}</span><Icon name="right" size={18} /></button></li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	{/if}
{:else}
	<div class="pad auto-deal">
		<p class="lead">{tr(D, 'desc', L)}</p>
		<p class="muted">{L === 'es' ? 'Se aplica sola en el carrito. Estos cuentan:' : 'It applies by itself in your cart. These count:'}</p>
		<ul class="choices">
			{#each data.extra as i (i.id)}<li><a class="choice" href="{b}/menu/{i.slug}"><span class="nm">{tr(i, 'name', L)}</span><span class="muted num">{money(fromPrice(i))}</span><Icon name="right" size={18} /></a></li>{/each}
		</ul>
	</div>
{/if}

<style>
	.backbar .big { font-size: 22px; font-weight: 700; }
	.progress-wrap { padding-top: 16px; padding-bottom: 16px; display: flex; flex-direction: column; gap: 12px; }
	.row-between { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; }
	.builder { padding-bottom: 32px; }
	.slots { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
	.slot { width: 100%; text-align: left; }
	.slot .txt { display: flex; flex-direction: column; }
	.change { font-weight: 600; font-size: 14px; color: var(--q-text2); }
	.picker { overflow: hidden; }
	.pick-head { padding: 16px 20px 6px; }
	.pick-head h2 { font-size: 24px; margin-top: 4px; }
	.choices { list-style: none; margin: 0; padding: 4px 8px 12px; }
	.choice { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 54px; padding: 8px 12px; border-radius: var(--q-r-md); text-align: left; }
	.choice:hover { background: var(--q-elev); }
	.choice .nm { flex: 1; font-weight: 600; }
	.choice:disabled { opacity: 0.5; }
	.celebrate { position: relative; min-height: 60vh; }
	.actions { display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 340px; }
	.auto-deal { padding-top: 16px; padding-bottom: 32px; display: flex; flex-direction: column; gap: 12px; max-width: 760px; }
	.auto-deal .lead { font-size: 20px; }
	.auto-deal .choices { padding: 0; }
</style>
