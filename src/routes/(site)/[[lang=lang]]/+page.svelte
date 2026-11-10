<!-- The home page: Store › Website's blocks in the store's order (hero, order again, categories,
     deals, from the menu, hours, about us, install the app), each on or off; Miso around a block
     when the store asks for it (peeking over it or sitting beside it). -->
<script lang="ts">
	import { goto } from '$app/navigation';
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
	import { account, api } from '$lib/account.svelte';
	import { reorder } from '$lib/reorder';
	import { t } from '$lib/i18n';
	import { money, dayLabel } from '$lib/fmt';
	import { findItem, fromPrice, sizeShort } from '$lib/menu';
	import { live } from '$lib/engine';
	import type { BlockId, MisoSpot, PastOrder } from '$lib/types';

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
	const blocks = $derived(S.look.blocks.filter((x) => x.on));
	const heroOn = $derived(blocks.some((x) => x.id === 'hero'));
	const cover = $derived(S.look.cover ? `/media/${S.look.cover}` : '');
	const cats = $derived(S.menu.categories.filter((c) => c.items.length));
	// closed / paused: Miso asleep or snowed under, always; the blocks' own cats (optional) wait till it opens
	const away = $derived(st?.state === 'closed' || st?.state === 'paused' ? st.state : null);
	const spot = (id: BlockId): MisoSpot => (away ? 'off' : (S.look.miso.blocks[id] ?? 'off'));

	// "Order again": only signed-in customers with past orders see it.
	let past = $state<PastOrder[]>([]);
	let againErr = $state('');
	$effect(() => {
		if (!account.me || !blocks.some((x) => x.id === 'again')) return;
		api<{ orders: PastOrder[] }>('GET', '/api/account/orders')
			.then((r) => (past = r.orders.filter((o) => o.status !== 'cancelled').slice(0, 3)))
			.catch(() => (past = []));
	});
	async function again(o: PastOrder) {
		againErr = '';
		try {
			const r = await reorder(o);
			if (!r.ok) againErr = T('reorderNothing');
			else if (r.dropped.length) againErr = T('reorderDropped', { x: r.dropped.join(', ') });
			else await goto(`${b}/cart`);
		} catch (e) {
			againErr = (e as { message: string }).message;
		}
	}
	const standalone = $derived(typeof window !== 'undefined' && matchMedia('(display-mode: standalone)').matches);
</script>

<svelte:head>
	<title>{data.title}</title>
	<meta name="description" content={desc} />
	<link rel="canonical" href={data.origin + (b || '/')} />
	<meta property="og:title" content={data.title} />
	<meta property="og:description" content={desc} />
	<meta property="og:type" content="restaurant.restaurant" />
	<meta property="og:url" content={data.origin + (b || '/')} />
	{#if cover}<meta property="og:image" content={data.origin + cover} />{/if}
</svelte:head>

{#snippet cat(id: BlockId)}
	{#if spot(id) === 'peek'}<div class="blk-miso peek"><Miso art={peekArt} size={80} decorative /></div>
	{:else if spot(id) === 'side'}<div class="blk-miso beside"><Miso art={sideArt} size={76} decorative /></div>{/if}
{/snippet}

{#if away && !heroOn}
	<div class="pad away"><Miso art={away === 'closed' ? closedArt : pausedArt} size={120} decorative /><b>{away === 'closed' ? T('closed') : T('pausedBar')}</b></div>
{/if}

{#each blocks as blk (blk.id)}
	{#if blk.id === 'hero'}
		<section class="hero pad" class:has-cover={!!cover} style={cover ? `--cover:url(${cover})` : undefined}>
			{#if !cover}<div class="lava" aria-hidden="true"><i style="width:280px;height:280px;right:-60px;top:20px;background:var(--q-brand)"></i><i style="width:200px;height:200px;left:30%;top:-80px;background:var(--q-warn);opacity:.18"></i></div>{/if}
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
					{#if spot('hero') === 'peek'}<div class="miso peek"><Miso art={peekArt} size={96} decorative /></div>
					{:else if spot('hero') === 'side'}<div class="miso beside"><Miso art={sideArt} size={96} decorative /></div>{/if}
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
	{:else if blk.id === 'again'}
		{#if past.length}
			<section class="section pad blk" aria-labelledby="again-h">
				{@render cat('again')}
				<div class="section-head"><h2 id="again-h">{T('orderAgain')}</h2><a class="more" href="{b}/account">{T('account')} →</a></div>
				{#if againErr}<div class="banner warn" role="alert"><Icon name="info" size={18} /><span class="grow">{againErr}</span></div>{/if}
				<div class="again">
					{#each past as o (o.id)}
						<div class="card again-card">
							<span class="eyebrow">{dayLabel(o.placed_at, S.timezone, L)} · {o.type === 'delivery' ? T('delivery') : T('pickup')}</span>
							<span class="lines">{o.lines.map((l) => `${l.qty}× ${l.name}`).join(', ')}</span>
							<div class="row"><span class="num">{money(o.money.total_cents)}</span><button type="button" class="btn btn-sm btn-p" onclick={() => again(o)}>{T('reorder')}</button></div>
						</div>
					{/each}
				</div>
			</section>
		{/if}
	{:else if blk.id === 'categories'}
		{#if cats.length > 1}
			<section class="section pad blk" aria-labelledby="cats-h">
				{@render cat('categories')}
				<div class="section-head"><h2 id="cats-h">{T('categories')}</h2></div>
				<div class="cats">{#each cats as c (c.key)}<a class="chip cat-chip" href="{b}/menu#{c.slug}">{c.name}</a>{/each}</div>
			</section>
		{/if}
	{:else if blk.id === 'deals'}
		{#if deals.length}
			<section class="section pad blk" aria-labelledby="deals-h">
				{@render cat('deals')}
				<div class="section-head"><h2 id="deals-h">{T('deals')}</h2><a class="more" href="{b}/deals">{T('allDeals')} →</a></div>
				<div class="deal-row">
					{#each deals as d, i (d.id)}<DealCard deal={d} lang={L} live={live(d, S.timezone, now, '')} alt={i % 2 === 1} href="{b}/deals/{d.id}" />{/each}
				</div>
			</section>
		{/if}
	{:else if blk.id === 'picks'}
		{#if popular.length}
			<section class="section pad blk" aria-labelledby="pop-h">
				{@render cat('picks')}
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
	{:else if blk.id === 'hours'}
		<section class="section pad blk" aria-label={T('hours')}>
			{@render cat('hours')}
			<HoursCard store={S} status={st} lang={L} />
		</section>
	{:else if blk.id === 'about'}
		{#if data.copy.about}
			<section class="section pad blk" aria-labelledby="about-h">
				{@render cat('about')}
				<div class="card about" class:with-cover={!!cover}>
					{#if cover}<img class="about-img" src={cover} alt="" loading="lazy" />{/if}
					<div class="about-text">
						<h2 id="about-h">{data.copy.aboutTitle}</h2>
						{#each data.copy.about.split(/\n\s*\n/) as para, i (i)}<p>{para}</p>{/each}
					</div>
				</div>
			</section>
		{/if}
	{:else if blk.id === 'install'}
		{#if !standalone}
			<section class="section pad blk" aria-labelledby="app-h">
				{@render cat('install')}
				<div class="card install">
					{#if S.look.logo}<img class="appimg" src="/media/{S.look.logo}" alt="" />{:else}<span class="appicon" aria-hidden="true">{S.name.replace(/[^A-Za-z]/g, '').slice(0, 1)}</span>{/if}
					<div><h2 id="app-h">{T('getApp')}</h2><p class="t2">{T('getAppSub')}</p></div>
				</div>
			</section>
		{/if}
	{/if}
{/each}

<style>
	.hero-copy { display: flex; flex-direction: column; gap: 18px; position: relative; }
	.hero-card { position: relative; flex-direction: column; }
	.hero-card .card { padding: 22px; display: flex; flex-direction: column; gap: 14px; position: relative; }
	.miso { position: absolute; pointer-events: none; }
	/* the peek's paws sit on the card's top edge (y 144 of 150); the side-sit's feet on its bottom (y 198 of 232) */
	.miso.peek { right: 18px; top: -84px; }
	.hero-card:has(.peek) { padding-top: 40px; }
	.miso.beside { left: -78px; bottom: -9px; }
	/* the store's cover photo behind the headline, darkened so the words stay readable */
	.hero.has-cover { background: linear-gradient(90deg, rgba(0, 0, 0, 0.72), rgba(0, 0, 0, 0.35) 70%, rgba(0, 0, 0, 0.2)), var(--cover) center / cover no-repeat; }
	/* only the words on the photo turn white; the order card keeps the theme's colours */
	.hero.has-cover .hero-copy { --q-text: #fff; --q-text2: rgba(255, 255, 255, 0.86); color: #fff; }
	.hero.has-cover .hero-copy .eyebrow { color: rgba(255, 255, 255, 0.8); }
	.etas { display: flex; gap: 10px; }
	.etas .elev { flex: 1; padding: 12px; }
	.eta { font-size: 28px; font-weight: 700; }
	.seg button { display: inline-flex; align-items: center; justify-content: center; flex: 1; gap: 6px; min-height: 40px; padding: 0 16px; border-radius: var(--q-btn-radius); font: 600 15px var(--q-font-body); color: var(--q-text2); }
	.seg button.on { background: var(--q-surface); color: var(--q-text); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18); }
	.tile.text .pr { align-self: stretch; }
	/* Miso around a block: peeking over its top-right edge, or sitting by its heading */
	.blk { position: relative; }
	.blk-miso { position: absolute; pointer-events: none; z-index: 1; }
	.blk-miso.peek { right: clamp(16px, 6vw, 72px); top: -38px; }
	.blk-miso.beside { right: clamp(16px, 6vw, 72px); top: -42px; }
	.away { display: flex; align-items: center; gap: 14px; padding-block: 16px; }
	.again { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
	.again-card { padding: 16px; display: flex; flex-direction: column; gap: 8px; }
	.again-card .lines { font-weight: 600; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
	.again-card .row { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: auto; }
	.cats { display: flex; flex-wrap: wrap; gap: 8px; }
	.cat-chip { min-height: 44px; padding: 0 18px; font-size: 15px; }
	.about { display: grid; overflow: hidden; }
	.about.with-cover { grid-template-columns: 1fr; }
	@media (min-width: 900px) { .about.with-cover { grid-template-columns: 1fr 1fr; } }
	.about-img { width: 100%; height: 100%; min-height: 220px; object-fit: cover; aspect-ratio: 16 / 9; }
	.about-text { padding: 24px; display: flex; flex-direction: column; gap: 12px; }
	.about-text p { color: var(--q-text2); max-width: 60ch; white-space: pre-line; }
	.install { padding: 18px; display: flex; gap: 16px; align-items: center; }
	.install h2 { font-size: 24px; }
	.appicon, .appimg { width: 56px; height: 56px; border-radius: 13px; flex-shrink: 0; }
	.appicon { background: var(--q-brand); color: var(--q-on-brand); display: grid; place-items: center; font: var(--q-display-weight) 26px/1 var(--q-font-display); }
	.appimg { object-fit: contain; background: var(--q-elev); }
</style>
