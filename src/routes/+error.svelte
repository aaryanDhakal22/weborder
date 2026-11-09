<script lang="ts">
	import { page } from '$app/state';
	import Miso from '$lib/components/Miso.svelte';
	import lostArt from '$lib/miso/art/miso-lost.svg?raw';
	import pausedArt from '$lib/miso/art/miso-paused.svg?raw';
	import { t } from '$lib/i18n';
	import '$lib/styles/site.css';

	const L = $derived((page.data?.lang ?? 'en') as 'en' | 'es');
	const b = $derived(page.data?.base ?? '');
</script>

<svelte:head><title>{page.status === 404 ? t(L, 'lostTitle') : 'Something went wrong'}</title><meta name="robots" content="noindex" /></svelte:head>

{#if page.data?.theme}
	{@html `<style>${page.data.theme.fontFaces}${page.data.theme.css}</style>`}
{/if}
<div class="sf">
	<div class="state">
		<Miso art={page.status === 404 ? lostArt : pausedArt} size={170} decorative />
		<h1>{page.status === 404 ? t(L, 'lostTitle') : (L === 'es' ? 'Algo salió mal' : 'Something went wrong')}</h1>
		<p>{page.status === 404 ? t(L, 'lostSub') : page.error?.message}</p>
		<div class="actions"><a class="btn btn-p btn-lg btn-block" href="{b}/menu">{t(L, 'backMenu')}</a><a class="btn btn-lg btn-block" href={b || '/'}>{t(L, 'home')}</a></div>
	</div>
</div>

<style>
	.actions { display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 340px; }
	.state h1 { font-size: 34px; }
</style>
