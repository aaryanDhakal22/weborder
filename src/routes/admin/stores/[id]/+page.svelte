<script lang="ts">
	import { enhance } from '$app/forms';
	import { money } from '$lib/pricing';

	let { data, form } = $props();
	const s = $derived(data.store);
	let tab = $state<'overview' | 'look' | 'ordering' | 'live' | 'menu' | 'deals' | 'orders'>('overview');
	let device = $state<'phone' | 'laptop'>('phone');
	let filter = $state('');
	let brand = $state('');
	let preset = $state('');
	$effect.pre(() => {
		if (!brand) brand = s.site.brand;
		if (!preset) preset = s.site.preset;
	});
	const TABS = [['overview', 'Overview'], ['look', 'Look'], ['ordering', 'Ordering'], ['live', 'Live status'], ['menu', 'Menu'], ['deals', 'Deals'], ['orders', 'Orders']] as const;
	const shown = $derived(data.items.filter((i) => !filter || (i.name + i.cat).toLowerCase().includes(filter.toLowerCase())));
	const when = (iso: string) => new Date(iso).toLocaleString();
	const keep = () => async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => update({ reset: false });
	let frameKey = $state(0);
</script>

<header class="ph">
	<div>
		<div class="crumbs"><a href="/admin">Stores</a> / {s.name}</div>
		<h1>{s.name}</h1>
		<div class="badges">
			{#if s.status === 'draft'}<span class="badge b-warn"><span class="dot"></span>Draft, not public</span>{:else}<span class="badge b-ok"><span class="dot"></span>Live</span>{/if}
			{#if s.publish.current}<span class="badge b-mute">Published v{s.publish.current}</span>{/if}
			<span class="badge b-brand mono">{data.url.replace(/^https?:\/\//, '')}</span>
		</div>
	</div>
	<div class="acts">
		<a class="btn" href={s.status === 'draft' ? data.preview : data.url} target="_blank" rel="noopener">{s.status === 'draft' ? 'Preview' : 'Open site'}</a>
		<form method="POST" action="?/publish" use:enhance={() => async ({ update }) => { await update(); frameKey++; }}><button class="btn btn-p" type="submit">{s.status === 'draft' ? 'Publish for the first time' : 'Publish now'}</button></form>
	</div>
</header>

{#if form?.ok}<p class="okbox">{form.ok}</p>{/if}
{#if form?.error}<p class="errorbox">{form.error}</p>{/if}

<nav class="tabs" aria-label="Store sections">
	{#each TABS as [k, l] (k)}<button type="button" class="tab" class:on={tab === k} aria-current={tab === k} onclick={() => (tab = k)} style="background:none;border-top:0;border-left:0;border-right:0">{l}</button>{/each}
</nav>

{#if tab === 'overview'}
	<div class="ov">
		<div class="card"><div class="card-h"><h2>Preview</h2><div class="seg"><button type="button" class="segb" class:on={device === 'phone'} onclick={() => (device = 'phone')}>Phone</button><button type="button" class="segb" class:on={device === 'laptop'} onclick={() => (device = 'laptop')}>Laptop</button></div></div>
			<div class="frame-wrap {device}">{#key frameKey}<iframe title="Store preview" src={data.preview} loading="lazy"></iframe>{/key}</div>
		</div>
		<div class="stack">
			<div class="card"><div class="card-h"><h2>Readability</h2></div><div class="card-b" style="gap:6px">
				{#each data.checks as c (c.pair)}<div class="row"><span class="grow t2">{c.pair}</span><span class="mono">{c.ratio}:1</span><span class="badge {c.ok ? 'b-ok' : 'b-bad'}">{c.ok ? 'AA' : 'fails'}</span></div>{/each}
			</div></div>
			<div class="card"><div class="card-h"><h2>Publish history</h2></div><div class="card-b" style="gap:8px">
				{#each s.publish.history.slice(0, 6) as h (h.version)}
					<div class="row"><span class="mono">v{h.version}</span><span class="grow t2">{when(h.at)} · {h.pages} pages · {h.ms} ms · {h.by}</span>
						{#if h.version === s.publish.current}<span class="badge b-ok">current</span>{:else if data.releases.includes(h.version)}<form method="POST" action="?/rollback" use:enhance><input type="hidden" name="version" value={h.version} /><button class="btn btn-xs" type="submit">Roll back</button></form>{/if}
					</div>
				{:else}<p class="muted">Not published yet. Pages are rendered live until the first publish; publishing writes static snapshots that load instantly.</p>{/each}
			</div></div>
			<div class="card"><div class="card-h"><h2>Custom domain</h2></div><div class="card-b">
				<form method="POST" action="?/domain" use:enhance class="row" style="gap:8px"><input class="field mono" name="domain" value={s.domains[0] ?? ''} placeholder="order.lombardispizza.com" /><button class="btn" type="submit">Save</button></form>
				<p class="help" style="margin:0">Point a CNAME at stores.quiccpos.com. The {s.slug} address keeps working and becomes a redirect in production.</p>
			</div></div>
		</div>
	</div>
{:else if tab === 'look'}
	<form method="POST" action="?/look" use:enhance={keep} class="stack">
		<div class="card"><div class="card-h"><h2>Preset</h2></div><div class="card-b">
			<div class="grid2" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">
				{#each data.presets as p (p.id)}<label class="kind" class:on={preset === p.id}><input type="radio" name="preset" value={p.id} bind:group={preset} style="position:absolute;opacity:0" /><h3>{p.name}</h3><p class="t2" style="font-size:13px;margin:0">{p.desc}</p></label>{/each}
			</div>
			<div class="grid3">
				<label><span class="lbl">Brand color</span><span class="row" style="gap:8px"><input type="color" bind:value={brand} style="width:44px;height:38px;border:0;padding:0;background:none" /><input class="field mono" name="brand" bind:value={brand} maxlength="7" /></span></label>
				<label><span class="lbl">Mascot</span><select class="field" name="mascot"><option value="miso" selected={s.site.mascot === 'miso'}>Miso the cat chef</option><option value="off" selected={s.site.mascot === 'off'}>Off</option></select></label>
				<div><span class="lbl">Languages</span><span class="row" style="gap:12px">
					<label class="check-row"><input type="checkbox" name="languages" value="en" checked={s.site.languages.includes('en')} /> English</label>
					<label class="check-row"><input type="checkbox" name="languages" value="es" checked={s.site.languages.includes('es')} /> Spanish</label>
					<select class="field" name="defaultLang" style="width:auto"><option value="en" selected={s.site.languages[0] === 'en'}>English first</option><option value="es" selected={s.site.languages[0] === 'es'}>Spanish first</option></select>
				</span></div>
			</div>
		</div></div>
		<div class="card"><div class="card-h"><h2>Home page copy</h2><span class="help" style="margin:0">Leave empty to use the generated text.</span></div><div class="card-b">
			<div class="grid2"><label><span class="lbl">Small line above</span><input class="field" name="eyebrow" value={s.site.overrides.eyebrow ?? ''} /></label><label><span class="lbl">Tagline (search results)</span><input class="field" name="tagline" value={s.site.overrides.tagline ?? ''} /></label></div>
			<label><span class="lbl">Headline</span><input class="field" name="headline" value={s.site.overrides.headline ?? ''} /></label>
			<label><span class="lbl">Text under the headline</span><input class="field" name="lead" value={s.site.overrides.lead ?? ''} /></label>
			<div class="grid2"><label><span class="lbl">Story title</span><input class="field" name="storyTitle" value={s.site.overrides.storyTitle ?? ''} /></label><label><span class="lbl">Story text</span><input class="field" name="storyBody" value={s.site.overrides.storyBody ?? ''} /></label></div>
		</div></div>
		<div class="card"><div class="card-h"><h2>Custom homepage (admin only)</h2></div><div class="card-b">
			<textarea class="field mono" name="customHtml" rows="8" placeholder="<style>…</style><section>…</section>">{s.site.customHtml ?? ''}</textarea>
			<p class="help" style="margin:0">Review it first. Scripts, frames, forms and event handlers are stripped when it renders; it replaces the hero and is fully indexable.</p>
		</div></div>
		<div class="row" style="justify-content:flex-end"><button class="btn btn-p" type="submit">Save look</button></div>
	</form>
{:else if tab === 'ordering'}
	{@const st = s.settings}
	<form method="POST" action="?/ordering" use:enhance={keep} class="stack">
		<div class="grid2" style="align-items:start">
			<div class="card"><div class="card-h"><h2>Order types</h2></div><div class="card-b">
				<label class="check-row"><input type="checkbox" name="pickup" checked={st.pickup} /> Pickup</label>
				<label class="check-row"><input type="checkbox" name="delivery" checked={st.delivery} /> Delivery</label>
				<div class="grid2"><label><span class="lbl">Pickup ready in (min)</span><input class="field mono" name="etaPickupMin" value={st.etaPickupMin} /></label><label><span class="lbl">Delivery in (min)</span><input class="field mono" name="etaDeliveryMin" value={st.etaDeliveryMin} /></label></div>
				<label class="check-row"><input type="checkbox" name="scheduling" checked={st.scheduling.enabled} /> Order ahead</label>
				<div class="grid2"><label><span class="lbl">Slot length (min)</span><input class="field mono" name="slotMin" value={st.scheduling.slotMin} /></label><label><span class="lbl">Days ahead</span><input class="field mono" name="daysAhead" value={st.scheduling.daysAhead} /></label></div>
				<label><span class="lbl">Store phone</span><input class="field" name="phone" value={s.phone} /></label>
			</div></div>
			<div class="card"><div class="card-h"><h2>Delivery fee</h2></div><div class="card-b">
				<label><span class="lbl">Model</span><select class="field" name="feeModel"><option value="flat" selected={st.deliveryFee.model === 'flat'}>Flat fee</option><option value="free_over" selected={st.deliveryFee.model === 'free_over'}>Flat fee, free over an amount</option></select></label>
				<div class="grid3"><label><span class="lbl">Fee ($)</span><input class="field mono" name="flat" value={(st.deliveryFee.flatCents / 100).toFixed(2)} /></label><label><span class="lbl">Free over ($)</span><input class="field mono" name="freeOver" value={st.deliveryFee.freeOverCents ? (st.deliveryFee.freeOverCents / 100).toFixed(2) : ''} /></label><label><span class="lbl">Minimum ($)</span><input class="field mono" name="minOrder" value={(st.deliveryFee.minOrderCents / 100).toFixed(2)} /></label></div>
				<label><span class="lbl">Delivery ZIP codes</span><input class="field mono" name="zips" value={st.deliveryZips.join(', ')} /></label>
				<div class="grid2"><label><span class="lbl">Sales tax (%)</span><input class="field mono" name="taxPct" value={st.taxBps / 100} /></label><label><span class="lbl">Service fee (%)</span><input class="field mono" name="servicePct" value={st.serviceFeeBps / 100} /></label></div>
			</div></div>
			<div class="card"><div class="card-h"><h2>Tips</h2></div><div class="card-b">
				<label class="check-row"><input type="checkbox" name="tips" checked={st.tips.enabled} /> Ask for a tip</label>
				<div class="grid2"><label><span class="lbl">Choices (%)</span><input class="field mono" name="tipPresets" value={st.tips.presets.join(',')} /></label><label><span class="lbl">Picked by default (%)</span><input class="field mono" name="tipDefault" value={st.tips.default} /></label></div>
			</div></div>
			<div class="card"><div class="card-h"><h2>Payments</h2></div><div class="card-b">
				<label class="check-row"><input type="checkbox" name="cash" checked={st.cash} /> Accept cash</label>
				<label><span class="lbl">Card processing fee</span><select class="field" name="cardFee"><option value="absorb" selected={st.cardFee.mode === 'absorb'}>The store covers it</option><option value="surcharge" selected={st.cardFee.mode === 'surcharge'}>Add it to the bill (shown as a line)</option><option value="cash_discount" selected={st.cardFee.mode === 'cash_discount'}>Cash discount (cash orders get it off)</option></select></label>
				<label><span class="lbl">Fee (%)</span><input class="field mono" name="cardFeePct" value={st.cardFee.bps / 100} /></label>
				<p class="help" style="margin:0">Stripe (Connect, the store's own account) replaces the test card form once the account exists.</p>
			</div></div>
		</div>
		<div class="row" style="justify-content:flex-end"><button class="btn btn-p" type="submit">Save ordering settings</button></div>
	</form>
{:else if tab === 'live'}
	<div class="stack">
		<div class="card"><div class="card-h"><h2>Pause online orders</h2>{#if s.settings.pausedUntil && new Date(s.settings.pausedUntil) > new Date()}<span class="badge b-warn">Paused until {new Date(s.settings.pausedUntil).toLocaleTimeString()}</span>{/if}</div><div class="card-b">
			<form method="POST" action="?/live" use:enhance class="row" style="gap:8px;flex-wrap:wrap">
				{#each [15, 30, 60] as m (m)}<button class="btn" name="pause" value={m}>{m} min</button>{/each}
				<button class="btn btn-p" name="pause" value="resume">Resume now</button>
			</form>
			<form method="POST" action="?/live" use:enhance class="row" style="gap:8px"><span class="t2">Busy: quote</span><select class="field" name="busy" style="width:auto"><option value="0">normal times</option>{#each [45, 60, 75, 90] as m (m)}<option value={m} selected={s.settings.busyEtaMin === m}>{m} min</option>{/each}</select><button class="btn" type="submit">Set</button></form>
		</div></div>
		<form class="card" method="POST" action="?/live" use:enhance={keep}>
			<input type="hidden" name="soldOutForm" value="1" />
			<div class="card-h"><h2>Sold out today</h2><span class="row" style="gap:8px"><input class="field" placeholder="Filter items" bind:value={filter} style="width:200px" /><button class="btn btn-p" type="submit">Save</button></span></div>
			<div class="card-b soldgrid">
				{#each shown as i (i.id)}<label class="check-row"><input type="checkbox" name="soldOut" value={i.id} checked={s.settings.soldOut.includes(i.id)} /> {i.name} <span class="muted">· {i.cat}</span></label>{/each}
				{#each data.items.filter((i) => !shown.includes(i) && s.settings.soldOut.includes(i.id)) as i (i.id)}<input type="hidden" name="soldOut" value={i.id} />{/each}
			</div>
		</form>
	</div>
{:else if tab === 'menu'}
	<div class="stack">
		<div class="card"><div class="card-h"><h2>Replace the menu from a CSV</h2></div><div class="card-b">
			<form method="POST" action="?/menu" enctype="multipart/form-data" use:enhance class="row" style="gap:8px"><input class="field" type="file" name="csv" accept=".csv,text/csv" required /><button class="btn btn-p" type="submit">Import</button></form>
			{#if form && 'report' in form && form.report}
				<table class="mini"><thead><tr><th>What</th><th>Item</th><th>Why</th></tr></thead><tbody>{#each form.report as n, i (i)}<tr><td><span class="badge b-mute">{n.kind}</span></td><td>{n.item}</td><td class="t2">{n.reason}</td></tr>{/each}</tbody></table>
			{/if}
		</div></div>
		<div class="card" style="overflow-x:auto"><table class="tbl"><thead><tr><th>Category</th><th class="r">Items</th><th>Popular</th></tr></thead><tbody>
			{#each s.menu.categories as c (c.id)}<tr><td class="nm">{c.name}</td><td class="r mono">{c.items.filter((i) => i.online !== false).length}{#if c.items.some((i) => i.online === false)} <span class="muted">(+{c.items.filter((i) => i.online === false).length} hidden)</span>{/if}</td><td class="t2">{c.items.filter((i) => i.popular).map((i) => i.name).join(', ')}</td></tr>{/each}
		</tbody></table></div>
	</div>
{:else if tab === 'deals'}
	<form method="POST" action="?/deals" use:enhance={keep} class="stack">
		<input type="hidden" name="toggles" value="1" />
		<div class="card" style="overflow-x:auto"><table class="tbl"><thead><tr><th>On</th><th>Deal</th><th>Kind</th><th>Price / discount</th><th>When</th></tr></thead><tbody>
			{#each s.deals as d (d.id)}<tr>
				<td><input type="checkbox" name="active" value={d.id} checked={d.active} /></td>
				<td class="nm">{d.name}<div class="sub">{d.desc}</div></td>
				<td><span class="badge {d.kind === 'bundle' ? 'b-brand' : d.kind === 'mix' ? 'b-info' : d.kind === 'nth' ? 'b-warn' : 'b-mute'}">{({ bundle: 'Bundle', mix: 'Mix & match', nth: 'Buy X, get Y', code: 'Code' })[d.kind]}</span></td>
				<td class="mono">{d.priceCents !== undefined ? money(d.priceCents) : d.mix ? `${money(d.mix.eachCents)} each, ${d.mix.qty}+` : d.nth ? `${d.nth.pct}% off every ${d.nth.n}` : d.code ? `${d.code}: ${d.pct ? d.pct + '%' : money(d.amountCents ?? 0)}` : ''}</td>
				<td class="t2">{d.schedule ? [d.schedule.days?.join(' ') ?? 'every day', d.schedule.start ? `from ${d.schedule.start}` : '', d.schedule.end ? `until ${d.schedule.end}` : ''].join(' ') : 'Always'}</td>
			</tr>{/each}
		</tbody></table></div>
		<details class="card"><summary class="card-h" style="cursor:pointer"><h2>Edit deals as JSON (advanced)</h2></summary><div class="card-b">
			<textarea class="field mono" name="json" rows="16">{JSON.stringify(s.deals, null, 2)}</textarea>
			<p class="help" style="margin:0">Kinds: bundle (slots + priceCents), mix (qty, eachCents, eligible), nth (n, pct, eligible), code (code, pct or amountCents). Eligible matches category ids, item ids and size names.</p>
		</div></details>
		<div class="row" style="justify-content:flex-end"><button class="btn btn-p" type="submit">Save deals</button></div>
	</form>
{:else}
	<div class="card" style="overflow-x:auto"><table class="tbl"><thead><tr><th>#</th><th>Customer</th><th>Type</th><th>Status</th><th class="r">Total</th><th></th></tr></thead><tbody>
		{#each data.orders as o (o.publicId)}<tr>
			<td class="mono">{o.kitchenNo}</td><td>{o.customer}<div class="sub">{when(o.createdAt)}</div></td><td>{o.fulfil}{o.when.asap ? '' : ' · scheduled'}</td>
			<td><span class="badge {o.status === 'done' ? 'b-ok' : 'b-info'}">{o.status}</span></td><td class="r mono">{money(o.total)}</td>
			<td><span class="row" style="gap:6px;justify-content:flex-end"><a class="btn btn-xs" href="{data.url}/order/{o.publicId}" target="_blank" rel="noopener">Tracking page</a>{#if o.status !== 'done'}<form method="POST" action="?/advance" use:enhance><input type="hidden" name="order" value={o.publicId} /><button class="btn btn-xs btn-p" type="submit">Next stage</button></form>{/if}</span></td>
		</tr>{:else}<tr><td colspan="6" class="muted">No orders yet. Place one on the site; the stages advance by themselves (DEMO_FLOOR=fast) or with Next stage.</td></tr>{/each}
	</tbody></table></div>
{/if}

<style>
	.ov { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 18px; align-items: start; }
	@media (max-width: 1100px) { .ov { grid-template-columns: 1fr; } }
	.frame-wrap { padding: 16px; display: flex; justify-content: center; background: var(--elev); border-radius: 0 0 14px 14px; }
	.frame-wrap iframe { border: 0; border-radius: 18px; background: #fff; box-shadow: 0 20px 40px -24px rgba(0, 0, 0, 0.5); }
	.frame-wrap.phone iframe { width: 390px; height: 760px; max-width: 100%; }
	.frame-wrap.laptop iframe { width: 100%; height: 760px; }
	.segb { border: 0; background: none; min-height: 30px; padding: 0 12px; border-radius: 8px; font-size: 13px; font-weight: 500; color: var(--text2); }
	.segb.on { background: var(--surface); color: var(--text); font-weight: 600; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12); }
	.soldgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 4px 16px; max-height: 520px; overflow-y: auto; }
	.tabs { flex-wrap: wrap; }
</style>
