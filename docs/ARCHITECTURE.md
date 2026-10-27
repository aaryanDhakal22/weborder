# Architecture

## Request path

```
browser ──► (Caddy / Cloudflare) ──► node build (SvelteKit, adapter-node)
                                       hooks.server.ts
                                        ├─ host = admin host     → /admin only (session or bearer)
                                        ├─ host = unknown/reserved → neutral 404, no store data
                                        └─ host = a store         → locals.store
                                              ├─ published snapshot exists → serve .br/.gz/html file (≈1–2 ms)
                                              └─ otherwise → SvelteKit SSR (full HTML, then hydrate)
```

**Tenancy** is decided once, from the `Host` (or `X-Forwarded-Host`) header, in
`src/lib/server/tenancy.ts`. Nothing reads a store id from the URL or the body. A draft store is a
404 to the public; signed preview links (`?preview=…`, one hour, HMAC) open it for the admin.
Reserved subdomains (`www`, `admin`, `api`, `main`, …) never resolve to a store. Cookies are
host-only. Every store response carries `Cache-Tag: site-<id>` for CDN purges and a
`frame-ancestors` CSP that only lets the admin frame it.

## Rendering, snapshots and instant pages

- Every page is server-rendered with its full content, `<title>`, description, canonical URL,
  JSON-LD and the store's design tokens in `<head>`. All CSS is inlined (`inlineStyleThreshold`),
  so one HTML response draws a finished page; fonts are self-hosted woff2 with two preloads per
  preset.
- **Publishing** (`src/lib/server/publish.ts`) asks the running server to render every page of one
  store (home, menu, every visible item, every deal, contact, sitemap, robots, manifest, and each
  extra language) with a signed render header, writes the HTML plus Brotli and gzip copies to
  `data/sites/<id>/releases/<n>/`, then swaps a `current` symlink. A failed page leaves the live
  site untouched. The last three releases are kept for rollback. Lombardi's (267 pages) publishes in
  about 2 s on the production build.
- Admin edits to look, ordering settings, menu or deals republish automatically after a short
  debounce. Pause, busy and sold-out are live state served by `/api/live` and need no republish.
- Navigation is instant: SvelteKit preloads page data on hover and code on viewport, the menu is
  rendered whole (no lazy loading), and the service worker caches build assets and fonts forever and
  pages stale-while-revalidate.
- In production the same snapshot folder can be served by Caddy or Cloudflare directly
  (`deploy/Caddyfile`), so the Node process only handles API calls and pages that aren't published.

## Theme engine (`src/lib/theme.ts`)

A preset is code: fonts, radius scale, layout presets (menu layout, nav, header) and a palette
recipe that turns **one brand color** into ~35 tokens using hand-written OKLCH math. A contrast
guard moves any text color that falls below WCAG AA (4.5:1) until it passes; the admin shows the
ratios. Theme zero (`pizzeria-loud` with `#AC94F4`) is Quibase's palette exactly. Presets:
`pizzeria-loud`, `cafe-calm`, `taqueria-bold`, `classic-paper`.

## Menu, deals and pricing

- `src/lib/menu-csv.ts` imports a POS export into the v2 menu: real sizes, option groups by category
  (pizza toppings with halves and size-based prices, sauces, wing sauces, spice level), Popular from
  order counts, and a report of every change.
- `src/lib/pricing.ts` is the one pricing function. The server's `/api/quote` and checkout use it
  with the store's menu, so client prices are never trusted; the browser uses it only to preview.
  It handles bundles (slots, included toppings, savings), mix & match, buy-X-get-Y with schedules,
  promo codes (first-order, minimums; the bigger of code vs. deal wins), delivery fee models, tax,
  tips, card surcharge and cash discount. Totals always reconcile.

## Ordering and tracking

`POST /api/checkout` validates, re-quotes, authorizes the payment (mock with Stripe test-card
behavior), assigns a kitchen number from 1100 and stores the order; an idempotency key prevents
double orders. `GET /api/orders/:id/events` streams the order's stages (server-sent events). The
mock "floor" advances stages on a timeline that the admin can override; in production these come
from the Pi's `floor.events` through main.

## PWA

Each host serves its own `manifest.webmanifest` and `icon.svg` (the store's initials on its brand
color), so an installed storefront has the store's own name and icon. The tracking page offers an
**Add to Home Screen** sheet; push is a bonus, the page and email are the baseline.

## Admin

`/admin` on the admin host, styled with main's SPA tokens. Store list with publish; New store
wizard (CSV upload + report, presets, brand color from logo via canvas, draft preview); per store:
live preview (phone/laptop), readability table, publish history with rollback, custom domain,
look and copy, custom homepage (admin-only, sanitized, inline for SEO), ordering rules, live status
(pause, busy, sold out), menu re-import, deals (toggles + JSON), orders with a "Next stage" control.

## Not built here (on purpose)

- Real Stripe: the payment seam is `src/lib/server/payments.ts` (see docs/MAIN-API.md).
- Real geocoding and radius: delivery areas are ZIP lists in the mock; main's `app/geo` replaces it.
- SMS, email receipts and web push sending: hooks exist (opt-in stored, tracking page) but nothing sends.
- Customer accounts and reorder: guest checkout only.
- A visual block editor: the admin edits copy, preset, color and custom HTML; blocks are generated.
