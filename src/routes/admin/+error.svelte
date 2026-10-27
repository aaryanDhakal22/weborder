<script lang="ts">
	import '$lib/styles/admin.css';
	import { page } from '$app/state';
</script>

<div class="adm" style="align-items:center;justify-content:center">
	<div class="card" style="padding:28px;max-width:420px">
		<h1 style="font-size:20px">{page.status === 404 ? 'Not found' : 'Something went wrong'}</h1>
		<p class="t2">{page.error?.message}</p>
		<a class="btn" href="/admin">Back to stores</a>
	</div>
</div>
