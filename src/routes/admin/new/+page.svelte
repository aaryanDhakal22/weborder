<script lang="ts">
	import { enhance } from '$app/forms';
	import { slugify } from '$lib/util';

	let { data, form } = $props();
	let name = $state('');
	let slug = $state('');
	let slugTouched = $state(false);
	let preset = $state('pizzeria-loud');
	let brand = $state('#AC94F4');
	let type = $state('pizza_delivery');
	let busy = $state(false);
	let logoNote = $state('');
	$effect(() => {
		if (!slugTouched) slug = slugify(name);
	});

	// Picks the dominant, usable color from a logo in the browser (canvas, no upload, no library).
	async function fromLogo(e: Event) {
		const file = (e.currentTarget as HTMLInputElement).files?.[0];
		if (!file) return;
		const img = new Image();
		img.src = URL.createObjectURL(file);
		await img.decode();
		const c = document.createElement('canvas');
		c.width = c.height = 64;
		const ctx = c.getContext('2d')!;
		ctx.drawImage(img, 0, 0, 64, 64);
		const px = ctx.getImageData(0, 0, 64, 64).data;
		const buckets = new Map<string, { n: number; r: number; g: number; b: number }>();
		for (let i = 0; i < px.length; i += 4) {
			const [r, g, b, a] = [px[i], px[i + 1], px[i + 2], px[i + 3]];
			const max = Math.max(r, g, b), min = Math.min(r, g, b);
			if (a < 200 || max < 40 || min > 225 || max - min < 40) continue;
			const k = `${r >> 4},${g >> 4},${b >> 4}`;
			const v = buckets.get(k) ?? { n: 0, r: 0, g: 0, b: 0 };
			v.n++; v.r += r; v.g += g; v.b += b;
			buckets.set(k, v);
		}
		const best = [...buckets.values()].sort((x, y) => y.n - x.n)[0];
		if (!best) { logoNote = 'No strong color in that logo; keep the preset color or type one.'; return; }
		const hex = '#' + [best.r, best.g, best.b].map((v) => Math.round(v / best.n).toString(16).padStart(2, '0')).join('').toUpperCase();
		brand = hex;
		logoNote = `Picked ${hex} from the logo.`;
	}
</script>

<header class="ph"><div><div class="crumbs"><a href="/admin">Stores</a> / New store</div><h1>New store</h1><p>Name, address, a look and the menu. Everything else (pages, SEO, app icon, deals hub) is generated.</p></div></header>

{#if form?.created}
	<div class="card"><div class="card-b">
		<p class="okbox">{form.created.name} is created as a draft. Nobody can see it until you publish.</p>
		{#if form.report}
			<div class="grid3">
				<div class="subcard" style="padding:12px"><span class="eyebrow">Items imported</span><div class="mono" style="font-size:22px;font-weight:700">{form.report.stats.items}</div></div>
				<div class="subcard" style="padding:12px"><span class="eyebrow">POS leftovers dropped</span><div class="mono" style="font-size:22px;font-weight:700">{form.report.stats.dropped}</div></div>
				<div class="subcard" style="padding:12px"><span class="eyebrow">Marked popular</span><div class="mono" style="font-size:22px;font-weight:700">{form.report.stats.popular}</div></div>
			</div>
			<details><summary>Cleanup report ({form.report.notes.length} notes)</summary>
				<table class="mini"><thead><tr><th>What</th><th>Item</th><th>Why</th></tr></thead><tbody>
					{#each form.report.notes as n, i (i)}<tr><td><span class="badge {n.kind === 'dropped' ? 'b-warn' : n.kind === 'popular' ? 'b-ok' : 'b-mute'}">{n.kind}</span></td><td>{n.item}</td><td class="t2">{n.reason}</td></tr>{/each}
				</tbody></table>
			</details>
		{/if}
		<div class="row" style="gap:8px"><a class="btn btn-p" href="/admin/stores/{form.created.id}">Open store settings</a><a class="btn" href={form.created.preview} target="_blank" rel="noopener">Preview the site</a></div>
	</div></div>
{:else}
	<form method="POST" enctype="multipart/form-data" class="stack" use:enhance={() => { busy = true; return async ({ update }) => { busy = false; await update(); }; }}>
		{#if form?.error}<p class="errorbox">{form.error}</p>{/if}
		<div class="card"><div class="card-h"><h2>1. The store</h2></div><div class="card-b">
			<div class="grid2">
				<label><span class="lbl">Name</span><input class="field" name="name" required bind:value={name} placeholder="Lombardi's" /></label>
				<label><span class="lbl">Web address</span><span class="row" style="gap:6px"><input class="field mono" name="slug" bind:value={slug} oninput={() => (slugTouched = true)} /><span class="muted mono">.quiccpos.com</span></span></label>
			</div>
			<div><span class="lbl">Kind of store</span>
				<div class="seg">
					{#each [['pizza_delivery', 'Pizza & delivery'], ['restaurant', 'Restaurant, delivery + pickup'], ['pickup_only', 'Pickup only']] as [v, l] (v)}
						<label><input type="radio" name="storeType" value={v} bind:group={type} class="sr-only" style="position:absolute;opacity:0" /><span class:on={type === v}>{l}</span></label>
					{/each}
				</div>
			</div>
			<div class="grid3">
				<label><span class="lbl">Street</span><input class="field" name="line1" required placeholder="931 Taylor Ave" /></label>
				<label><span class="lbl">City</span><input class="field" name="city" required placeholder="Towson" /></label>
				<div class="grid2"><label><span class="lbl">State</span><input class="field" name="state" maxlength="2" required placeholder="MD" /></label><label><span class="lbl">ZIP</span><input class="field mono" name="zip" inputmode="numeric" maxlength="5" required /></label></div>
			</div>
			<div class="grid3">
				<label><span class="lbl">Phone</span><input class="field" name="phone" type="tel" required placeholder="(410) 555-0142" /></label>
				<label><span class="lbl">Cuisine</span><input class="field" name="cuisine" placeholder="Pizza, Subs, Wings" /></label>
				<label><span class="lbl">Timezone</span><select class="field" name="timezone"><option>America/New_York</option><option>America/Chicago</option><option>America/Denver</option><option>America/Los_Angeles</option></select></label>
			</div>
			<div class="grid2">
				<label><span class="lbl">Hours</span><select class="field" name="hours">{#each data.hourPresets as h (h.id)}<option value={h.id}>{h.label}</option>{/each}</select><span class="help">Exact hours can be edited after.</span></label>
				{#if type !== 'pickup_only'}<label><span class="lbl">Delivery ZIP codes</span><input class="field mono" name="zips" placeholder="21204, 21286" /><span class="help">The store's own ZIP is always included.</span></label>{/if}
			</div>
			<div><span class="lbl">Languages</span><span class="row" style="gap:16px"><label class="check-row"><input type="checkbox" name="languages" value="en" checked /> English</label><label class="check-row"><input type="checkbox" name="languages" value="es" /> Spanish</label></span></div>
		</div></div>

		<div class="card"><div class="card-h"><h2>2. The look</h2></div><div class="card-b">
			<div class="grid2" style="grid-template-columns:repeat(auto-fill,minmax(230px,1fr))">
				{#each data.presets as p (p.id)}
					<label class="kind" class:on={preset === p.id}>
						<input type="radio" name="preset" value={p.id} bind:group={preset} style="position:absolute;opacity:0" onchange={() => (brand = p.sampleBrand)} />
						<span class="row" style="gap:4px">{#each p.swatch as c, i (i)}<span style="width:26px;height:26px;border-radius:7px;background:{c};border:1px solid var(--border)"></span>{/each}</span>
						<h3>{p.name}</h3><p class="t2" style="font-size:13px;margin:0">{p.desc}</p>
					</label>
				{/each}
			</div>
			<div class="grid2">
				<label><span class="lbl">Brand color</span><span class="row" style="gap:8px"><input type="color" bind:value={brand} style="width:44px;height:38px;border:0;background:none;padding:0" /><input class="field mono" name="brand" bind:value={brand} maxlength="7" /></span></label>
				<label><span class="lbl">Or pick it from the logo</span><input class="field" type="file" accept="image/*" onchange={fromLogo} />{#if logoNote}<span class="help">{logoNote}</span>{/if}</label>
			</div>
			<p class="help">Text colors are generated from the brand color and checked for readability (WCAG AA).</p>
		</div></div>

		<div class="card"><div class="card-h"><h2>3. The menu</h2></div><div class="card-b">
			<label><span class="lbl">POS menu export (CSV)</span><input class="field" type="file" name="csv" accept=".csv,text/csv" /></label>
			<p class="help">Columns: menu, category, item, price, printer, description, sizes, times_ordered. Deal halves, pre-sized buttons and $0 lines are cleaned up; sizes become real sizes; the most-ordered items get a Popular badge. You get a report.</p>
		</div></div>
		<div class="row" style="justify-content:flex-end;gap:8px"><a class="btn btn-g" href="/admin">Cancel</a><button class="btn btn-p" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create store'}</button></div>
	</form>
{/if}
