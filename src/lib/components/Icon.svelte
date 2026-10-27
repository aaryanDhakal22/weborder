<script lang="ts" module>
	const P: Record<string, string> = {
		cart: '<path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6"/><circle cx="10" cy="20.5" r="1.3"/><circle cx="17" cy="20.5" r="1.3"/>',
		bag: '<path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
		user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
		search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
		pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
		clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
		down: '<path d="m6 9 6 6 6-6"/>', right: '<path d="m9 6 6 6-6 6"/>', left: '<path d="m15 6-6 6 6 6"/>',
		plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>', check: '<path d="m5 12 5 5 9-10"/>',
		flame: '<path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5Z"/>',
		tag: '<path d="M3 12V4h8l10 10-8 8L3 12Z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
		home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9Z"/>',
		list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
		phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
		bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4l2-2Z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
		scooter: '<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17h8l3-9h3M14 8h-3"/>',
		card: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/>',
		cash: '<rect x="3" y="7" width="18" height="11" rx="2"/><circle cx="12" cy="12.5" r="2.5"/>',
		store: '<path d="M4 9l1-5h14l1 5M4 9v11h16V9M4 9h16M9 20v-6h6v6"/>',
		spark: '<path d="M12 3v5M12 16v5M3 12h5M16 12h5"/>',
		share: '<path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11H5v10h14V11h-1"/>',
		addsq: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/>',
		globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
		trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
		info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'
	};
</script>

<script lang="ts">
	let { name, size = 20, stroke = 2 }: { name: string; size?: number; stroke?: number } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={stroke} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{@html P[name] ?? ''}</svg>
