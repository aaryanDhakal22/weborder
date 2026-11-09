<!-- Miso, the quicc cat chef (src/lib/miso). `art` is one scene's SVG, imported where it is used
     (`import peek from '$lib/miso/art/miso-peek.svg?raw'`), so a page ships only its own scenes.
     The box is reserved before the art paints. Motion starts only when the visitor allows it. -->
<script lang="ts">
	import { prepare } from '$lib/miso';

	let {
		art,
		size = 140,
		label = 'Miso the cat chef',
		decorative = false
	}: { art: string; size?: number; label?: string; decorative?: boolean } = $props();

	const uid = $props.id();
	const m = $derived(prepare(art, uid, decorative ? null : label));
	let el = $state<HTMLElement>();

	$effect(() => {
		void m.svg;
		const go = el?.querySelector<SVGAnimationElement>('animate[data-go]');
		if (!go || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		go.beginElement();
	});
</script>

<span class="miso-art" bind:this={el} style:width="{size}px" style:height="{Math.round((size * m.h) / m.w)}px">{@html m.svg}</span>
