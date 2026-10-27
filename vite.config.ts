import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    host: true,
    // Store hosts are <slug>.localhost and admin.localhost in dev.
    allowedHosts: true
  }
});
