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

`POST /api/orders` → main `POST /channel/v1/orders` with a `client_order_id` (the idempotency key)
and an `expires_at` deadline (ASAP: 5 minutes; scheduled: the promised time less the prep time).
**The order outbox** (`src/lib/server/outbox.ts`, SQLite at `OUTBOX_PATH`, DURABILITY-PLAN.md):
the order is written on the storefront's disk before main is asked, and stays until main gives a
final answer. main's answer within `ORDER_WAIT_MS` (22 s) goes straight back; anything else (no
answer, main down, 5xx, 202) answers the page `202 {state: pending}`, and a worker asks main's
`GET /channel/v1/orders/by-key/{key}`, sending the same body again when main never saw it, until
main says placed / refused / expired / voided, or the deadline passes unseen ("not placed, nothing
charged"). The page shows **Still confirming** (the key is in the cart, so it survives a reload)
and polls `/api/orders/by-key/{key}`. The key is kept for a retry of an unanswered attempt and for
3-D Secure, and renewed after any final refusal; main's `key_reused` makes the outbox ask main
what the key holds (an earlier attempt may have been placed: never twice).
**Kitchen offline:** main's `/channel/v1/store` says `kitchen_offline` when the store's Pi can't get
an order; the status bar and checkout say so, ASAP is off and only times ≥ 1 h away are offered.
**Network:** the server won't start with plain `http` to a public main; the session cookie's Secure
flag and HSTS follow `X-Forwarded-Proto` behind a trusted proxy. Card: the Square Web Payments SDK draws the form in Square's
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

## Store › Website

main's Website page edits the settings document `src/lib/look.ts` reads (`lookFrom` fills every
missing or malformed field with its default; main checks the same fields in `domain/site/look.go`):
- **look:** preset, brand, `menu_layout` (overrides the preset's), Spanish on/off (`languages`);
- **images:** `logo` (the header, the app icon, the manifest) and `cover` (behind the hero and About
  us), served at `/media/<id>` from `/channel/v1/site/images/<id>` and cached for good;
- **home page:** `blocks` in order, each on or off: hero, order again (signed-in customers with past
  orders), categories, deals (hides itself), from the menu (`picks`, else a sampler), hours, about
  us, install the app;
- **texts:** with their `_es` twins; an empty Spanish field gets our Spanish text, never the English;
- **the rest:** the `announcement` bar (store-local dates), Miso's switches, and `privacy` (empty =
  the default text from the store's details, at `/privacy`).

**Preview:** `/p/<token>/…` is the same site with the store's draft. `src/hooks.ts` reroutes the
path, and `hooks.server.ts` swaps in the draft look through `previewOf`, which is never cached.
Every link keeps the prefix through `data.base` (`locals.root`). The Website page frames it
(`frame-ancestors *`, noindex). A stale token gets a 303 to the same page without the prefix.

## Miso (`src/lib/miso/`)

The cat chef is the illustrator's 19 animated SVGs (`src/lib/miso/art/`, kept byte for byte; the
brief is `docs/MISO-BRIEF.md`, their notes and generator are in `docs/miso/`). A page imports only its
own scenes (`import peek from '$lib/miso/art/miso-peek.svg?raw'`) and renders `<Miso art={peek} />`.
`prepare()` makes a scene page-ready:
- the store colour (`#E2363B` → `--miso-brand`) and the whisker ink (`--miso-ink`);
- one sticker edge round the drawing, which skips lines as thin as the whiskers;
- ids per instance;
- every animation hung off one starter. The component fires it only when the visitor allows
  motion, so no JS and reduced motion both get the still pose.

Where Miso shows:
- **always:** the tracking steps (+ "placed" for 4 s after Place order), closed / paused on
  home, checkout errors, loading, and the error page;
- **optional:**
  - `miso_pages` (cart, checkout, sign-in, empty deals / orders, the bundle celebration);
  - `miso_blocks` (per home block: `peek` / `side` / `off`; default: the hero peeking).

Replacing the art means dropping new files into `art/` (same names); `test/unit/miso.test.ts`
checks every scene still prepares.

## PWA

Each host serves its own `manifest.webmanifest` and `icon.svg` (the store's initial on its
colour). Installing is a bonus, never required.
