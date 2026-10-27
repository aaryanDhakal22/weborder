<script lang="ts">
	import '$lib/styles/admin.css';
	import { page } from '$app/state';
	let { data, children } = $props();
	const path = $derived(page.url.pathname);
</script>

<svelte:head><title>quicc stores</title><meta name="robots" content="noindex" /></svelte:head>

{#if !data.admin}
	{@render children()}
{:else}
	<div class="adm">
		<aside class="aside">
			<div class="brand"><span class="qtile">q</span><div><b>quicc stores</b><span>Storefront admin</span></div></div>
			<nav class="navgrp" aria-label="Admin">
				<a class="nav" class:on={path === '/admin'} href="/admin">Stores</a>
				<a class="nav" class:on={path === '/admin/new'} href="/admin/new">New store</a>
			</nav>
			<form class="foot" method="POST" action="/admin/login?/logout"><button class="nav" type="submit">Sign out</button></form>
		</aside>
		<main class="mainc">{@render children()}</main>
	</div>
{/if}
