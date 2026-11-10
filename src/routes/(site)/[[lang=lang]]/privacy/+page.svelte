<script lang="ts">
	import { t } from '$lib/i18n';

	let { data } = $props();
	const T = (k: Parameters<typeof t>[1]) => t(data.lang, k);
</script>

<svelte:head>
	<title>{T('privacyTitle')} · {data.store.name}</title>
	<link rel="canonical" href="{data.origin}{data.base}/privacy" />
</svelte:head>

<div class="backbar pad"><h1>{T('privacyTitle')}</h1></div>
<article class="pad policy">
	{#each data.privacy.paragraphs as p, i (i)}<p class:lead={i === 0 && !data.privacy.custom}>{p}</p>{/each}
</article>

<style>
	.policy { display: flex; flex-direction: column; gap: 14px; max-width: 70ch; padding-block: 20px 40px; }
	.policy p { color: var(--q-text2); line-height: 1.6; white-space: pre-line; }
	.policy p.lead { color: var(--q-text); font-weight: 600; }
</style>
