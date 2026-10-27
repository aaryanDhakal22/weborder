<script lang="ts">
	import '$lib/styles/site.css';
	import { onMount, untrack } from 'svelte';
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import { cart } from '$lib/cart.svelte';
	import { t } from '$lib/i18n';
	import { money, clock, whenOpens } from '$lib/fmt';
	import { liveState, type LiveState } from '$lib/live';
	import { fmtTime } from '$lib/hours';
	import type { Fulfil } from '$lib/types';

	let { data, children } = $props();
	const S = $derived(data.store);
	const L = $derived(data.lang);
	const b = $derived(data.base);
	const nav = $derived(data.theme.layout.nav);
	const T = (k: Parameters<typeof t>[1], v?: Record<string, string | number>) => t(L, k, v);

	let live = $state<LiveState>(untrack(() => data.live));
	let offline = $state(false);

	const path = $derived(page.url.pathname.slice(b.length) || '/');
	const active = $derived(path === '/' ? 'home' : path.split('/')[1]);
	const modes = $derived<Fulfil[]>([...(S.settings.delivery ? (['delivery'] as const) : []), ...(S.settings.pickup ? (['pickup'] as const) : [])]);
	const hideCartbar = $derived(['cart', 'checkout', 'order'].includes(active) || (active === 'deals' && path.split('/').length > 2));
	const otherLangs = $derived(data.langs.filter((l: string) => l !== L));
	const langHref = (l: string) => (l === data.langs[0] ? '' : `/${l}`) + (data.rest === '/' && l !== data.langs[0] ? '' : data.rest);

	async function refresh() {
		try {
			const r = await fetch('/api/live', { headers: { accept: 'application/json' } });
			if (!r.ok) throw new Error();
			live = await r.json();
			offline = false;
		} catch {
			offline = true;
		}
	}

	onMount(() => {
		cart.load(modes[0] ?? 'pickup', modes);
		// Snapshots may be minutes old: recompute open/closed from the hours right away, then ask the server.
		live = { ...live, ...liveState({ hours: S.hours, timezone: S.timezone, settings: { ...S.settings, pausedUntil: live.pausedUntil, busyEtaMin: live.busyEtaMin, soldOut: live.soldOut, deliveryZips: [] } as never }), pausedUntil: live.pausedUntil, soldOut: live.soldOut };
		refresh();
		const id = setInterval(refresh, 30_000);
		if ('serviceWorker' in navigator && !location.hostname.endsWith('localhost')) navigator.serviceWorker.register('/service-worker.js', { type: 'module' }).catch(() => {});
		return () => clearInterval(id);
	});

	const status = $derived.by(() => {
		if (offline) return { tone: 'bad', text: T('offline') };
		if (live.pausedUntil) return { tone: 'warn', text: `${T('pausedBar')} · ${clock(live.pausedUntil, S.timezone)}` };
		if (!live.open) return { tone: 'info', text: whenOpens(live.nextOpen, L) };
		if (live.busyEtaMin) return { tone: 'warn', text: T('busyBar', { n: live.busyEtaMin }) };
		return null;
	});

	function setFulfil(f: Fulfil) {
		cart.setFulfil(f);
	}
</script>

<svelte:head>
	{#each data.theme.preloads as f (f)}<link rel="preload" href={f} as="font" type="font/woff2" crossorigin="anonymous" />{/each}
	{@html `<style>${data.theme.fontFaces}${data.theme.css}</style>`}
	<meta name="theme-color" content={data.theme.themeColor} />
	<link rel="manifest" href="/manifest.webmanifest" />
	<link rel="icon" href="/icon.svg" type="image/svg+xml" />
	<link rel="apple-touch-icon" href="/icon.svg" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-title" content={S.name} />
	<meta property="og:site_name" content={S.name} />
	{#if data.langs.length > 1}
		{#each data.langs as l (l)}<link rel="alternate" hreflang={l} href={data.origin + (l === data.langs[0] ? '' : `/${l}`) + (data.rest === '/' && l !== data.langs[0] ? '' : data.rest)} />{/each}
		<link rel="alternate" hreflang="x-default" href={data.origin + data.rest} />
	{/if}
	{@html `<script type="application/ld+json">${data.restaurantLd}</script>`}
</svelte:head>

<div class="sf nav-{nav} {nav === 'bottom' ? 'has-tabbar' : 'has-cartbar'} theme-{data.theme.preset}">
	<a class="sr" href="#main">Skip to content</a>
	{#if data.banner}
		<div class="preview-banner">{data.banner === 'draft' ? 'Draft preview · not public yet' : 'Preview · this look is not published'}</div>
	{/if}
	<header class="top pad">
		<a class="brandbox" href={b || '/'} aria-label="{S.name} home"><span class="wordmark">{S.name}</span></a>
		<nav class="links" aria-label="Main">
			<a class:on={active === 'home'} href={b || '/'}>{T('home')}</a>
			<a class:on={active === 'menu'} href="{b}/menu">{T('menu')}</a>
			<a class:on={active === 'deals'} href="{b}/deals">{T('deals')}</a>
			<a class:on={active === 'contact'} href="{b}/contact">{T('visit')}</a>
		</nav>
		<div class="right">
			<span class="hdr-fulfil">
				{#if modes.length > 1}
					<span class="seg" role="radiogroup" aria-label="{T('delivery')} / {T('pickup')}">
						{#each modes as m (m)}
							<button type="button" role="radio" aria-checked={cart.fulfil === m} class:on={cart.fulfil === m} onclick={() => setFulfil(m)}><Icon name={m === 'delivery' ? 'scooter' : 'bag'} size={16} />{T(m)}</button>
						{/each}
					</span>
				{:else}
					<span class="chip"><Icon name="store" size={16} />{T('pickupOnly')}</span>
				{/if}
			</span>
			{#each otherLangs as l (l)}
				<a class="lang" href={langHref(l)} hreflang={l} lang={l} aria-label={T('language')}>{L.toUpperCase()} <em>/ {l.toUpperCase()}</em></a>
			{/each}
			<a class="btn btn-icon cartbtn {nav === 'bottom' ? 'hide-m' : ''}" href="{b}/cart" aria-label="{T('cart')}, {cart.count}">
				<Icon name="cart" />{#if cart.count}<b>{cart.count}</b>{/if}
			</a>
		</div>
	</header>
	{#if status}
		<div class="statusbar pad tone-{status.tone}" role="status">{status.text}</div>
	{/if}
	<div class="shell">
		{#if nav === 'side'}
			<aside class="side">
				<div class="side-brand"><span class="wordmark" style="font-size:30px">{S.name}</span><span class="muted" style="font-size:13px">{S.cuisine.join(' · ')}</span></div>
				<nav class="navlist" aria-label="Main">
					<a class:on={active === 'home'} href={b || '/'}><Icon name="home" size={18} />{T('home')}</a>
					<a class:on={active === 'menu'} href="{b}/menu"><Icon name="list" size={18} />{T('menu')}</a>
					<a class:on={active === 'deals'} href="{b}/deals"><Icon name="tag" size={18} />{T('deals')}</a>
					<a class:on={active === 'contact'} href="{b}/contact"><Icon name="pin" size={18} />{T('visit')}</a>
					<a class:on={active === 'cart'} href="{b}/cart"><Icon name="cart" size={18} />{T('cart')}{#if cart.count} <span class="tag tag-brand">{cart.count}</span>{/if}</a>
				</nav>
				<div class="card side-card">
					<span class="eyebrow">{T('pickup')}</span><b>{S.address.line1}</b><span class="t2">{T('readyAt')} ~{live.eta.pickup} {T('minutes')}</span>
				</div>
				<div class="info">
					<span class="status-line">{#if live.open}<span class="open">{T('openNow')}</span>{#if live.closesAt}<span>{T('until', { t: fmtTime(live.closesAt) })}</span>{/if}{:else}<span class="closed">{T('closed')}</span>{/if}</span>
					<span>{S.phone}</span>
				</div>
			</aside>
		{/if}
		<main class="main" id="main">
			{@render children()}
			<footer class="foot pad">
				<span>{S.address.line1}, {S.address.city}, {S.address.state} · <a href="tel:{S.phone.replace(/\D/g, '')}">{S.phone}</a></span>
				<a class="byq" href="https://quiccpos.com" rel="noopener"><i>q</i> {T('poweredBy')}</a>
			</footer>
			<div class="body-end"></div>
		</main>
	</div>
	{#if nav === 'bottom'}
		<nav class="tabbar" aria-label="Main">
			<a class:on={active === 'home'} href={b || '/'}><Icon name="home" size={22} />{T('home')}</a>
			<a class:on={active === 'menu'} href="{b}/menu"><Icon name="list" size={22} />{T('menu')}</a>
			<a class:on={active === 'deals'} href="{b}/deals"><Icon name="tag" size={22} />{T('deals')}</a>
			<a class:on={active === 'cart' || active === 'checkout'} href="{b}/cart"><Icon name="cart" size={22} />{T('cart')}{#if cart.count}<b>{cart.count}</b>{/if}</a>
			<a class:on={active === 'contact'} href="{b}/contact"><Icon name="pin" size={22} />{T('visit')}</a>
		</nav>
	{:else if cart.count > 0 && !hideCartbar}
		<div class="cartbar">
			<a class="btn btn-p btn-lg" href="{b}/cart"><span class="count">{cart.count}</span><span>{T('viewOrder')}</span><span class="num">{money(cart.subtotal)}</span></a>
		</div>
	{/if}
</div>

<style>
	.hdr-fulfil { display: none; }
	@media (min-width: 1100px) { .hdr-fulfil { display: inline-flex; } }
	.preview-banner { background: #fbbf24; color: #1a1208; font: 700 13px/1.2 system-ui, sans-serif; text-align: center; padding: 6px 12px; }
	.statusbar { padding-top: 10px; padding-bottom: 10px; font-weight: 600; font-size: 14px; border-bottom: var(--q-border-w) solid var(--q-border); }
	.tone-warn { background: color-mix(in srgb, var(--q-warn) 18%, var(--q-canvas)); }
	.tone-bad { background: color-mix(in srgb, var(--q-bad) 18%, var(--q-canvas)); }
	.tone-info { background: var(--q-brand-soft); }
	.seg button { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 16px; border-radius: var(--q-btn-radius); font: 600 15px var(--q-font-body); color: var(--q-text2); }
	.seg button.on { background: var(--q-surface); color: var(--q-text); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18); }
	.side-brand { display: flex; flex-direction: column; gap: 4px; }
	.side-card { padding: 14px; display: flex; flex-direction: column; gap: 6px; font-size: 14px; }
	.navlist a { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: var(--q-btn-radius); font-weight: 600; color: var(--q-text2); }
	.navlist a.on { background: var(--q-brand-soft); color: var(--q-brand-ink); }
	.links a { padding: 8px 12px; border-radius: var(--q-btn-radius); font-weight: 600; color: var(--q-text2); white-space: nowrap; }
	.links a.on { color: var(--q-text); background: var(--q-elev); }
	.tabbar a { display: flex; flex-direction: column; align-items: center; gap: 3px; font: 600 11px var(--q-font-body); color: var(--q-muted); width: 64px; position: relative; }
	.tabbar a.on { color: var(--q-brand-ink); }
	.tabbar a b { position: absolute; top: -4px; left: 38px; min-width: 18px; height: 18px; border-radius: 9px; background: var(--q-accent2); color: #fff; font: 700 11px/18px var(--q-font-num); text-align: center; padding: 0 4px; }
</style>
