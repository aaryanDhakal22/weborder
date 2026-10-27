<!-- Miso, the quicc cat chef. Flat line art in the store's own colors (--q-fur, --q-mline, --q-brand). -->
<script lang="ts">
	type Pose = 'idle' | 'busy' | 'paused' | 'sleep' | 'happy' | 'dough' | 'scooter' | 'bowl' | 'map' | 'card' | 'lost' | 'ticket' | 'wave';
	let { pose = 'idle', size = 140, label = 'Miso the cat chef' }: { pose?: Pose; size?: number; label?: string } = $props();

	const look = $derived(({ busy: 'side', paused: 'tired', sleep: 'closed', happy: 'happy', dough: 'up', scooter: 'normal', bowl: 'down', map: 'worried', card: 'worried', lost: 'up', ticket: 'happy', wave: 'happy', idle: 'normal' } as const)[pose]);
</script>

<svg class="mascot" width={size} height={Math.round(size * 0.9)} viewBox="0 0 160 144" role="img" aria-label={label}>
	{#if pose === 'dough'}
		<ellipse class="hat line" cx="128" cy="24" rx="18" ry="7" stroke-width="3" /><path class="line" d="M116 40l-4 6M128 38v7M140 40l4 6" stroke-width="2.5" opacity=".7" />
	{:else if pose === 'lost'}
		<text x="118" y="40" font-size="34" font-weight="800" fill="var(--q-text)" font-family="Barlow Condensed, sans-serif">?</text>
	{:else if pose === 'happy'}
		<path class="line" d="M24 40l4 4M20 58h6M136 40l-4 4M140 58h-6" stroke-width="3" opacity=".7" />
	{/if}
	<g class="bob">
		<path class="fur line" d="M52 98q28 16 56 0l8 36H44Z" stroke-width="3" />
		<path class="fur line" d="M52 52 45 22l27 17Z" stroke-width="3" /><path class="fur line" d="M108 52l7-30-27 17Z" stroke-width="3" />
		<ellipse class="fur line" cx="80" cy="72" rx="37" ry="31" stroke-width="3" />
		{#if pose === 'sleep'}
			<g transform="rotate(-14 80 30)"><circle class="hat line" cx="66" cy="26" r="11" stroke-width="3" /><circle class="hat line" cx="80" cy="19" r="13" stroke-width="3" /><circle class="hat line" cx="94" cy="26" r="11" stroke-width="3" /><rect class="hat line" x="59" y="29" width="42" height="13" rx="4" stroke-width="3" /></g>
		{:else}
			<circle class="hat line" cx="65" cy="26" r="12" stroke-width="3" /><circle class="hat line" cx="80" cy="18" r="15" stroke-width="3" /><circle class="hat line" cx="95" cy="26" r="12" stroke-width="3" /><rect class="hat line" x="58" y="29" width="44" height="14" rx="4" stroke-width="3" />
		{/if}
		{#if look === 'normal'}
			<circle class="ink" cx="66" cy="70" r="4.5" /><circle class="ink" cx="94" cy="70" r="4.5" />
		{:else if look === 'side'}
			<path class="line" d="M58 66.5h15M86 66.5h15" stroke-width="3" /><circle class="ink" cx="71" cy="71" r="3.6" /><circle class="ink" cx="99" cy="71" r="3.6" />
		{:else if look === 'closed'}
			<path class="line" d="M59 71q7 5 14 0M87 71q7 5 14 0" fill="none" stroke-width="3" />
		{:else if look === 'happy'}
			<path class="line" d="M59 73q7-8 14 0M87 73q7-8 14 0" fill="none" stroke-width="3" />
		{:else if look === 'down'}
			<circle class="ink" cx="66" cy="75" r="4" /><circle class="ink" cx="94" cy="75" r="4" />
		{:else if look === 'tired'}
			<path class="line" d="M59 69h14M87 69h14" stroke-width="3" /><circle class="ink" cx="66" cy="72.5" r="2.6" /><circle class="ink" cx="94" cy="72.5" r="2.6" />
		{:else if look === 'worried'}
			<circle class="ink" cx="66" cy="71" r="4.2" /><circle class="ink" cx="94" cy="71" r="4.2" /><path class="line" d="M58 61l13 3M102 61l-13 3" stroke-width="3" />
		{:else}
			<circle class="ink" cx="63" cy="66" r="4.2" /><circle class="ink" cx="91" cy="66" r="4.2" />
		{/if}
		<ellipse class="blush" cx="58" cy="84" rx="6.5" ry="3.5" /><ellipse class="blush" cx="102" cy="84" rx="6.5" ry="3.5" />
		<path class="ink" d="M76 80h8l-4 5Z" />
		<path class="line" d="M80 85q-4 5-9 3M80 85q4 5 9 3M48 79H32M48 85l-14 4M112 79h16M112 85l14 4" fill="none" stroke-width="2.5" />
	</g>
	{#if pose === 'busy' || pose === 'paused'}
		<g class="steam"><path class="line" d="M38 96q-6-8 0-14t0-14" fill="none" stroke-width="2.5" opacity=".7" /><path class="line" d="M124 98q6-8 0-14t0-14" fill="none" stroke-width="2.5" opacity=".7" /></g>
		<path class="line" d="M104 112l18-30" stroke-width="5" />
		<rect class="prop line" x="34" y="108" width="92" height="28" rx="8" stroke-width="3" /><path class="line" d="M28 110h104" stroke-width="4" />
		{#if pose === 'paused'}<path class="line" d="M116 44q4 6 0 9q-4-3 0-9Z" fill="#6BA8FF" stroke-width="2" />{/if}
	{:else if pose === 'sleep'}
		<rect class="prop line" x="22" y="112" width="116" height="24" rx="4" stroke-width="3" /><path class="line" d="M22 120h116" stroke-width="2" opacity=".6" />
		<g class="zz"><text x="120" y="38" font-size="20" font-weight="800" fill="var(--q-text)" font-family="Barlow Condensed, sans-serif">z</text><text x="132" y="24" font-size="14" font-weight="800" fill="var(--q-text)" font-family="Barlow Condensed, sans-serif">z</text></g>
	{:else if pose === 'scooter'}
		<path class="line" d="M30 128h92l10-30h10" fill="none" stroke-width="5" /><circle class="prop line" cx="40" cy="130" r="9" stroke-width="3" /><circle class="prop line" cx="122" cy="130" r="9" stroke-width="3" />
		<path class="line" d="M6 104h16M2 114h18M8 124h12" stroke-width="2.5" opacity=".6" />
	{:else if pose === 'bowl'}
		<path class="prop line" d="M40 110h80q-4 26-40 26t-40-26Z" stroke-width="3" />
	{:else if pose === 'map'}
		<path class="hat line" d="M36 106l26-6 30 6 32-6v32l-32 6-30-6-26 6Z" stroke-width="3" /><path class="line" d="M62 100v32M92 106v32" stroke-width="2.5" /><circle class="prop" cx="108" cy="116" r="4" />
	{:else if pose === 'card'}
		<rect class="prop line" x="54" y="104" width="52" height="32" rx="5" stroke-width="3" /><path class="line" d="M54 114h52" stroke-width="4" /><path class="line" d="M118 96l10-10M126 102l12-2" stroke-width="2.5" opacity=".7" />
	{:else if pose === 'ticket'}
		<rect class="hat line" x="100" y="92" width="38" height="44" rx="3" stroke-width="3" /><path class="line" d="M108 104h22M108 112h22M108 120h14" stroke-width="2.5" />
	{:else if pose === 'wave'}
		<circle class="fur line" cx="126" cy="92" r="10" stroke-width="3" /><path class="line" d="M136 74l6-6M142 84h8" stroke-width="2.5" opacity=".7" />
	{/if}
</svg>
