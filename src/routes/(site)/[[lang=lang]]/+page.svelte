<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import DealCard from '$lib/components/DealCard.svelte';
	import ItemTile from '$lib/components/ItemTile.svelte';
	import HoursCard from '$lib/components/HoursCard.svelte';
	import Miso from '$lib/components/Miso.svelte';
	import peekArt from '$lib/miso/art/miso-peek.svg?raw';
	import sideArt from '$lib/miso/art/miso-side.svg?raw';
	import closedArt from '$lib/miso/art/miso-closed.svg?raw';
	import pausedArt from '$lib/miso/art/miso-paused.svg?raw';
	import { cart } from '$lib/cart.svelte';
	import { t } from '$lib/i18n';
	import { money } from '$lib/fmt';
	import { findItem, fromPrice, sizeShort } from '$lib/menu';
	import { live } from '$lib/engine';

	let { data } = $props();
	const S = $derived(data.store);
	const L = $derived(data.lang);
	const b = $derived(data.base);
	const st = $derived(data.status);
	const T = (k: Parameters<typeof t>[1], v?: Record<string, string | number>) => t(L, k, v);
	const pickup = $derived(st?.order_types.pickup);
	const delivery = $derived(st?.order_types.delivery);
	const deals = $derived(S.deals.filter((d) => d.kind !== 'code').slice(0, 4));
	const popular = $derived(S.popular.map((id) => findItem(S.menu, id)).filter((i) => !!i).slice(0, 8));
	const photoTiles = $derived(data.theme.layout.menu === 'photo');
	const desc = $derived(`${data.copy.tagline} ${delivery?.enabled ? (L === 'es' ? 'Pide en línea para entrega o para llevar.' : 'Order online for delivery or pickup.') : L === 'es' ? 'Pide en línea para recoger.' : 'Order online for pickup.'}`);
	const now = new Date();
	// closed / paused: Miso asleep or snowed under, always; otherwise the hero block's own cat (optional)
	const away = $derived(st?.state === 'closed' || st?.state === 'paused' ? st.state : null);
	const heroSpot = $derived(away ? 'off' : (S.look.miso.blocks.hero ?? 'off'));
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

<section class="hero pad">
	<div class="lava" aria-hidden="true"><i style="width:280px;height:280px;right:-60px;top:20px;background:var(--q-brand)"></i><i style="width:200px;height:200px;left:30%;top:-80px;background:var(--q-warn);opacity:.18"></i></div>
	<div class="hero-copy">
		<span class="eyebrow">{data.copy.eyebrow}</span>
		<h1>{data.copy.headline}</h1>
		<p class="lead">{data.copy.lead}</p>
		<div class="ctas">
			<a class="btn btn-p btn-lg" href="{b}/menu">{st?.state === 'open' ? T('startOrder') : T('orderAhead')} <Icon name="right" size={20} stroke={2.5} /></a>
			{#if deals.length}<a class="btn btn-lg" href="{b}/deals"><Icon name="tag" size={18} /> {T('seeDeals')}</a>{/if}
		</div>
		{#if away}<Miso art={away === 'closed' ? closedArt : pausedArt} size={130} decorative />{/if}
		<div class="status-line">
			{#if st?.state === 'open'}<span class="open">{T('openNow')}</span>{:else if st?.state === 'paused'}<span class="closed">{T('pausedBar')}</span>{:else}<span class="closed">{T('closed')}</span>{/if}
			{#if delivery?.enabled}<span class="num">{T('delivery')} ~{delivery.eta_minutes} {T('minutes')}</span>{/if}
			{#if pickup?.enabled}<span class="num">{T('pickup')} ~{pickup.eta_minutes} {T('minutes')}</span>{/if}
		</div>
	</div>
	<div class="hide-m hero-card">
		<div class="card">
			{#if heroSpot === 'peek'}<div class="miso peek"><Miso art={peekArt} size={96} decorative /></div>
			{:else if heroSpot === 'side'}<div class="miso side"><Miso art={sideArt} size={96} decorative /></div>{/if}
			<span class="eyebrow">{T('howWant')}</span>
			<div class="seg full" role="radiogroup">
				{#if delivery?.enabled}<button type="button" role="radio" aria-checked={cart.fulfil === 'delivery'} class:on={cart.fulfil === 'delivery'} onclick={() => cart.setFulfil('delivery')}><Icon name="scooter" size={16} />{T('delivery')}</button>{/if}
				{#if pickup?.enabled}<button type="button" role="radio" aria-checked={cart.fulfil === 'pickup'} class:on={cart.fulfil === 'pickup'} onclick={() => cart.setFulfil('pickup')}><Icon name="bag" size={16} />{T('pickup')}</button>{/if}
			</div>
			<div class="etas">
				{#if delivery?.enabled}<div class="elev"><span class="eyebrow">{T('delivery')}</span><div class="num eta">~{delivery.eta_minutes} {T('minutes')}</div></div>{/if}
				{#if pickup?.enabled}<div class="elev"><span class="eyebrow">{T('pickup')}</span><div class="num eta">~{pickup.eta_minutes} {T('minutes')}</div></div>{/if}
			</div>
			<a class="btn btn-p btn-block" href="{b}/menu">{T('seeMenu')}</a>
		</div>
	</div>
</section>

{#if deals.length}
	<section class="section pad" aria-labelledby="deals-h">
		<div class="section-head"><h2 id="deals-h">{T('deals')}</h2><a class="more" href="{b}/deals">{T('allDeals')} →</a></div>
		<div class="deal-row">
			{#each deals as d, i (d.id)}<DealCard deal={d} lang={L} live={live(d, S.timezone, now, '')} alt={i % 2 === 1} href="{b}/deals/{d.id}" />{/each}
		</div>
	</section>
{/if}

{#if popular.length}
	<section class="section pad" aria-labelledby="pop-h">
		<div class="section-head"><h2 id="pop-h">{T('fromMenu')}</h2><a class="more" href="{b}/menu">{T('fullMenu')} →</a></div>
		<div class="tiles">
			{#each popular as x (x.id)}
				{#if photoTiles}
					<a class="tile" href="{b}/menu/{x.slug}"><ItemTile name={x.name} sizes={x.sizes.map((s) => sizeShort(S.menu, s.size_id, s.name))} /><span class="nm">{x.name}</span><span class="pr num">{money(fromPrice(x))}</span></a>
				{:else}
					<a class="tile text" href="{b}/menu/{x.slug}"><span class="nm">{x.name}</span><span class="pr"><span class="num">{x.sizes.length > 1 ? `${T('from')} ` : ''}{money(fromPrice(x))}</span><span class="addbtn"><Icon name="plus" size={18} stroke={2.5} /></span></span></a>
				{/if}
			{/each}
		</div>
	</section>
{/if}

<section class="section pad" aria-label={T('hours')}>
	<HoursCard store={S} status={st} lang={L} />
</section>

<style>
	.hero-copy { display: flex; flex-direction: column; gap: 18px; position: relative; }
	.hero-card { position: relative; flex-direction: column; }
	.hero-card .card { padding: 22px; display: flex; flex-direction: column; gap: 14px; position: relative; }
	.miso { position: absolute; pointer-events: none; }
	/* the peek's paws sit on the card's top edge (y 144 of 150); the side-sit's feet on its bottom (y 198 of 232) */
	.miso.peek { right: 18px; top: -84px; }
	.hero-card:has(.peek) { padding-top: 40px; }
	.miso.side { left: -78px; bottom: -9px; }
	.etas { display: flex; gap: 10px; }
	.etas .elev { flex: 1; padding: 12px; }
	.eta { font-size: 28px; font-weight: 700; }
	.seg button { display: inline-flex; align-items: center; justify-content: center; flex: 1; gap: 6px; min-height: 40px; padding: 0 16px; border-radius: var(--q-btn-radius); font: 600 15px var(--q-font-body); color: var(--q-text2); }
	.seg button.on { background: var(--q-surface); color: var(--q-text); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18); }
	.tile.text .pr { align-self: stretch; }
</style>
