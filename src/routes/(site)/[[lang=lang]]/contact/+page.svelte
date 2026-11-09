<script lang="ts">
	import HoursCard from '$lib/components/HoursCard.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { t } from '$lib/i18n';
	import { fmtPhone, telHref } from '$lib/fmt';

	let { data } = $props();
	const S = $derived(data.store);
	const L = $derived(data.lang);
	const b = $derived(data.base);
	const where = $derived([S.address.line1, S.address.line2].filter(Boolean).join(', '));
	const title = $derived(`${t(L, 'hours')} & ${t(L, 'contact')} · ${S.name}${S.address.line2 ? `, ${S.address.line2}` : ''}`);
	const desc = $derived(`${S.name}${where ? `, ${where}` : ''}.${S.phone ? ` ${fmtPhone(S.phone)}.` : ''}`);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={desc} />
	<link rel="canonical" href="{data.origin}{b}/contact" />
</svelte:head>

<div class="pad head">
	<span class="eyebrow">{S.name}</span>
	<h1>{t(L, 'visit')}</h1>
	{#if where}<p class="t2">{where}</p>{/if}
	<div class="ctas"><a class="btn btn-p" href="{b}/menu">{t(L, 'startOrder')}</a>{#if S.phone}<a class="btn" href={telHref(S.phone)}><Icon name="phone" size={18} /> {fmtPhone(S.phone)}</a>{/if}</div>
</div>
<section class="section pad"><HoursCard store={S} status={data.status} lang={L} /></section>

<style>
	.head { padding-top: 28px; display: flex; flex-direction: column; gap: 12px; }
	.head h1 { font-size: clamp(40px, 8vw, 64px); }
	.ctas { display: flex; gap: 10px; flex-wrap: wrap; }
</style>
