# Architecture

## Request path

```
browser ──► (Caddy / Traefik) ──► node build (SvelteKit, adapter-node)
                                   hooks.server.ts
                                    ├─ host → main (/channel/v1/me with X-Site-Host)
                                    │    ├─ unknown_site → neutral 404, no store data
                                    │    └─ a store → locals.store (cached per host)
                                    └─ SSR page, or /api/* relayed to main
```

**Tenancy is main's decision.** The storefront names the host it is serving (`X-Site-Host`) with
its one platform key; main resolves the host to a store's built-in Website channel, or answers
`unknown_site`. Nothing reads a store id from the URL or the body. Cookies are host-only.

## Store data (`src/lib/server/store.ts`)

Per host, built once from `me`, `store`, `site`, `menu`, `pricing` and `payments`, then
re-checked every `REFRESH_SECONDS`: the menu version and the site version decide whether the menu
and pricing are fetched again. Requests never wait on a refresh once a store is cached. Live state
(open / paused / closed, ETAs, sold out) is `GET /channel/v1/store`, at most ~10 s old, polled by
pages every 30 s through `/api/store`.

The layout load sends the store data (menu + pricing context) once per full page load;
client-side navigation keeps it, so the menu crosses the wire once per visit.

## Pricing

main is the authority: the cart and checkout show main's `/quote`, and an order is refused if
main's total differs from the one shown (`expected_total_cents`). The browser previews prices with
**main's own engine** (`src/lib/engine.ts`, a byte-for-byte copy of main's TypeScript engine, held
to main's shared cases by `test/unit/engine.test.ts` and `npm run sync-engine -- --check`).

## Checkout and payments

`POST /api/orders` → main `POST /channel/v1/orders` with a `client_order_id` kept per cart (a
retry returns the same order). Card: the Square Web Payments SDK draws the form in Square's
iframe and returns a one-time token (no card data on our servers); Google Pay through the same
SDK; Apple Pay waits for a public domain registered with Square. main authorizes (a hold) and
captures later (clock-out, Close batch, 24 h). 3-D Secure: main answers `402
verification_required`, the page runs `verifyBuyer` and retries. Without a Square app the page
offers main's test card (dev / staging) or the fake Square's test cards.

## Accounts

Phone + text code (main: Twilio Verify, or a fake on dev). The session (`qcs_…`, 90 days) lives
in a host-only httpOnly cookie the storefront forwards as `X-Customer-Session`; the page never
sees it. Customer IPs go to main as `X-Customer-IP` for its sign-in limits.

## Tracking

main's public `/track/v1/{token}` is JSON only, so the storefront keeps **one upstream
`/channel/v1/events` stream per store** (`src/lib/server/track.ts`) while any tracking page of that
store is open; each event names an order, and that order's pages re-read `/track/v1/{token}` and
get it over their own SSE (`/api/track/{token}/events`). A page only shows orders its own store's
Website channel took (`/channel/v1/orders/{id}/status` must answer for the host).

## Theme (`src/lib/theme.ts`)

A preset is code: fonts, radius scale, layout (menu, nav, header) and a palette recipe that turns
one brand colour into ~35 tokens (OKLCH, with a WCAG AA contrast guard). The look comes from Store ›
Website's published settings (`/channel/v1/site`), over the default: theme zero (Quibase, Barlow)
in Lombardi's red (`src/lib/look.ts`).

## PWA

Each host serves its own `manifest.webmanifest` and `icon.svg` (the store's initial on its
colour). Installing is a bonus, never required.
