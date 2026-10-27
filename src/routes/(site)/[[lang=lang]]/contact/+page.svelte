<script lang="ts">
	import HoursCard from '$lib/components/HoursCard.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { t } from '$lib/i18n';

	let { data } = $props();
	const S = $derived(data.store);
	const L = $derived(data.lang);
	const b = $derived(data.base);
	const title = $derived(`${t(L, 'hours')} & ${t(L, 'contact')} · ${S.name}, ${S.address.city}, ${S.address.state}`);
	const desc = $derived(`${S.name}, ${S.address.line1}, ${S.address.city}, ${S.address.state} ${S.address.zip}. ${S.phone}.`);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={desc} />
	<link rel="canonical" href="{data.origin}{b}/contact" />
</svelte:head>

<div class="pad head">
	<span class="eyebrow">{S.cuisine.join(' · ')}</span>
	<h1>{t(L, 'visit')}</h1>
	<p class="t2">{S.address.line1}, {S.address.city}, {S.address.state} {S.address.zip}</p>
	<div class="ctas"><a class="btn btn-p" href="{b}/menu">{t(L, 'startOrder')}</a><a class="btn" href="tel:{S.phone.replace(/\D/g, '')}"><Icon name="phone" size={18} /> {S.phone}</a></div>
</div>
<section class="section pad"><HoursCard store={S} lang={L} /></section>

<style>
	.head { padding-top: 28px; display: flex; flex-direction: column; gap: 12px; }
	.head h1 { font-size: clamp(40px, 8vw, 64px); }
	.ctas { display: flex; gap: 10px; flex-wrap: wrap; }
</style>
