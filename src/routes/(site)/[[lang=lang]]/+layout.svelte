<script lang="ts">
	import '$lib/styles/site.css';
	import { onMount, untrack } from 'svelte';
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import { cart } from '$lib/cart.svelte';
	import { account } from '$lib/account.svelte';
	import { t } from '$lib/i18n';
	import { money, clock, whenOpens, telHref, fmtPhone } from '$lib/fmt';
	import type { Fulfil, StoreStatus } from '$lib/types';

	let { data, children } = $props();
	const S = $derived(data.store);
	const L = $derived(data.lang);
	const b = $derived(data.base);
	const nav = $derived(data.theme.layout.nav);
	const T = (k: Parameters<typeof t>[1], v?: Record<string, string | number>) => t(L, k, v);

	let live = $state<StoreStatus | null>(untrack(() => data.status));
	let offline = $state(false);

	const path = $derived(page.url.pathname.slice(b.length) || '/');
	const active = $derived(path === '/' ? 'home' : path.split('/')[1]);
	const types = $derived(live ? live.order_types : { pickup: { enabled: S.pricing.types.pickup }, delivery: { enabled: S.pricing.types.delivery } });
	const modes = $derived<Fulfil[]>([...(types?.delivery.enabled ? (['delivery'] as const) : []), ...(types?.pickup.enabled ? (['pickup'] as const) : [])]);
	const hideCartbar = $derived(['cart', 'checkout', 'order', 'account'].includes(active) || (active === 'deals' && path.split('/').length > 2));
	const otherLangs = $derived(data.langs.filter((l: string) => l !== L));
	const rest = $derived(b ? page.url.pathname.slice(b.length) || '/' : page.url.pathname);
	const langHref = (l: string) => data.root + (l === data.langs[0] ? '' : `/${l}`) + (rest === '/' && l !== data.langs[0] ? '' : rest);
	const logo = $derived(S.look.logo ? `/media/${S.look.logo}` : '');

	async function refresh() {
		try {
			const r = await fetch('/api/store', { headers: { accept: 'application/json' } });
			if (!r.ok) throw new Error();
			live = await r.json();
			offline = false;
		} catch {
			offline = true;
		}
	}

	onMount(() => {
		cart.load(modes[0] ?? 'pickup', modes);
		account.load();
		const id = setInterval(refresh, 30_000);
		if ('serviceWorker' in navigator && !location.hostname.endsWith('localhost')) navigator.serviceWorker.register('/service-worker.js', { type: 'module' }).catch(() => {});
		return () => clearInterval(id);
	});

	const status = $derived.by(() => {
		if (offline || !live) return { tone: 'bad', text: T('offline') };
		if (live.state === 'paused') return { tone: 'warn', text: live.pause?.until ? `${T('pausedBar')} · ${T('backAround', { t: clock(live.pause.until, S.timezone) })}` : T('pausedBar') };
		if (live.state === 'closed') return { tone: 'info', text: live.next_open_at ? `${T('closed')} · ${whenOpens(live.next_open_at, S.timezone, L)}` : T('closed') };
		return null;
	});
	const signedIn = $derived(!!account.me);
	const firstName = $derived(account.me?.name?.split(' ')[0] || T('account'));
</script>

<svelte:head>
	{#each data.theme.preloads as f (f)}<link rel="preload" href={f} as="font" type="font/woff2" crossorigin="anonymous" />{/each}
	{@html `<style>${data.theme.fontFaces}${data.theme.css}</style>`}
	<meta name="theme-color" content={data.theme.themeColor} />
	<link rel="manifest" href="/manifest.webmanifest" />
	<link rel="icon" href={logo || '/icon.svg'} />
	<link rel="apple-touch-icon" href={logo || '/icon.svg'} />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-title" content={S.name} />
	<meta property="og:site_name" content={S.name} />
	{#if data.langs.length > 1}
		{#each data.langs as l (l)}<link rel="alternate" hreflang={l} href={data.origin + langHref(l)} />{/each}
		<link rel="alternate" hreflang="x-default" href={data.origin + rest} />
	{/if}
	{@html `<script type="application/ld+json">${data.restaurantLd}</script>`}
</svelte:head>

<div class="sf nav-{nav} {nav === 'bottom' ? 'has-tabbar' : 'has-cartbar'} theme-{data.theme.preset}">
	<a class="sr" href="#main">{T('skip')}</a>
	{#if S.preview}<div class="preview-bar" role="status">{T('previewBar')}</div>{/if}
	{#if data.announcement}<div class="announce pad" role="note">{data.announcement}</div>{/if}
	<header class="top pad">
		<a class="brandbox" href={b || '/'} aria-label="{S.name} — {T('home')}">{#if logo}<img class="logo" src={logo} alt={S.name} />{:else}<span class="wordmark">{S.name}</span>{/if}</a>
		<nav class="links" aria-label={T('mainNav')}>
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
							<button type="button" role="radio" aria-checked={cart.fulfil === m} class:on={cart.fulfil === m} onclick={() => cart.setFulfil(m)}><Icon name={m === 'delivery' ? 'scooter' : 'bag'} size={16} />{T(m)}</button>
						{/each}
					</span>
				{:else if modes.length === 1}
					<span class="chip"><Icon name="store" size={16} />{T(modes[0] === 'pickup' ? 'pickupOnly' : 'deliveryOnly')}</span>
				{/if}
			</span>
			{#each otherLangs as l (l)}
				<a class="lang" href={langHref(l)} hreflang={l} lang={l} aria-label={T('language')} data-sveltekit-reload>{L.toUpperCase()} <em>/ {l.toUpperCase()}</em></a>
			{/each}
			<a class="btn btn-sm acct" class:on={signedIn} href="{b}/account" aria-label={signedIn ? T('account') : T('signIn')}>
				<Icon name="user" size={18} /><span class="hide-m">{signedIn ? firstName : T('signIn')}</span>
			</a>
			<a class="btn btn-icon cartbtn {nav === 'bottom' ? 'hide-m' : ''}" href="{b}/cart" aria-label="{T('cart')}, {cart.count}">
				<Icon name="cart" />{#if cart.count}<b>{cart.count}</b>{/if}
			</a>
		</div>
	</header>
	{#if status}
		<div class="statusbar pad tone-{status.tone}" role="status">{status.text}{#if live?.pause?.note} · {live.pause.note}{/if}</div>
	{/if}
	<div class="shell">
		{#if nav === 'side'}
			<aside class="side">
				<div class="side-brand">{#if logo}<img class="logo big" src={logo} alt={S.name} />{:else}<span class="wordmark" style="font-size:30px">{S.name}</span>{/if}</div>
				<nav class="navlist" aria-label={T('mainNav')}>
					<a class:on={active === 'home'} href={b || '/'}><Icon name="home" size={18} />{T('home')}</a>
					<a class:on={active === 'menu'} href="{b}/menu"><Icon name="list" size={18} />{T('menu')}</a>
					<a class:on={active === 'deals'} href="{b}/deals"><Icon name="tag" size={18} />{T('deals')}</a>
					<a class:on={active === 'contact'} href="{b}/contact"><Icon name="pin" size={18} />{T('visit')}</a>
					<a class:on={active === 'cart'} href="{b}/cart"><Icon name="cart" size={18} />{T('cart')}{#if cart.count} <span class="tag tag-brand">{cart.count}</span>{/if}</a>
				</nav>
				{#if S.address.line1}
					<div class="card side-card">
						<span class="eyebrow">{T('pickup')}</span><b>{S.address.line1}</b>{#if live?.order_types.pickup.enabled}<span class="t2">~{live.order_types.pickup.eta_minutes} {T('minutes')}</span>{/if}
					</div>
				{/if}
				<div class="info">
					<span class="status-line">{#if live?.state === 'open'}<span class="open">{T('openNow')}</span>{#if live.closes_at}<span>{T('until', { t: clock(live.closes_at, S.timezone) })}</span>{/if}{:else}<span class="closed">{T('closed')}</span>{/if}</span>
					{#if S.phone}<a href={telHref(S.phone)}>{fmtPhone(S.phone)}</a>{/if}
				</div>
			</aside>
		{/if}
		<main class="main" id="main">
			{@render children()}
			<footer class="foot pad">
				<span>{[S.address.line1, S.address.line2].filter(Boolean).join(', ')}{#if S.phone} · <a href={telHref(S.phone)}>{fmtPhone(S.phone)}</a>{/if}</span>
				<a href="{b}/privacy">{T('privacy')}</a>
				<a class="byq" href="https://quiccpos.com" rel="noopener"><i>q</i> {T('poweredBy')}</a>
			</footer>
			<div class="body-end"></div>
		</main>
	</div>
	{#if nav === 'bottom'}
		<nav class="tabbar" aria-label={T('mainNav')}>
			<a class:on={active === 'home'} href={b || '/'}><Icon name="home" size={22} />{T('home')}</a>
			<a class:on={active === 'menu'} href="{b}/menu"><Icon name="list" size={22} />{T('menu')}</a>
			<a class:on={active === 'deals'} href="{b}/deals"><Icon name="tag" size={22} />{T('deals')}</a>
			<a class:on={active === 'cart' || active === 'checkout'} href="{b}/cart"><Icon name="cart" size={22} />{T('cart')}{#if cart.count}<b>{cart.count}</b>{/if}</a>
			<a class:on={active === 'account'} href="{b}/account"><Icon name="user" size={22} />{T('account')}</a>
		</nav>
	{:else if cart.count > 0 && !hideCartbar}
		<div class="cartbar">
			<a class="btn btn-p btn-lg" href="{b}/cart"><span class="count">{cart.count}</span><span>{T('viewOrder')}</span><span class="num">{money(cart.subtotal)}</span></a>
		</div>
	{/if}
</div>

<style>
	.hdr-fulfil { display: none; }
	.logo { display: block; height: 44px; width: auto; max-width: 180px; object-fit: contain; }
	.logo.big { height: 72px; max-width: 200px; }
	.announce { padding-top: 9px; padding-bottom: 9px; background: var(--q-brand); color: var(--q-on-brand); font-weight: 600; font-size: 14px; text-align: center; }
	.preview-bar { position: sticky; top: 0; z-index: 20; padding: 6px 12px; background: #ac94f4; color: #241b47; font: 700 13px/1.3 var(--q-font-body); text-align: center; }
	@media (min-width: 1100px) { .hdr-fulfil { display: inline-flex; } }
	.statusbar { padding-top: 10px; padding-bottom: 10px; font-weight: 600; font-size: 14px; border-bottom: var(--q-border-w) solid var(--q-border); }
	.tone-warn { background: color-mix(in srgb, var(--q-warn) 18%, var(--q-canvas)); }
	.tone-bad { background: color-mix(in srgb, var(--q-bad) 18%, var(--q-canvas)); }
	.tone-info { background: var(--q-brand-soft); }
	.seg button { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 16px; border-radius: var(--q-btn-radius); font: 600 15px var(--q-font-body); color: var(--q-text2); }
	.seg button.on { background: var(--q-surface); color: var(--q-text); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18); }
	.acct { gap: 6px; }
	.acct.on { border-color: var(--q-brand); }
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
