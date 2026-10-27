<script lang="ts" module>
	const ART: Record<string, string> = {
		pizza: '<circle cx="60" cy="40" r="30" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="60" cy="40" r="22" fill="none" stroke="currentColor" stroke-width="2" opacity=".6"/><circle cx="52" cy="33" r="4" fill="currentColor"/><circle cx="68" cy="36" r="4" fill="currentColor"/><circle cx="58" cy="49" r="4" fill="currentColor"/>',
		cup: '<path d="M38 26h40l-4 34a6 6 0 0 1-6 5H48a6 6 0 0 1-6-5Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M78 34h6a7 7 0 0 1 0 14h-8" fill="none" stroke="currentColor" stroke-width="3"/><path d="M50 18q-4-6 0-10M62 18q-4-6 0-10" fill="none" stroke="currentColor" stroke-width="2.5" opacity=".6"/>',
		croissant: '<path d="M24 54q8-34 36-36t36 36q-12 6-20-4-8 10-16 10t-16-10q-8 10-20 4Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M48 24l6 26M72 24l-6 26" stroke="currentColor" stroke-width="2.5" opacity=".6"/>',
		bread: '<path d="M26 58V36q0-16 34-16t34 16v22Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M44 30l10 10M60 28l10 10M76 30l8 8" stroke="currentColor" stroke-width="2.5" opacity=".6"/>',
		toast: '<rect x="30" y="22" width="60" height="40" rx="10" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="50" cy="40" r="6" fill="currentColor" opacity=".6"/><circle cx="68" cy="44" r="5" fill="currentColor" opacity=".4"/>',
		bun: '<circle cx="60" cy="42" r="24" fill="none" stroke="currentColor" stroke-width="3"/><path d="M48 42a12 12 0 1 0 24 0a12 12 0 1 0-24 0" fill="none" stroke="currentColor" stroke-width="2.5" opacity=".6"/>',
		cake: '<path d="M30 60V36h60v24Z M30 46h60" fill="none" stroke="currentColor" stroke-width="3"/><path d="M60 36v-10" stroke="currentColor" stroke-width="3"/><path d="M60 22q-3-4 0-8q3 4 0 8Z" fill="currentColor"/>',
		taco: '<path d="M22 56a38 38 0 0 1 76 0Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M34 46q8-10 16 0t16 0 16 0" fill="none" stroke="currentColor" stroke-width="2.5" opacity=".6"/>',
		drink: '<path d="M44 16h32l-5 48H49Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M62 16l6-10" stroke="currentColor" stroke-width="3"/><path d="M47 34h26" stroke="currentColor" stroke-width="2" opacity=".6"/>',
		bowl: '<path d="M26 34h68q-4 28-34 28T26 34Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M48 26q-4-6 0-10M62 26q-4-6 0-10M76 26q-4-6 0-10" fill="none" stroke="currentColor" stroke-width="2.5" opacity=".6"/>',
		sub: '<rect x="18" y="30" width="84" height="22" rx="11" fill="none" stroke="currentColor" stroke-width="3"/><path d="M28 41h64" stroke="currentColor" stroke-width="2.5" stroke-dasharray="6 5" opacity=".6"/>',
		wings: '<path d="M30 52q-6-22 14-28 12-4 18 8 6-10 18-6 18 6 10 28Z" fill="none" stroke="currentColor" stroke-width="3"/>',
		fries: '<path d="M38 64l-4-30h52l-4 30Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M44 34V14M52 34V10M60 34V16M68 34V12M76 34V18" stroke="currentColor" stroke-width="3"/>',
		salad: '<path d="M26 40h68q-4 24-34 24T26 40Z" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="48" cy="34" r="7" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="66" cy="32" r="8" fill="none" stroke="currentColor" stroke-width="2.5"/>',
		burger: '<path d="M30 36a30 18 0 0 1 60 0Z M28 44h64 M30 52h60a4 4 0 0 1-4 8H34a4 4 0 0 1-4-8Z" fill="none" stroke="currentColor" stroke-width="3"/>',
		burrito: '<rect x="20" y="28" width="80" height="26" rx="13" fill="none" stroke="currentColor" stroke-width="3" transform="rotate(-12 60 41)"/>'
	};
</script>

<script lang="ts">
	let { art = 'bowl', label = '' }: { art?: string; label?: string } = $props();
</script>

<div class="photo" role={label ? 'img' : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : 'true'}>
	<svg width="120" height="80" viewBox="0 0 120 80">{@html ART[art] ?? ART.bowl}</svg>
</div>
