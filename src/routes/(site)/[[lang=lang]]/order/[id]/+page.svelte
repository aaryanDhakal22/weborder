<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { pushState } from '$app/navigation';
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import Mascot from '$lib/components/Mascot.svelte';
	import { t } from '$lib/i18n';
	import { money, clock } from '$lib/fmt';
	import type { OrderStatus, OrderView } from '$lib/types';

	let { data } = $props();
	const S = $derived(data.store);
	const L = $derived(data.lang);
	const T = (k: Parameters<typeof t>[1], v?: Record<string, string | number>) => t(L, k, v);
	let o = $state<OrderView>(untrack(() => data.order));
	let standalone = $state(true);

	onMount(() => {
		standalone = matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
		if (o.status === 'done' || o.status === 'cancelled') return;
		const es = new EventSource(`/api/orders/${o.publicId}/events`);
		es.addEventListener('status', (e) => (o = JSON.parse((e as MessageEvent).data)));
		return () => es.close();
	});

	const pose = $derived(({ received: 'ticket', accepted: 'ticket', cooking: 'dough', ready: 'wave', out: 'scooter', done: 'happy', cancelled: 'lost' } as const)[o.status]);
	const LABEL: Record<OrderStatus, [Parameters<typeof t>[1], Parameters<typeof t>[1]]> = {
		received: ['received', 'receivedSub'], accepted: ['accepted', 'acceptedSub'], cooking: ['cooking', 'cookingSub'],
		ready: ['ready', 'readySub'], out: ['out', 'outSub'], done: ['done', 'done'], cancelled: ['closed', 'closed']
	};
	const idx = $derived(o.stages.findIndex((s) => s.status === o.status));
	const due = $derived(o.fulfil === 'delivery' ? o.arrivesBy : o.readyBy);
	const paidLabel = $derived(o.payment.method === 'cash' ? T('due') : T('paid'));
</script>

<svelte:head>
	<title>{T('orderNo')} #{o.kitchenNo} · {S.name}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="backbar pad"><h1>{T('thanks')}</h1></div>
<div class="pad track-grid">
	<div class="col">
		<div class="track-hero card">
			<Mascot {pose} size={150} />
			<div class="kitchen-no"><small>{T('orderNo')}</small>#{o.kitchenNo || '—'}</div>
			{#if o.status !== 'done'}<div class="eta">{o.fulfil === 'delivery' ? T('arrives') : T('readyAt')} <b>{clock(due, S.timezone)}</b></div>{:else}<div class="eta"><b>{o.fulfil === 'delivery' ? T('done') : T('doneP')}</b></div>{/if}
		</div>
		<ol class="card stages" aria-live="polite">
			{#each o.stages as st, i (st.status)}
				{@const [a, sub] = LABEL[st.status]}
				<li class="stage" class:done={i < idx || o.status === 'done'} class:now={i === idx && o.status !== 'done'} class:todo={i > idx}>
					<span class="dot">{#if i < idx || o.status === 'done'}<Icon name="check" size={14} stroke={3} />{/if}</span>
					<div><div class="l1">{st.status === 'done' && o.fulfil === 'pickup' ? T('doneP') : T(a)}</div><div class="l2">{st.status === 'accepted' ? T('acceptedSub', { n: o.kitchenNo }) : st.status === 'done' ? (o.fulfil === 'delivery' ? `${T('arrives')} ${clock(due, S.timezone)}` : '') : T(sub)}</div></div>
					<span class="tm">{clock(st.at, S.timezone)}</span>
				</li>
			{/each}
		</ol>
	</div>
	<div class="col">
		{#if !standalone}
			<div class="card install">
				<span class="appicon" aria-hidden="true">{S.name.replace(/[^A-Za-z]/g, '').slice(0, S.slug === 'lumbre' ? 2 : 1)}</span>
				<div class="grow"><b>{T('homeScreen', { s: S.name })}</b><p class="t2">{T('homeScreenSub')}</p></div>
				<button type="button" class="btn btn-sm btn-p" onclick={() => pushState('', { install: true })}>{T('showMe')}</button>
			</div>
		{/if}
		<div class="card receipt">
			<h2>{T('receipt')}</h2>
			<ul>{#each data.lines as l (l.index)}<li class="line"><span class="qty">{l.qty}</span><div class="txt"><span class="nm">{l.name}</span>{#if l.mods.length}<span class="mods">{l.mods.join(' · ')}</span>{/if}</div><span class="pr num">{money(l.totalCents)}</span></li>{/each}</ul>
			<div class="totals">
				{#each o.quote.discounts as d (d.label)}<div class="disc"><span>{d.label}</span><span class="num">−{money(d.amountCents)}</span></div>{/each}
				<div class="grand"><span>{paidLabel}</span><span class="num">{money(o.quote.totalCents)}</span></div>
			</div>
			<span class="muted small">{o.payment.method === 'card' ? `${T('card')} •••• ${o.payment.last4}` : o.fulfil === 'delivery' ? T('cashDriver') : T('cashPickup')}</span>
		</div>
		<div class="card call"><Icon name="phone" /><span class="grow">{T('callStore')} <a class="num" href="tel:{S.phone.replace(/\D/g, '')}">{S.phone}</a></span></div>
	</div>
</div>

{#if page.state.install}
	<div class="scrim" onclick={() => history.back()} role="presentation"></div>
	<div class="sheet" role="dialog" aria-modal="true" aria-label={T('installTitle', { s: S.name })}>
		<div class="grab"></div>
		<div class="sheet-body inst">
			<div class="inst-head"><span class="appicon big" aria-hidden="true">{S.name.replace(/[^A-Za-z]/g, '').slice(0, S.slug === 'lumbre' ? 2 : 1)}</span><div><span class="eyebrow">{T('installFree')}</span><h2>{T('installTitle', { s: S.name })}</h2></div></div>
			<ol class="steps">
				<li class="slot"><span class="n">1</span><span class="txt"><span class="l1">{T('share')}</span><span class="l2">{T('shareSub')}</span></span><Icon name="share" size={24} /></li>
				<li class="slot"><span class="n">2</span><span class="txt"><span class="l1">{T('addHome')}</span><span class="l2">{T('addHomeSub')}</span></span><Icon name="addsq" size={24} /></li>
				<li class="slot"><span class="n">3</span><span class="txt"><span class="l1">{T('openAlerts', { s: S.name })}</span><span class="l2">{T('openAlertsSub')}</span></span><Icon name="bell" size={24} /></li>
			</ol>
			<div class="android"><Mascot pose="wave" size={84} /><p class="t2">{T('androidNote')}</p></div>
		</div>
		<div class="sheet-foot"><button type="button" class="btn btn-p btn-lg grow" onclick={() => history.back()}>{T('gotIt')}</button></div>
	</div>
{/if}

<style>
	.col { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
	.track-hero { padding: 24px; }
	.stages { list-style: none; margin: 0; padding: 20px; }
	.install { padding: 16px; display: flex; gap: 14px; align-items: center; }
	.install p { font-size: 14px; margin-top: 2px; }
	.appicon { width: 56px; height: 56px; border-radius: 13px; background: var(--q-brand); color: var(--q-on-brand); display: grid; place-items: center; font: var(--q-display-weight) 26px/1 var(--q-font-display); text-transform: var(--q-display-case); flex-shrink: 0; }
	.appicon.big { width: 64px; height: 64px; font-size: 30px; }
	.grow { flex: 1; min-width: 0; }
	.receipt { padding: 20px; display: flex; flex-direction: column; gap: 6px; }
	.receipt h2 { font-size: 22px; }
	.receipt ul { list-style: none; margin: 0; padding: 0; }
	.call { padding: 16px 20px; display: flex; gap: 12px; align-items: center; }
	.call a { font-weight: 700; }
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
