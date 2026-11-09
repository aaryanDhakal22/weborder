<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import Miso from '$lib/components/Miso.svelte';
	import doneArt from '$lib/miso/art/miso-done.svg?raw';
	import ItemConfigurator from '$lib/components/ItemConfigurator.svelte';
	import { cart } from '$lib/cart.svelte';
	import { t } from '$lib/i18n';
	import { money } from '$lib/fmt';
	import { contextOf, eligibleItems, fromPrice } from '$lib/menu';
	import { live, price } from '$lib/engine';
	import type { CartEntry, Line, MenuItem } from '$lib/types';

	let { data } = $props();
	const L = $derived(data.lang);
	const b = $derived(data.base);
	const S = $derived(data.store);
	const D = $derived(S.deals.find((d) => d.id === data.dealId)!);
	const ctx = $derived(contextOf(S));
	const T = (k: Parameters<typeof t>[1], v?: Record<string, string | number>) => t(L, k, v);
	const soldOut = $derived(data.status?.sold_out ?? []);
	const isOn = $derived(live(D, S.timezone, new Date(), ''));
	const slots = $derived((D.slots ?? []).map((s) => ({ ...s, items: eligibleItems(S, s.eligible) })));
	const counts = $derived(D.kind === 'bundle' ? [] : eligibleItems(S, D.eligible));

	let picks = $state<(CartEntry | null)[]>([]);
	let step = $state(0);
	let choosing = $state<MenuItem | null>(null);
	let done = $state(false);
	$effect.pre(() => {
		if (picks.length !== slots.length) picks = slots.map(() => null);
	});

	// A bundle line names the deal and one pick per step (main's CartLine needs no item_id here).
	const bundleLine = $derived({ deal_id: D.id, qty: 1, picks: picks.map((p) => (p ? { item_id: p.line.item_id, choice_id: p.line.choice_id, size_id: p.line.size_id, options: p.line.options } : { item_id: '' })) } as unknown as Line);
	const total = $derived(picks.every(Boolean) && picks.length ? (price(ctx, { type: cart.fulfil, lines: [bundleLine] }, new Date()).lines[0]?.unit_cents ?? D.price_cents ?? 0) : (D.price_cents ?? 0));
	const regular = $derived(picks.reduce((s, p) => s + (p?.unitCents ?? 0), 0));
	const save = $derived(picks.every(Boolean) ? Math.max(0, regular - total) : 0);
	const filled = $derived(picks.filter(Boolean).length);
	const pct = $derived(Math.round(((filled + (choosing ? 0.5 : 0)) / Math.max(1, slots.length)) * 100));

	function onpick(entry: CartEntry) {
		picks[step] = entry;
		choosing = null;
		const next = picks.findIndex((p) => !p);
		if (next >= 0) step = next;
		else finish();
	}
	function finish() {
		cart.add({ line: JSON.parse(JSON.stringify(bundleLine)), name: D.name, mods: picks.map((p) => [p!.name, ...p!.mods].join(' · ')), unitCents: total });
		done = true;
	}
	function restart() {
		picks = slots.map(() => null);
		step = 0;
		done = false;
	}
</script>

<svelte:head>
	<title>{data.title}</title>
	<meta name="description" content="{D.description || D.name}{D.price_cents ? ` ${money(D.price_cents)}` : ''}" />
	<link rel="canonical" href="{data.origin}{b}/deals/{D.id}" />
	{@html `<script type="application/ld+json">${data.ld}</script>`}
</svelte:head>

<div class="backbar pad">
	<a class="btn btn-icon btn-ghost" href="{b}/deals" aria-label={T('back')}><Icon name="left" size={22} /></a>
	<h1>{D.name}</h1>
	{#if D.kind === 'bundle' && D.price_cents}<span class="num big">{money(total)}</span>{/if}
</div>

{#if !isOn}
	<div class="pad"><div class="banner warn"><Icon name="clock" size={18} /><span class="grow">{T('dealOff')}</span></div></div>
{/if}

{#if D.kind === 'bundle'}
	{#if done}
		<div class="state celebrate" role="status">
			<div class="confetti" aria-hidden="true">{#each Array(22) as _, i (i)}<i style="left:{(i * 37) % 100}%;top:{8 + ((i * 53) % 46)}%;background:{['var(--q-brand)', 'var(--q-save)', 'var(--q-ok)', 'var(--q-info)'][i % 4]};transform:rotate({(i * 47) % 180}deg)"></i>{/each}</div>
			{#if S.look.miso.pages}<Miso art={doneArt} size={170} decorative />{/if}
			<h2>{T('dealDone')}</h2>
			<p>{D.name}{#if save} · {T('savedYou', { m: money(save) })}{/if}</p>
			<div class="actions"><a class="btn btn-p btn-lg btn-block" href="{b}/cart">{T('viewOrder')}</a><button type="button" class="btn btn-lg btn-block" onclick={restart}>{T('buildAnother')}</button></div>
		</div>
	{:else}
		<div class="pad progress-wrap">
			<div class="row-between"><span class="eyebrow">{T('step', { a: Math.min(filled + 1, slots.length), b: slots.length })}</span>{#if save > 0}<span class="savings"><Icon name="spark" size={16} stroke={2.5} /> {T('youSave')} <span class="num">{money(save)}</span></span>{/if}</div>
			<div class="progress" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100"><i style="width:{pct}%"></i></div>
		</div>
		<div class="pad two-col builder">
			<ol class="slots">
				{#each slots as s, i (i)}
					<li>
						<button type="button" class="slot" class:done={!!picks[i]} class:now={i === step} onclick={() => { step = i; choosing = null; }}>
							<span class="n">{#if picks[i]}<Icon name="check" size={18} stroke={3} />{:else}{i + 1}{/if}</span>
							<span class="txt"><span class="l1">{s.label}</span><span class="l2">{picks[i] ? [picks[i]!.name, ...picks[i]!.mods].join(' · ') : s.included_options ? T('included', { n: s.included_options }) : ''}</span></span>
							{#if picks[i]}<span class="change">{T('change')}</span>{/if}
						</button>
					</li>
				{/each}
			</ol>
			<div class="card picker">
				{#if choosing}
					<ItemConfigurator item={choosing} menu={S.menu} {ctx} lang={L} allowedSizes={slots[step].eligible.sizes} showQty={false} submitLabel={filled + 1 >= slots.length && !picks[step] ? T('addDeal') : T('next')} onsubmit={onpick} onclose={() => (choosing = null)} />
				{:else if slots[step]}
					<div class="pick-head"><span class="eyebrow">{T('nowPicking')}</span><h2>{slots[step].label}</h2></div>
					<ul class="choices">
						{#each slots[step].items as i (i.id)}
							{@const out = i.sold_out || soldOut.includes(i.id)}
							<li><button type="button" class="choice" onclick={() => (choosing = i)} disabled={out}><span class="nm">{i.name}</span><span class="muted num">{out ? T('soldOut') : `${T('usually')} ${money(fromPrice(i))}`}</span><Icon name="right" size={18} /></button></li>
						{:else}
							<li class="muted">{T('nothingFits')}</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	{/if}
{:else}
	<div class="pad auto-deal">
		{#if D.description}<p class="lead">{D.description}</p>{/if}
		{#if D.kind === 'code' && D.code}
			<div class="banner info"><Icon name="tag" size={18} /><span class="grow">{T('useCode', { c: D.code })}{#if D.min_subtotal_cents} · {T('minSubtotal', { m: money(D.min_subtotal_cents) })}{/if}</span></div>
		{:else}
			<p class="muted">{T('appliesItself')}</p>
		{/if}
		{#if counts.length}
			<ul class="choices">
				{#each counts as i (i.id)}<li><a class="choice" href="{b}/menu/{i.slug}"><span class="nm">{i.name}</span><span class="muted num">{money(fromPrice(i))}</span><Icon name="right" size={18} /></a></li>{/each}
			</ul>
		{/if}
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
