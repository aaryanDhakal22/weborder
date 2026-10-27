<script lang="ts">
	let { data, form } = $props();
	const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : 'Never');
</script>

<header class="ph">
	<div><h1>Stores</h1><p>Every store gets its own site. Create one, check the preview, publish.</p></div>
	<div class="acts"><a class="btn btn-p" href="/admin/new">+ New store</a></div>
</header>
{#if form?.ok}<p class="okbox">{form.ok}</p>{/if}
{#if form?.error}<p class="errorbox">{form.error}</p>{/if}
<div class="card" style="overflow-x:auto">
	<table class="tbl">
		<thead><tr><th>Store</th><th>Look</th><th class="r">Items</th><th class="r">Deals</th><th>Published</th><th></th></tr></thead>
		<tbody>
			{#each data.stores as s (s.id)}
				<tr>
					<td><a class="nm" href="/admin/stores/{s.id}">{s.name}</a><div class="sub mono">{s.url.replace(/^https?:\/\//, '')}</div></td>
					<td><span class="row" style="gap:8px"><span style="width:14px;height:14px;border-radius:4px;background:{s.brand};display:inline-block"></span>{s.preset}</span></td>
					<td class="r mono">{s.items}</td>
					<td class="r mono">{s.deals}</td>
					<td>{#if s.status === 'draft'}<span class="badge b-warn"><span class="dot"></span>Draft</span>{:else if s.version}<span class="badge b-ok"><span class="dot"></span>v{s.version}</span> <span class="sub">{when(s.lastPublish)}</span>{:else}<span class="badge b-info"><span class="dot"></span>Live (server-rendered)</span>{/if}</td>
					<td><span class="row" style="gap:6px;justify-content:flex-end">
						<a class="btn btn-sm" href={s.status === 'draft' ? s.preview : s.url} target="_blank" rel="noopener">{s.status === 'draft' ? 'Preview' : 'Open site'}</a>
						<form method="POST" action="?/publish"><input type="hidden" name="id" value={s.id} /><button class="btn btn-sm btn-p" type="submit">Publish</button></form>
					</span></td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
