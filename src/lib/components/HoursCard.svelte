<script lang="ts">
	import Icon from './Icon.svelte';
	import type { Lang, PublicStore } from '$lib/types';
	import { hourRows, localNow } from '$lib/hours';
	import { t } from '$lib/i18n';

	let { store, lang }: { store: PublicStore; lang: Lang } = $props();
	const rows = $derived(hourRows(store.hours, lang, t(lang, 'closed')));
	const today = $derived(localNow(new Date(), store.timezone).day);
	const miles = $derived(Math.round(store.deliveryRadiusM / 1609));
	const mapsHref = $derived(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store.name} ${store.address.line1} ${store.address.city} ${store.address.state}`)}`);
</script>

<div class="info-grid">
	<div class="card hours-card">
		<h2 class="h">{t(lang, 'hours')}</h2>
		<div class="hours">
			{#each rows as r (r.label)}
				<span class="d" class:today={r.days.includes(today)}>{r.label}</span><span class="num" class:today={r.days.includes(today)}>{r.text}{r.days.includes(today) ? ` · ${t(lang, 'today')}` : ''}</span>
			{/each}
		</div>
		<div class="hr"></div>
		<address>
			<a href={mapsHref} rel="noopener" target="_blank"><Icon name="pin" size={18} /> {store.address.line1}, {store.address.city}, {store.address.state} {store.address.zip}</a>
			<a href="tel:{store.phone.replace(/\D/g, '')}"><Icon name="phone" size={18} /> {store.phone}</a>
		</address>
	</div>
	<div class="mapbox">
		{#if store.settings.delivery}
			<svg viewBox="0 0 400 220" width="100%" height="220" preserveAspectRatio="xMidYMid slice" role="img" aria-label={t(lang, 'deliveryArea', { mi: miles })}>
				<rect width="400" height="220" fill="var(--q-elev)" />
				<g stroke="var(--q-border-strong)" stroke-width="6" fill="none" opacity=".55"><path d="M-10 70 L410 110" /><path d="M120 -10 L160 230" /><path d="M260 -10 L230 230" /><path d="M-10 170 Q200 140 410 190" /></g>
				<g stroke="var(--q-border)" stroke-width="2" fill="none"><path d="M0 30h400M0 130h400M60 0v220M330 0v220M190 0v220" /></g>
				<circle cx="200" cy="110" r="84" fill="var(--q-brand)" fill-opacity=".14" stroke="var(--q-brand)" stroke-width="2" stroke-dasharray="6 6" />
				<circle cx="200" cy="110" r="10" fill="var(--q-brand)" /><circle cx="200" cy="110" r="4" fill="var(--q-on-brand)" />
				<text x="200" y="210" text-anchor="middle" font-size="12" font-weight="600" fill="var(--q-text2)">{t(lang, 'deliveryArea', { mi: miles })}</text>
			</svg>
		{:else}
			<div class="pickup-note"><Icon name="store" size={32} /><b>{t(lang, 'pickupOnly')}</b><span class="t2">{store.address.line1}</span></div>
		{/if}
	</div>
</div>

<style>
	.hours-card { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
	.h { font-size: 22px; }
	address { font-style: normal; display: flex; flex-direction: column; gap: 8px; font-size: 15px; }
	address a { display: flex; gap: 8px; align-items: center; }
	.pickup-note { display: grid; place-items: center; height: 100%; min-height: 200px; gap: 8px; text-align: center; padding: 20px; }
</style>
