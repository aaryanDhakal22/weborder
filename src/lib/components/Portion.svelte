<script lang="ts">
	let { kind }: { kind: 'whole' | 'left' | 'right' } = $props();
	const d = $derived(kind === 'left' ? 'M12 4a8 8 0 0 0 0 16Z' : kind === 'right' ? 'M12 4a8 8 0 0 1 0 16Z' : 'M12 4a8 8 0 1 1 0 16a8 8 0 1 1 0-16Z');
</script>

<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2" /><path {d} fill="currentColor" /></svg>
