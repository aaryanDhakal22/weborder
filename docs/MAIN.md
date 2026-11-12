# How the storefront uses main

Every call: `Authorization: Bearer <PLATFORM_KEY>` + `X-Site-Host: <host>`. Contract: main's
OpenAPI (`GET /channel/v1/openapi.json`) and quicc-ops `contract/main.md` §2.5za.

| Storefront | main |
| --- | --- |
| store data (cached per host) | `GET /channel/v1/me`, `/site`, `/menu`, `/menu/version`, `/pricing`, `/payments` |
| `GET /api/store` | `GET /channel/v1/store` (state, ETAs, sold out, `week`) |
| `POST /api/quote` | `POST /channel/v1/quote` |
| `GET /api/times` | `GET /channel/v1/store/times?type&date` |
| `POST /api/delivery-check` | `POST /channel/v1/store/delivery-check` |
| `POST /api/orders` | `POST /channel/v1/orders` (+ `X-Customer-Session` when signed in) |
| `/order/{token}`, `GET /api/track/{token}` | `GET /track/v1/{token}` + `GET /channel/v1/orders/{id}/status` (own orders only) |
| `GET /api/track/{token}/events` | one `GET /channel/v1/events` per store (SSE), shared |
| `/api/account/*` | `/channel/v1/account/*` (+ `X-Customer-Session`, `X-Customer-IP`) |

**One call without a host:** Square's OAuth redirect. The Square app's redirect URL is this
server's `GET /square/oauth/callback` (any host); it relays `{code, state}` to main's
`POST /square/oauth/forward` with the platform key alone (main's signed `state` names the store)
and sends the browser to main's `redirect` (Store › Payments). See ARCHITECTURE.md.

Errors are relayed with main's status and `{error, code}`; a `401 session_invalid` clears the
session cookie.
