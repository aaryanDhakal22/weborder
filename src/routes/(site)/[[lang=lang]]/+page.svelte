<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import DealCard from '$lib/components/DealCard.svelte';
	import FoodArt from '$lib/components/FoodArt.svelte';
	import HoursCard from '$lib/components/HoursCard.svelte';
	import { cart } from '$lib/cart.svelte';
	import { t, tr } from '$lib/i18n';
	import { money, fromPrice } from '$lib/fmt';

	let { data } = $props();
	const S = $derived(data.store);
	const L = $derived(data.lang);
	const b = $derived(data.base);
	const header = $derived(data.customHtml ? 'custom' : data.theme.layout.header);
	const photoTiles = $derived(data.theme.layout.menu === 'photo');
	const T = (k: Parameters<typeof t>[1], v?: Record<string, string | number>) => t(L, k, v);
	const desc = $derived(`${data.copy.tagline} ${S.settings.delivery ? (L === 'es' ? 'Pide en línea para entrega o para llevar.' : 'Order online for delivery or pickup.') : L === 'es' ? 'Pide en línea para recoger.' : 'Order online for pickup.'}`);
</script>

<svelte:head>
	<title>{data.title}</title>
	<meta name="description" content={desc} />
	<link rel="canonical" href={data.origin + (b || '/')} />
	<meta property="og:title" content={data.title} />
	<meta property="og:description" content={desc} />
	<meta property="og:type" content="restaurant.restaurant" />
	<meta property="og:url" content={data.origin + (b || '/')} />
</svelte:head>

{#if header === 'custom'}
	<div class="chtml">{@html data.customHtml}</div>
{:else if header === 'cover'}
	<div class="pad cover-wrap">
		<div class="cover">
			<FoodArt art="croissant" />
			<div class="cover-text">
				<span class="eyebrow">{data.copy.eyebrow}</span>
				<h1>{data.copy.headline}</h1>
				<p>{data.copy.lead}</p>
				<div><a class="btn btn-p btn-lg cover-cta" href="{b}/menu">{S.settings.delivery ? T('startOrder') : T('orderPickup')}</a></div>
			</div>
		</div>
	</div>
	<div class="pad status-row">
		<div class="status-line">
			{#if data.live.open}<span class="open">{T('openNow')}</span>{:else}<span class="closed">{T('closed')}</span>{/if}
			{#if S.settings.pickup}<span class="num">{T('pickup')} ~{data.live.eta.pickup} {T('minutes')}</span>{/if}
			{#if S.settings.delivery}<span class="num">{T('delivery')} ~{data.live.eta.delivery} {T('minutes')}</span>{/if}
		</div>
	</div>
{:else}
	<section class="hero pad">
		<div class="lava" aria-hidden="true"><i style="width:280px;height:280px;right:-60px;top:20px;background:var(--q-brand)"></i><i style="width:200px;height:200px;left:30%;top:-80px;background:var(--q-warn);opacity:.18"></i></div>
		<div class="hero-copy">
			<span class="eyebrow">{data.copy.eyebrow}</span>
			<h1>{data.copy.headline}</h1>
			<p class="lead">{data.copy.lead}</p>
			<div class="ctas">
				<a class="btn btn-p btn-lg" href="{b}/menu">{T('startOrder')} <Icon name="right" size={20} stroke={2.5} /></a>
				<a class="btn btn-lg" href="{b}/deals"><Icon name="tag" size={18} /> {T('seeDeals')}</a>
			</div>
			<div class="status-line">
				{#if data.live.open}<span class="open">{T('openNow')}</span>{:else}<span class="closed">{T('closed')}</span>{/if}
				{#if S.settings.delivery}<span class="num">{T('delivery')} ~{data.live.eta.delivery} {T('minutes')}</span>{/if}
				{#if S.settings.pickup}<span class="num">{T('pickup')} ~{data.live.eta.pickup} {T('minutes')}</span>{/if}
			</div>
		</div>
		<div class="hide-m hero-card">
			<div class="card">
				<span class="eyebrow">{L === 'es' ? '¿Cómo lo quieres?' : 'How do you want it?'}</span>
				<div class="seg full" role="radiogroup">
					{#if S.settings.delivery}<button type="button" role="radio" aria-checked={cart.fulfil === 'delivery'} class:on={cart.fulfil === 'delivery'} onclick={() => cart.setFulfil('delivery')}><Icon name="scooter" size={16} />{T('delivery')}</button>{/if}
					{#if S.settings.pickup}<button type="button" role="radio" aria-checked={cart.fulfil === 'pickup'} class:on={cart.fulfil === 'pickup'} onclick={() => cart.setFulfil('pickup')}><Icon name="bag" size={16} />{T('pickup')}</button>{/if}
				</div>
				<div class="etas">
					{#if S.settings.delivery}<div class="elev"><span class="eyebrow">{T('delivery')}</span><div class="num eta">~{data.live.eta.delivery} {T('minutes')}</div></div>{/if}
					{#if S.settings.pickup}<div class="elev"><span class="eyebrow">{T('pickup')}</span><div class="num eta">~{data.live.eta.pickup} {T('minutes')}</div></div>{/if}
				</div>
				<a class="btn btn-p btn-block" href="{b}/menu">{T('seeMenu')}</a>
			</div>
		</div>
	</section>
{/if}

{#if data.deals.length}
	<section class="section pad" aria-labelledby="deals-h">
		<div class="section-head"><h2 id="deals-h">{T('deals')}</h2><a class="more" href="{b}/deals">{T('allDeals')} →</a></div>
		<div class="deal-row">
			{#each data.deals as d, i (d.id)}<DealCard deal={d} lang={L} live={d.live} alt={i % 2 === 1} href={d.kind === 'bundle' ? `${b}/deals/${d.slug}` : `${b}/deals`} />{/each}
		</div>
	</section>
{/if}

{#if data.popular.length}
	<section class="section pad" aria-labelledby="pop-h">
		<div class="section-head"><h2 id="pop-h">{T('popular')}</h2><a class="more" href="{b}/menu">{T('fullMenu')} →</a></div>
		<div class="tiles">
			{#each data.popular as x (x.id)}
				{#if photoTiles}
					<a class="tile" href="{b}/menu/{x.slug}"><FoodArt art={x.art} /><span class="nm">{tr(x, 'name', L)}</span><span class="pr num">{money(fromPrice(x))}</span></a>
				{:else}
					<a class="tile text" href="{b}/menu/{x.slug}"><span class="tag tag-pop"><Icon name="flame" size={12} /> {T('popular')}</span><span class="nm">{tr(x, 'name', L)}</span><span class="pr"><span class="num">{x.sizes?.length ? `${T('from')} ` : ''}{money(fromPrice(x))}</span><span class="addbtn"><Icon name="plus" size={18} stroke={2.5} /></span></span></a>
				{/if}
			{/each}
		</div>
	</section>
{/if}

{#if data.copy.storyTitle}
	<section class="section pad">
		<div class="story">
			<FoodArt art="bread" />
			<div class="story-text"><span class="eyebrow">{L === 'es' ? 'Nuestra historia' : 'Our story'}</span><h2>{data.copy.storyTitle}</h2><p class="big">{data.copy.storyBody}</p></div>
		</div>
	</section>
{/if}

<section class="section pad" aria-label={T('hours')}>
	<HoursCard store={S} lang={L} />
</section>

<style>
	.hero-copy { display: flex; flex-direction: column; gap: 18px; position: relative; }
	.hero-card { position: relative; flex-direction: column; }
	.hero-card .card { padding: 22px; display: flex; flex-direction: column; gap: 14px; }
	.etas { display: flex; gap: 10px; }
	.etas .elev { flex: 1; padding: 12px; }
	.eta { font-size: 28px; font-weight: 700; }
	.seg button { display: inline-flex; align-items: center; justify-content: center; flex: 1; gap: 6px; min-height: 40px; padding: 0 16px; border-radius: var(--q-btn-radius); font: 600 15px var(--q-font-body); color: var(--q-text2); }
	.seg button.on { background: var(--q-surface); color: var(--q-text); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18); }
	.cover-wrap { padding-top: 20px; padding-bottom: 8px; }
	.cover { position: relative; border-radius: var(--q-r-xl); overflow: hidden; }
	.cover :global(.photo) { min-height: 460px; border-radius: 0; align-items: start; padding-top: 56px; }
	.cover-text { position: absolute; inset: auto 0 0 0; padding: 24px; background: linear-gradient(transparent, rgba(10, 20, 14, 0.8)); color: #fff; display: flex; flex-direction: column; gap: 12px; }
	.cover-text .eyebrow { color: #e7ede6; }
	.cover-text h1 { font-size: clamp(38px, 7vw, 72px); color: #fff; }
	.cover-text p { color: #e7ede6; max-width: 40ch; }
	.cover-cta { background: #f2c94c; border-color: #f2c94c; color: #142219; }
	.status-row { padding-top: 12px; padding-bottom: 12px; }
	.story-text { display: flex; flex-direction: column; gap: 14px; }
	.story :global(.photo) { min-height: 260px; }
	.tile.text .pr { align-self: stretch; }
</style>
