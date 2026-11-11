<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { pushState } from '$app/navigation';
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import Miso from '$lib/components/Miso.svelte';
	import placedArt from '$lib/miso/art/miso-placed.svg?raw';
	import receivedArt from '$lib/miso/art/miso-received.svg?raw';
	import cookingArt from '$lib/miso/art/miso-cooking.svg?raw';
	import readyArt from '$lib/miso/art/miso-ready.svg?raw';
	import outArt from '$lib/miso/art/miso-out.svg?raw';
	import doneArt from '$lib/miso/art/miso-done.svg?raw';
	import lostArt from '$lib/miso/art/miso-lost.svg?raw';
	import waveArt from '$lib/miso/art/miso-wave.svg?raw';
	import { t } from '$lib/i18n';
	import { clock } from '$lib/fmt';
	import type { OrderStatus, Track } from '$lib/types';

	let { data } = $props();
	const S = $derived(data.store);
	const L = $derived(data.lang);
	const T = (k: Parameters<typeof t>[1], v?: Record<string, string | number>) => t(L, k, v);
	let o = $state<Track>(untrack(() => data.track));
	let standalone = $state(true);
	// straight from Place order: Miso celebrates for a moment before the steps take over
	let fresh = $state(untrack(() => !!page.state.placed));

	onMount(() => {
		if (fresh) setTimeout(() => (fresh = false), 4200);
		standalone = matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
		if (o.status === 'completed' || o.status === 'cancelled') return;
		const es = new EventSource(`/api/track/${encodeURIComponent(data.token)}/events`);
		es.addEventListener('track', (e) => {
			o = JSON.parse((e as MessageEvent).data);
			if (o.status === 'completed' || o.status === 'cancelled') es.close();
		});
		return () => es.close();
	});

	const deliv = $derived(o.type === 'delivery');
	// The steps this order goes through (a scheduled order starts as scheduled).
	const flow = $derived<OrderStatus[]>([o.steps.some((s) => s.status === 'scheduled') || o.status === 'scheduled' ? 'scheduled' : 'received', 'accepted', 'ready', ...(deliv ? (['on_delivery'] as const) : []), 'completed']);
	const rank = (s: OrderStatus) => flow.indexOf(s);
	const now = $derived(o.status === 'cancelled' ? -1 : Math.max(rank(o.status), 0));
	const at = (s: OrderStatus) => o.steps.findLast((x) => x.status === s)?.at ?? null;
	const due = $derived(o.status === 'scheduled' || (o.promised_at && !o.estimated_ready_at) ? o.promised_at : o.estimated_ready_at);
	// the tracking steps always show Miso
	const art = $derived(
		fresh && (o.status === 'received' || o.status === 'scheduled') ? placedArt
		: o.status === 'cancelled' ? lostArt
		: o.status === 'completed' ? doneArt
		: o.status === 'on_delivery' ? outArt
		: o.status === 'ready' ? readyArt
		: o.status === 'accepted' ? cookingArt
		: receivedArt
	);
	const label = (s: OrderStatus): string => {
		switch (s) {
			case 'scheduled': return T('scheduled');
			case 'received': return T('received');
			case 'accepted': return T('accepted');
			case 'ready': return deliv ? T('readyOut') : T('ready');
			case 'on_delivery': return T('out');
			case 'completed': return deliv ? T('done') : T('doneP');
			default: return s;
		}
	};
	const sub = (s: OrderStatus): string => {
		switch (s) {
			case 'scheduled': return o.promised_at ? T('scheduledFor', { t: clock(o.promised_at, S.timezone) }) : '';
			case 'received': return T('receivedSub');
			case 'accepted': return o.kitchen_number ? T('acceptedSub', { n: o.kitchen_number }) : T('cookingSub');
			case 'ready': return deliv ? T('readyOutSub') : T('readySub');
			case 'on_delivery': return o.driver ? T('onTheWay', { n: o.driver.first_name }) : T('outSub');
			default: return '';
		}
	};
	const initial = $derived(S.name.replace(/[^A-Za-z]/g, '').slice(0, 1));
</script>

<svelte:head>
	<title>{T('orderNo')}{o.kitchen_number ? ` #${o.kitchen_number}` : ''} · {S.name}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="backbar pad"><h1>{o.status === 'cancelled' ? T('cancelledTitle') : T('thanks')}</h1></div>
<div class="pad track-grid">
	<div class="col">
		<div class="track-hero card">
			<Miso {art} size={150} decorative />
			<div class="kitchen-no"><small>{T('orderNo')}</small>{o.kitchen_number ? `#${o.kitchen_number}` : '—'}</div>
			{#if o.status === 'cancelled'}<div class="eta">{T('cancelledSub')}</div>
			{:else if o.status === 'completed'}<div class="eta"><b>{deliv ? T('done') : T('doneP')}</b></div>
			{:else if due}<div class="eta">{deliv ? T('arrives') : T('readyAt')} <b>{clock(due, S.timezone)}</b></div>
			{:else if o.status === 'received' || o.status === 'scheduled'}<div class="eta">{T('waitingAccept')}</div>{/if}
			{#if o.driver && o.status === 'on_delivery'}<div class="driver"><Icon name="scooter" size={18} /> {T('onTheWay', { n: o.driver.first_name })}</div>{/if}
		</div>
		{#if o.status !== 'cancelled'}
			<ol class="card stages" aria-live="polite">
				{#each flow as s, i (s)}
					<li class="stage" class:done={i < now || o.status === 'completed'} class:now={i === now && o.status !== 'completed'} class:todo={i > now}>
						<span class="dot">{#if i < now || o.status === 'completed'}<Icon name="check" size={14} stroke={3} />{/if}</span>
						<div><div class="l1">{label(s)}</div>{#if i <= now && sub(s)}<div class="l2">{sub(s)}</div>{/if}</div>
						<span class="tm">{clock(at(s), S.timezone)}</span>
					</li>
				{/each}
			</ol>
		{/if}
	</div>
	<div class="col">
		{#if !standalone}
			<div class="card install">
				<span class="appicon" aria-hidden="true">{initial}</span>
				<div class="grow"><b>{T('homeScreen', { s: S.name })}</b><p class="t2">{T('homeScreenSub')}</p></div>
				<button type="button" class="btn btn-sm btn-p" onclick={() => pushState('', { install: true })}>{T('showMe')}</button>
			</div>
		{/if}
		<p class="muted small">{T('trackSaved')}</p>
	</div>
</div>

{#if page.state.install}
	<div class="scrim" onclick={() => history.back()} role="presentation"></div>
	<div class="sheet" role="dialog" aria-modal="true" aria-label={T('installTitle', { s: S.name })}>
		<div class="grab"></div>
		<div class="sheet-body inst">
			<div class="inst-head"><span class="appicon big" aria-hidden="true">{initial}</span><div><span class="eyebrow">{T('installFree')}</span><h2>{T('installTitle', { s: S.name })}</h2></div></div>
			<ol class="steps">
				<li class="slot"><span class="n">1</span><span class="txt"><span class="l1">{T('share')}</span><span class="l2">{T('shareSub')}</span></span><Icon name="share" size={24} /></li>
				<li class="slot"><span class="n">2</span><span class="txt"><span class="l1">{T('addHome')}</span><span class="l2">{T('addHomeSub')}</span></span><Icon name="addsq" size={24} /></li>
			</ol>
			<div class="android">{#if S.look.miso.pages}<Miso art={waveArt} size={84} decorative />{/if}<p class="t2">{T('androidNote')}</p></div>
		</div>
		<div class="sheet-foot"><button type="button" class="btn btn-p btn-lg grow" onclick={() => history.back()}>{T('gotIt')}</button></div>
	</div>
{/if}

<style>
	.col { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
	.track-hero { padding: 24px; }
	.driver { display: flex; gap: 8px; align-items: center; font-weight: 700; margin-top: 8px; }
	.stages { list-style: none; margin: 0; padding: 20px; }
	.install { padding: 16px; display: flex; gap: 14px; align-items: center; }
	.install p { font-size: 14px; margin-top: 2px; }
	.appicon { width: 56px; height: 56px; border-radius: 13px; background: var(--q-brand); color: var(--q-on-brand); display: grid; place-items: center; font: var(--q-display-weight) 26px/1 var(--q-font-display); text-transform: var(--q-display-case); flex-shrink: 0; }
	.appicon.big { width: 64px; height: 64px; font-size: 30px; }
	.grow { flex: 1; min-width: 0; }
	.small { font-size: 13px; }
	.inst { padding: 8px 20px 4px; gap: 14px; }
	.inst-head { display: flex; gap: 14px; align-items: center; }
	.inst-head h2 { font-size: 28px; margin-top: 4px; }
	.steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
	.steps .slot :global(svg) { color: var(--q-brand-ink); }
	.txt { display: flex; flex-direction: column; flex: 1; }
	.android { display: flex; gap: 12px; align-items: center; }
	.android p { font-size: 14px; }
</style>
