/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
// Instant repeat visits: build assets and fonts are cached forever (content-hashed); pages are served
// from cache at once and refreshed in the background (stale-while-revalidate). API calls go to the network.
import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `quicc-${version}`;
const ASSETS = [...build, ...files.filter((f) => f.startsWith('/fonts/'))];

sw.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => sw.skipWaiting()));
});
sw.addEventListener('activate', (event) => {
	event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => sw.clients.claim()));
});
sw.addEventListener('fetch', (event) => {
	const req = event.request;
	if (req.method !== 'GET') return;
	const url = new URL(req.url);
	if (url.origin !== location.origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/order/') || url.pathname.startsWith('/checkout')) return;
	if (ASSETS.includes(url.pathname)) {
		event.respondWith(caches.match(url.pathname).then((r) => r ?? fetch(req)));
		return;
	}
	event.respondWith(
		caches.open(CACHE).then(async (cache) => {
			const cached = await cache.match(req);
			const fresh = fetch(req)
				.then((res) => {
					if (res.ok && res.type === 'basic') cache.put(req, res.clone());
					return res;
				})
				.catch(() => cached ?? Response.error());
			return cached ?? fresh;
		})
	);
});
