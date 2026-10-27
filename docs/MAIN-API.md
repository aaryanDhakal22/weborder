# Connecting to quicc main

The storefront reads and writes through one interface, `DataSource`
(`src/lib/server/source/types.ts`). Today `MockSource` implements it with JSON files. `MainSource`
(`src/lib/server/source/main.ts`) implements it against the endpoints below; switch with:

```bash
DATA_SOURCE=main MAIN_URL=https://main.quiccpos.com MAIN_SITE_KEY=<site key> npm start
```

Nothing else in the storefront changes: pages, the admin, the publisher and the API routes only
call `DataSource`.

## Rules main must follow

1. **Tenancy from the host.** Storefront calls carry `X-Forwarded-Host: <store host>`; main resolves
   it with `site_domains` (or `<slug>.quiccpos.com`) and runs the query as the `storefront` role with
   `SET LOCAL app.tenant_id`, so row-level security hides every other tenant. An unknown host is 404.
2. **Auth.** `Authorization: Bearer <MAIN_SITE_KEY>`: a platform key for the storefront service
   (admin endpoints need the admin scope).
3. **Money is integer cents.** Ids are strings. Times are RFC 3339.
4. **Idempotent writes.** Orders are keyed by the storefront's `Order.id` (UUID); a repeat returns the
   existing order.

## Endpoints

| DataSource method | Main endpoint | Notes |
| --- | --- | --- |
| `storeByHost(host)` | `GET /site/v1/bundle` + `X-Forwarded-Host` | The whole `Store` (`src/lib/types.ts`): tenant + location + `site_settings` + menu v2 + deals + publish state. Cache it per host for ~30 s and invalidate on the publish event. |
| `listStores()` | `GET /admin/v1/sites` | Admin key. |
| `getStore(id)` | `GET /admin/v1/sites/{id}` | |
| `saveStore(store)` | `PUT /admin/v1/sites/{id}` | Main splits it into tenant/location/site settings/menu/deals writes, versioned. |
| `createOrder(order)` | `POST /site/v1/orders` | The new `casting/site` caster: `Order` → order Snapshot (mapping below) → persist → outbox → SSE → Pi. Returns 201 or 200 on a replay. |
| `getOrder(store, publicId)` | `GET /site/v1/orders/{publicId}` | Status mirrored from the agent's `floor.events`. |
| `listOrders(store)` | `GET /admin/v1/sites/{id}/orders?limit=` | |
| `hasOrdered(store, phone)` | `GET /admin/v1/sites/{id}/customers/has-ordered?phone=` | For first-order codes. |
| `nextKitchenNo()` | (none) | Kitchen numbers come from the Pi at accept time; the site shows "#—" until accepted. |
| `saveOrder()` | (none) | Mock-only: in production order state is owned by main and the Pi. |

Live status (`/api/live`) is computed from the bundle: `settings.pausedUntil`, `busyEtaMin` and
`soldOut` must be updated in main when Quibase pauses ordering or snoozes an item (the Pi already
syncs floor state to main), so the next bundle fetch reflects it.

## Order → main Snapshot

| Storefront `Order` | main `domain/order/snapshot.go` |
| --- | --- |
| `id` | `source_event_id` (source = `site`) |
| `storeId` | resolved tenant/location (from the host, not trusted from the body) |
| `fulfil`, `address`, `when.at` | `fulfillment.type`, `fulfillment.address`, `fulfillment.promised_at` |
| `customer` | `customer.display_name`, `phone`, `email` |
| `quote.lines[]` | `items[]`: name, size, quantity, `unit_price_cents`, `line_total_cents`, `children[]` from mods; `menu_item_id` from `lines[].itemId`; deal lines become a parent line with the slot items as children |
| `quote.discounts[]` | `money.discounts[]` (type `deal` / `code` / `cash`) |
| `deliveryFeeCents`, `serviceFeeCents`, `cardFeeCents` | `money.fees[]` |
| `taxCents`, `tipCents`, `totalCents` | `money.tax`, `money.tip`, `money.total` (reconciles to the cent) |
| `payment` | `payments[]`: card = captured with `last4` + PaymentIntent id; cash = pending |

Main should re-run the quote with its own copy of the menu and reject a mismatch, the same way
`placeOrder` does here.

## Status ← floor events

| Agent floor event | `OrderStatus` |
| --- | --- |
| order persisted | `received` |
| accepted (kitchen #, prep minutes → ready-by) | `accepted` |
| (accepted, before ready) | `cooking` |
| ready (pickup) | `ready` |
| driver sent out | `out` |
| delivered / picked up | `done` |
| voided | `cancelled` |

## Payments (Stripe Connect, Standard)

Replace `authorize()` in `src/lib/server/payments.ts`:

1. Checkout calls `POST /site/v1/checkout/intent` with the cart: main re-quotes and creates a
   PaymentIntent **on the store's connected account** for `totalCents`, returning the client
   secret.
2. The browser confirms it with Stripe's Payment Element (card, Apple Pay, Google Pay).
3. Stripe's `payment_intent.succeeded` webhook places the order (idempotent on the PaymentIntent
   metadata's order id), so a closed tab still produces the order.
4. Cash orders skip 1–3 and go straight to `POST /site/v1/orders` with a pending payment.

## Publishing with main

On every `site.published`, `menu.changed`, `deal.changed` or `location.updated` event, main's
`sitepub` worker calls this server's `POST /admin/api/stores/{id}/publish` (admin bearer), or
runs the same render job itself. Snapshots stay where they are (`DATA_DIR/sites`) or are uploaded
to Cloudflare for serving at the edge.
