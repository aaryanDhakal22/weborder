<script lang="ts">
	import Icon from './Icon.svelte';
	import type { Lang, StoreStatus, StoreView } from '$lib/types';
	import { weekRows, fmtPhone, telHref } from '$lib/fmt';
	import { t } from '$lib/i18n';

	let { store, status, lang }: { store: StoreView; status: StoreStatus | null; lang: Lang } = $props();
	const rows = $derived(weekRows(status?.week ?? (status ? [status.today] : []), lang, t(lang, 'closed'), t(lang, 'openAlways'), status?.hours_set ?? true));
	const delivery = $derived(status?.order_types.delivery);
	const miles = $derived(delivery?.radius_m ? Math.round((delivery.radius_m / 1609.34) * 10) / 10 : 0);
	const where = $derived([store.address.line1, store.address.line2].filter(Boolean).join(', '));
	const mapsHref = $derived(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store.name} ${where}`)}`);
</script>

<div class="info-grid">
	<div class="card hours-card">
		<h2 class="h">{t(lang, 'hours')}</h2>
		<div class="hours">
			{#each rows as r (r.date)}
				<span class="d" class:today={r.today}>{r.day}</span><span class="num" class:today={r.today}>{r.text}{r.today ? ` · ${t(lang, 'today')}` : ''}{#if r.note}<em class="note">{` · ${r.note}`}</em>{/if}</span>
			{/each}
		</div>
		{#if where || store.phone}
			<div class="hr"></div>
			<address>
				{#if where}<a href={mapsHref} rel="noopener" target="_blank"><Icon name="pin" size={18} /> {where}</a>{/if}
				{#if store.phone}<a href={telHref(store.phone)}><Icon name="phone" size={18} /> {fmtPhone(store.phone)}</a>{/if}
			</address>
		{/if}
	</div>
	<div class="mapbox">
		{#if delivery?.enabled}
			<svg viewBox="0 0 400 220" width="100%" height="220" preserveAspectRatio="xMidYMid slice" role="img" aria-label={t(lang, 'deliveryArea', { mi: miles })}>
				<rect width="400" height="220" fill="var(--q-elev)" />
				<g stroke="var(--q-border-strong)" stroke-width="6" fill="none" opacity=".55"><path d="M-10 70 L410 110" /><path d="M120 -10 L160 230" /><path d="M260 -10 L230 230" /><path d="M-10 170 Q200 140 410 190" /></g>
				<g stroke="var(--q-border)" stroke-width="2" fill="none"><path d="M0 30h400M0 130h400M60 0v220M330 0v220M190 0v220" /></g>
				<circle cx="200" cy="110" r="84" fill="var(--q-brand)" fill-opacity=".14" stroke="var(--q-brand)" stroke-width="2" stroke-dasharray="6 6" />
				<circle cx="200" cy="110" r="10" fill="var(--q-brand)" /><circle cx="200" cy="110" r="4" fill="var(--q-on-brand)" />
				{#if miles}<text x="200" y="210" text-anchor="middle" font-size="12" font-weight="600" fill="var(--q-text2)">{t(lang, 'deliveryArea', { mi: miles })}</text>{/if}
			</svg>
		{:else}
			<div class="pickup-note"><Icon name="store" size={32} /><b>{t(lang, 'pickupOnly')}</b>{#if store.address.line1}<span class="t2">{store.address.line1}</span>{/if}</div>
		{/if}
	</div>
</div>

<style>
	.hours-card { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
	.h { font-size: 22px; }
	.note { color: var(--q-warn); font-style: normal; }
	address { font-style: normal; display: flex; flex-direction: column; gap: 8px; font-size: 15px; }
	address a { display: flex; gap: 8px; align-items: center; }
	.pickup-note { display: grid; place-items: center; height: 100%; min-height: 200px; gap: 8px; text-align: center; padding: 20px; }
</style>
