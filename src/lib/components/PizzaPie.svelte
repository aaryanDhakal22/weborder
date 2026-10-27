<!-- A drawn pie that shows the chosen toppings on the whole pie, the left half or the right half. -->
<script lang="ts">
	import type { Portion } from '$lib/types';
	let { toppings }: { toppings: { id: string; name: string; p: Portion }[] } = $props();

	const COLORS = ['#B23A26', '#EFE6D6', '#C98BD6', '#3E7D3A', '#2B2B2B', '#E8A23B', '#8B4A2B', '#F2E3A0', '#D9534F', '#6B8E23'];
	const LEFT = [[70, 72], [58, 100], [80, 120], [62, 140], [84, 152], [72, 90], [52, 124], [90, 98]];
	const RIGHT = [[150, 72], [162, 100], [140, 120], [158, 140], [136, 152], [148, 90], [168, 124], [130, 98]];
	function spots(p: Portion, i: number) {
		const pick = (arr: number[][]) => arr.filter((_, k) => (k + i) % 2 === 0).map(([x, y]) => [x + ((i * 7) % 9) - 4, y + ((i * 5) % 9) - 4]);
		return p === 'left' ? pick(LEFT) : p === 'right' ? pick(RIGHT) : [...pick(LEFT), ...pick(RIGHT)];
	}
</script>

<svg class="pie" viewBox="0 0 220 240" role="img" aria-label={toppings.length ? `Pizza with ${toppings.map((t) => `${t.name}${t.p === 'whole' ? '' : ` on the ${t.p} half`}`).join(', ')}` : 'Cheese pizza'}>
	<circle cx="110" cy="110" r="104" fill="#D9A45A" /><circle cx="110" cy="110" r="92" fill="#C8452D" /><circle cx="110" cy="110" r="88" fill="#F2CF6B" />
	<circle cx="96" cy="80" r="16" fill="#F7DC86" opacity=".7" /><circle cx="130" cy="140" r="20" fill="#F7DC86" opacity=".6" />
	{#each toppings as tp, i (tp.id)}
		{#each spots(tp.p, i) as [x, y], k (k)}
			{#if i % 3 === 0}<circle cx={x} cy={y} r="8" fill={COLORS[i % COLORS.length]} stroke="rgba(0,0,0,.25)" stroke-width="1" />
			{:else if i % 3 === 1}<rect x={x - 6} y={y - 5} width="12" height="10" rx="3" fill={COLORS[i % COLORS.length]} stroke="rgba(0,0,0,.3)" stroke-width="1" />
			{:else}<path d="M{x - 8} {y}a8 8 0 0 1 16 0" fill="none" stroke={COLORS[i % COLORS.length]} stroke-width="3" />{/if}
		{/each}
	{/each}
	<path d="M110 6v208" stroke="var(--q-surface)" stroke-width="3" stroke-dasharray="6 6" opacity=".9" />
	<text x="40" y="234" font-size="13" font-weight="700" fill="var(--q-text2)" font-family="var(--q-font-body)">LEFT</text>
	<text x="140" y="234" font-size="13" font-weight="700" fill="var(--q-text2)" font-family="var(--q-font-body)">RIGHT</text>
</svg>
