import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    // Inline all CSS into the HTML: one request renders a styled page.
    inlineStyleThreshold: Infinity,
    serviceWorker: { register: false }
  }
};

export default config;
