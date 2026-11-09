<!-- The stand-in for an item photo: a large initial on the brand colour, with the item's sizes. -->
<script lang="ts">
	let { name, sizes = [], small = false }: { name: string; sizes?: string[]; small?: boolean } = $props();
	import { initials } from '$lib/menu';
	const letter = $derived(initials(name));
</script>

<span class="itile" class:small aria-hidden="true">
	<b>{letter}</b>
	{#if sizes.length > 1 && !small}<i>{sizes.slice(0, 4).join(' · ')}</i>{/if}
</span>

<style>
	.itile { position: relative; display: grid; place-items: center; aspect-ratio: 1; border-radius: var(--q-r-md); overflow: hidden;
		background: radial-gradient(120% 90% at 20% 10%, color-mix(in srgb, var(--q-brand) 34%, var(--q-elev)), var(--q-elev) 70%); color: var(--q-brand-ink); }
	.itile b { font: var(--q-display-weight, 800) 64px/1 var(--q-font-display); text-transform: uppercase; }
	.itile i { position: absolute; left: 0; right: 0; bottom: 8px; text-align: center; font: 600 11px/1.2 var(--q-font-num); font-style: normal; color: var(--q-text2); padding: 0 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.itile.small { width: 64px; height: 64px; flex-shrink: 0; }
	.itile.small b { font-size: 30px; }
</style>
