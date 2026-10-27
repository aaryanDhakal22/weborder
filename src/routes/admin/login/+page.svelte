<script lang="ts">
	import '$lib/styles/admin.css';
	let { form } = $props();
</script>

<div class="adm login">
	<form method="POST" action="?/login" class="card box">
		<div class="brand"><span class="qtile">q</span><div><b>quicc stores</b><span>Storefront admin</span></div></div>
		<label><span class="lbl">Admin password</span><input class="field" type="password" name="password" autocomplete="current-password" required /></label>
		{#if form?.error}<p class="errorbox">{form.error}</p>{/if}
		<button class="btn btn-p" type="submit">Sign in</button>
	</form>
</div>

<style>
	.login { align-items: center; justify-content: center; padding: 16px; }
	.box { padding: 28px; width: min(380px, 100%); display: flex; flex-direction: column; gap: 16px; }
</style>
