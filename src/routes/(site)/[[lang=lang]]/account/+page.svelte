<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onDestroy } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Miso from '$lib/components/Miso.svelte';
	import waveArt from '$lib/miso/art/miso-wave.svg?raw';
	import loadingArt from '$lib/miso/art/miso-loading.svg?raw';
	import noOrdersArt from '$lib/miso/art/miso-no-orders.svg?raw';
	import { account, api } from '$lib/account.svelte';
	import { cart } from '$lib/cart.svelte';
	import { t } from '$lib/i18n';
	import { money, fmtPhone, dayLabel, clock } from '$lib/fmt';
	import type { Account, Address, CartEntry, PastOrder, Quote } from '$lib/types';

	let { data } = $props();
	const S = $derived(data.store);
	const L = $derived(data.lang);
	const b = $derived(data.base);
	const T = (k: Parameters<typeof t>[1], v?: Record<string, string | number>) => t(L, k, v);
	const me = $derived(account.me);
	const next = $derived(page.url.searchParams.get('next'));

	// ---- sign in
	let step = $state<'phone' | 'code'>('phone');
	let phone = $state('');
	let code = $state('');
	let name = $state('');
	let sentTo = $state('');
	let callIn = $state(0);
	let busy = $state(false);
	let err = $state('');
	let timer: ReturnType<typeof setInterval> | undefined;
	onDestroy(() => clearInterval(timer));

	async function send(channel: 'sms' | 'call' = 'sms') {
		err = '';
		busy = true;
		try {
			const r = await api<{ sent_to: string; channel: string; call_after_s: number }>('POST', '/api/account/code', { phone, channel });
			sentTo = r.sent_to;
			step = 'code';
			callIn = channel === 'sms' ? r.call_after_s : 0;
			clearInterval(timer);
			if (callIn) timer = setInterval(() => (callIn = Math.max(0, callIn - 1)), 1000);
		} catch (e) {
			err = (e as { message: string }).message;
		} finally {
			busy = false;
		}
	}
	async function verify() {
		err = '';
		busy = true;
		try {
			await api('POST', '/api/account/verify', { phone, code: code.trim(), ...(name.trim() ? { name: name.trim() } : {}) });
			await account.load(true);
			step = 'phone';
			code = '';
			if (next === 'checkout') await goto(`${b}/checkout`, { replaceState: true });
			else void loadOrders();
		} catch (e) {
			err = (e as { message: string }).message;
		} finally {
			busy = false;
		}
	}

	// ---- profile
	let editing = $state(false);
	let pName = $state('');
	let pEmail = $state('');
	function editProfile() {
		pName = me?.name ?? '';
		pEmail = me?.email ?? '';
		editing = true;
	}
	async function saveProfile() {
		err = '';
		try {
			const a = await api<Account>('PATCH', '/api/account', { name: pName.trim(), email: pEmail.trim() });
			account.set({ ...me!, ...a });
			editing = false;
		} catch (e) {
			err = (e as { message: string }).message;
		}
	}

	// ---- addresses
	let addr = $state<Partial<Address> | null>(null);
	async function saveAddress() {
		if (!addr) return;
		err = '';
		const body = { label: addr.label ?? '', line1: addr.line1 ?? '', line2: addr.line2 ?? '', city: addr.city ?? '', state: addr.state ?? '', zip: addr.zip ?? '', notes: addr.notes ?? '', default: !!addr.default };
		try {
			if (addr.id) await api('PUT', `/api/account/addresses/${addr.id}`, body);
			else await api('POST', '/api/account/addresses', body);
			addr = null;
			await account.load(true);
		} catch (e) {
			err = (e as { message: string }).message;
		}
	}
	async function removeAddress(id: string) {
		await api('DELETE', `/api/account/addresses/${id}`).catch(() => {});
		await account.load(true);
	}
	async function removeCard(id: string) {
		if (!confirm(T('forgetCardQ'))) return;
		await api('DELETE', `/api/account/cards/${id}`).catch(() => {});
		await account.load(true);
	}

	// ---- orders
	let orders = $state<PastOrder[] | null>(null);
	async function loadOrders() {
		try {
			orders = (await api<{ orders: PastOrder[] }>('GET', '/api/account/orders')).orders;
		} catch {
			orders = [];
		}
	}
	$effect(() => {
		if (me && orders === null) void loadOrders();
	});
	let dropped = $state<string[]>([]);
	async function reorder(o: PastOrder) {
		err = '';
		try {
			const r = await api<{ lines: CartEntry['line'][]; dropped: string[]; quote: Quote | null }>('POST', `/api/account/orders/${o.id}/reorder`);
			if (!r.lines.length) {
				dropped = r.dropped;
				err = T('reorderNothing');
				return;
			}
			const entries: CartEntry[] = r.lines.map((line, i) => {
				const q = r.quote?.lines.find((x) => x.index === i);
				return { line, name: q?.name ?? '', mods: q?.mods ?? [], unitCents: q?.unit_cents ?? 0 };
			});
			cart.replace(entries);
			cart.setFulfil(o.type);
			dropped = r.dropped;
			if (!dropped.length) await goto(`${b}/cart`);
		} catch (e) {
			err = (e as { message: string }).message;
		}
	}

	async function signOut() {
		await api('POST', '/api/account/logout').catch(() => {});
		account.set(null);
		orders = null;
	}
	async function deleteAccount() {
		if (!confirm(T('deleteQ'))) return;
		try {
			await api('DELETE', '/api/account');
			account.set(null);
			orders = null;
		} catch (e) {
			err = (e as { message: string }).message;
		}
	}
	const statusLabel = (s: string) => ({ received: T('received'), scheduled: T('scheduled'), accepted: T('accepted'), ready: T('ready'), on_delivery: T('out'), completed: T('doneShort'), cancelled: T('cancelledShort') })[s] ?? s;
</script>

<svelte:head>
	<title>{me ? T('account') : T('signIn')} · {S.name}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="backbar pad"><h1>{me ? T('hi', { n: me.name.split(' ')[0] || '' }) : T('signIn')}</h1></div>

<div class="pad wrap">
	{#if err}<div class="banner warn" role="alert"><Icon name="info" size={18} /><span class="grow">{err}</span></div>{/if}
	{#if !account.loaded}
		<div class="loading"><Miso art={loadingArt} size={72} label={T('loading')} /></div>
	{:else if !me}
		<section class="card sec signin">
			{#if S.look.miso.pages}<div class="miso"><Miso art={waveArt} size={110} decorative /></div>{/if}
			<p class="t2">{T('signInWhy')}</p>
			{#if step === 'phone'}
				<form onsubmit={(e) => { e.preventDefault(); send(); }}>
					<label class="field"><span>{T('phoneOnly')}</span><input type="tel" inputmode="tel" autocomplete="tel" required bind:value={phone} placeholder="(410) 555-0101" /></label>
					<button class="btn btn-p btn-lg btn-block" type="submit" disabled={busy || phone.replace(/\D/g, '').length < 10}>{T('textMeCode')}</button>
				</form>
			{:else}
				<form onsubmit={(e) => { e.preventDefault(); verify(); }}>
					<p>{T('codeSent', { p: sentTo })}</p>
					<label class="field"><span>{T('code')}</span><input inputmode="numeric" autocomplete="one-time-code" maxlength="10" required bind:value={code} /></label>
					<label class="field"><span>{T('nameNew')}</span><input autocomplete="name" bind:value={name} /></label>
					<button class="btn btn-p btn-lg btn-block" type="submit" disabled={busy || code.trim().length < 4}>{T('signIn')}</button>
					<div class="row">
						<button type="button" class="btn btn-ghost btn-sm" onclick={() => { step = 'phone'; code = ''; }}>{T('changeNumber')}</button>
						<button type="button" class="btn btn-ghost btn-sm" disabled={busy || callIn > 0} onclick={() => send('call')}>{callIn > 0 ? T('callIn', { s: callIn }) : T('callMe')}</button>
					</div>
				</form>
			{/if}
			<p class="muted small">{T('guestOk')}</p>
		</section>
	{:else}
		{#if dropped.length}
			<div class="banner warn"><Icon name="info" size={18} /><span class="grow">{T('reorderDropped', { x: dropped.join(', ') })}</span><a class="btn btn-sm" href="{b}/cart">{T('viewOrder')}</a></div>
		{/if}
		<section class="card sec">
			<div class="sec-h"><h2>{T('details')}</h2>{#if !editing}<button type="button" class="btn btn-sm" onclick={editProfile}>{T('edit')}</button>{/if}</div>
			{#if editing}
				<label class="field"><span>{T('name')}</span><input autocomplete="name" bind:value={pName} /></label>
				<label class="field"><span>{T('emailReceipts')}</span><input type="email" autocomplete="email" bind:value={pEmail} /></label>
				<div class="row"><button type="button" class="btn btn-p" onclick={saveProfile}>{T('save')}</button><button type="button" class="btn btn-ghost" onclick={() => (editing = false)}>{T('cancel')}</button></div>
			{:else}
				<dl><dt>{T('name')}</dt><dd>{me.name || '—'}</dd><dt>{T('phoneOnly')}</dt><dd class="num">{fmtPhone(me.phone)}</dd><dt>{T('emailShort')}</dt><dd>{me.email || '—'}</dd></dl>
			{/if}
		</section>

		<section class="card sec">
			<div class="sec-h"><h2>{T('pastOrders')}</h2></div>
			{#if orders === null}<p class="muted">…</p>
			{:else if !orders.length}<div class="none">{#if S.look.miso.pages}<Miso art={noOrdersArt} size={90} decorative />{/if}<p class="muted">{T('noOrders')}</p></div>
			{:else}
				<ul class="orders">
					{#each orders.slice(0, 20) as o (o.id)}
						<li>
							<div class="grow">
								<b>{dayLabel(o.placed_at, S.timezone, L)} · {clock(o.placed_at, S.timezone)}</b>
								<span class="muted small">{o.type === 'delivery' ? T('delivery') : T('pickup')} · {statusLabel(o.status)} · <span class="num">{money(o.money.total_cents)}</span></span>
								<span class="t2 small">{o.lines.map((l) => `${l.qty}× ${l.name}`).join(', ')}</span>
							</div>
							<div class="acts">
								{#if o.status !== 'completed' && o.status !== 'cancelled' && o.track_token}<a class="btn btn-sm" href="{b}/order/{o.track_token}">{T('track')}</a>{/if}
								<button type="button" class="btn btn-sm btn-p" onclick={() => reorder(o)}>{T('reorder')}</button>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section class="card sec">
			<div class="sec-h"><h2>{T('savedAddresses')}</h2>{#if !addr && me.addresses.length < 20}<button type="button" class="btn btn-sm" onclick={() => (addr = { default: !me.addresses.length })}>{T('add')}</button>{/if}</div>
			{#each me.addresses as a (a.id)}
				<div class="item">
					<div class="grow"><b>{a.label || a.line1}{#if a.default} <span class="tag tag-brand">{T('default')}</span>{/if}</b><span class="t2 small">{[a.line1, a.line2, a.city, a.state, a.zip].filter(Boolean).join(', ')}</span>{#if a.notes}<span class="muted small">{a.notes}</span>{/if}</div>
					<button type="button" class="btn btn-sm btn-ghost" onclick={() => (addr = { ...a })}>{T('edit')}</button>
					<button type="button" class="btn btn-icon btn-ghost" aria-label={T('remove')} onclick={() => removeAddress(a.id)}><Icon name="trash" size={18} /></button>
				</div>
			{:else}
				{#if !addr}<p class="muted">{T('noAddresses')}</p>{/if}
			{/each}
			{#if addr}
				<div class="addr-form">
					<label class="field"><span>{T('label')}</span><input bind:value={addr.label} placeholder={T('labelPh')} maxlength="40" /></label>
					<label class="field"><span>{T('address')}</span><input autocomplete="address-line1" bind:value={addr.line1} /></label>
					<div class="fields2">
						<label class="field"><span>{T('apt')}</span><input autocomplete="address-line2" bind:value={addr.line2} /></label>
						<label class="field"><span>{T('zip')}</span><input autocomplete="postal-code" inputmode="numeric" bind:value={addr.zip} /></label>
					</div>
					<label class="field"><span>{T('city')}</span><input autocomplete="address-level2" bind:value={addr.city} /></label>
					<label class="field"><span>{T('driverNotes')}</span><input bind:value={addr.notes} maxlength="300" /></label>
					<label class="optin"><input type="checkbox" bind:checked={addr.default} /><span>{T('makeDefault')}</span></label>
					<div class="row"><button type="button" class="btn btn-p" onclick={saveAddress}>{T('save')}</button><button type="button" class="btn btn-ghost" onclick={() => (addr = null)}>{T('cancel')}</button></div>
				</div>
			{/if}
		</section>

		<section class="card sec">
			<div class="sec-h"><h2>{T('savedCards')}</h2></div>
			{#each me.cards as c (c.id)}
				<div class="item"><Icon name="card" /><div class="grow"><b>{c.brand} •••• {c.last4}</b><span class="muted small">{T('expires', { d: `${String(c.exp_month).padStart(2, '0')}/${String(c.exp_year).slice(-2)}` })}</span></div><button type="button" class="btn btn-sm btn-ghost" onclick={() => removeCard(c.id)}>{T('forget')}</button></div>
			{:else}
				<p class="muted">{T('noCards')}</p>
			{/each}
		</section>

		<div class="row end">
			<button type="button" class="btn" onclick={signOut}>{T('signOut')}</button>
			<button type="button" class="btn btn-ghost danger" onclick={deleteAccount}>{T('deleteAccount')}</button>
		</div>
	{/if}
</div>

<style>
	.wrap { display: flex; flex-direction: column; gap: 16px; padding-top: 8px; padding-bottom: 64px; max-width: 720px; }
	.sec { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
	.sec-h { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
	.sec-h h2 { font-size: 22px; }
	.signin { position: relative; }
	.signin form { display: flex; flex-direction: column; gap: 12px; }
	.miso { align-self: center; }
	.loading { display: flex; justify-content: center; padding: 40px 0; }
	.none { display: flex; align-items: center; gap: 14px; }
	.field { display: flex; flex-direction: column; gap: 4px; min-height: 0; padding: 0; border: 0; background: none; }
	.field > span { font-size: 12px; color: var(--q-muted); font-weight: 600; }
	.field input { min-height: 50px; padding: 8px 14px; border-radius: var(--q-r-md); border: var(--q-border-w) solid var(--q-border-strong); background: var(--q-field-bg); font-size: 16px; }
	.row { display: flex; gap: 10px; flex-wrap: wrap; justify-content: space-between; }
	.row.end { justify-content: flex-start; }
	.small { font-size: 13px; }
	dl { display: grid; grid-template-columns: max-content 1fr; gap: 6px 16px; margin: 0; }
	dt { color: var(--q-muted); font-size: 14px; }
	dd { margin: 0; }
	.orders { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
	.orders li { display: flex; gap: 12px; align-items: center; padding: 12px 0; border-top: var(--q-border-w) solid var(--q-border); }
	.orders li:first-child { border-top: 0; }
	.grow { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
	.acts { display: flex; gap: 6px; flex-shrink: 0; }
	.item { display: flex; gap: 10px; align-items: center; padding: 8px 0; }
	.addr-form { display: flex; flex-direction: column; gap: 10px; border-top: var(--q-border-w) solid var(--q-border); padding-top: 12px; }
	.optin { display: flex; gap: 10px; align-items: center; font-size: 14px; color: var(--q-text2); }
	.optin input { width: 20px; height: 20px; accent-color: var(--q-brand); }
	.danger { color: var(--q-bad); }
	@media (max-width: 520px) { .orders li { flex-direction: column; align-items: stretch; } .acts { justify-content: flex-end; } }
</style>
