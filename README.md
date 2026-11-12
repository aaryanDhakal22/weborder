# quicc storefront

Ordering websites for quicc restaurants. One SvelteKit server serves every store from its own host
(`<slug>.quiccpos.com` or a custom domain). It is a **thin web-channel adapter on quicc main's
`/channel/v1`**: main owns the menu, prices, deals, hours, orders, payments, customer accounts and
tracking; the storefront renders them (full SSR for search engines) and relays the customer's
actions. Plan: `../WEBORDER-PLAN.md` (stage 4).

## Run it (dev)

Dev main must be up (`task dev` at the repo root). Then, once:

```bash
uv run --directory ../console python main.py --do site-wire dev   # host lombardis.localhost + a platform key in .env
npm install
```

and:

```bash
npm run dev            # http://lombardis.localhost:5173
```

`*.localhost` resolves to your machine in every browser. With no Square app connected, checkout
offers main's test card (`tok_visa` approves, `tok_decline` declines); dev main's fake Square
offers its own test cards. Sign-in codes are logged by dev main
(`GET /admin/v1/dev/signin-code?phone=…`).

## Environment

| Variable | Default | |
| --- | --- | --- |
| `MAIN_URL` | `http://localhost:1323` | main's base URL. Plain `http` only to a private address (loopback, LAN, Tailscale `100.64/10` / `*.ts.net`, a compose service name); else the server refuses to start |
| `ALLOW_INSECURE_MAIN` | off | `1`: allow plain `http` to a public main (test setups only: the platform key would cross the internet unencrypted) |
| `OUTBOX_PATH` | `data/outbox.db` | the order outbox (SQLite): orders written before main is asked, kept until main answers. A volume in a container (`/app/data`) |
| `ORDER_WAIT_MS` | `22000` | how long Place order waits for main before the outbox takes over ("Still confirming") |
| `PLATFORM_KEY` | — | the storefront's `qpk_…` key (main admin → Platform keys); also relays Square's OAuth redirect (`/square/oauth/callback`, see docs/ARCHITECTURE.md) |
| `REFRESH_SECONDS` | `30` | how often each store's menu version, website settings and payments are re-checked |
| `TRUST_PROXY` | off | `1` behind Caddy / Traefik: read `X-Forwarded-Host` / `-For` / `-Proto` (the Secure cookie flag and HSTS follow `-Proto`) |
| `HOST_ALIASES` | — | `name:port=store-host,…` — serve a store on a LAN address (staging) |
| `PORT` | `3000` | (adapter-node) |

## Tests

```bash
npm test               # unit: main's pricing engine copy vs main's 29 shared cases, menu + look helpers
npm run test:e2e       # builds, then runs against a live main (dev by default): two throwaway stores
npm run test:browser   # builds, then Playwright clicks every page and control (test/browser/, phone +
                       # desktop, 36 screenshot baselines) against a live main; each worker its own store
npm run check          # svelte-check
npm run sync-engine    # copy main's engine + cases after main changes them (`-- --check` compares)
BASE_PORT=5180 npm run shots   # screenshots of every page × phone / tablet / laptop (needs a running server)
```

`task gate` (repo root) runs `check` + unit + the engine check in its static lane, and `test:e2e`
then the browser tests after the dev suites. Browsers: `npx playwright install chromium` once.
A look changed on purpose: `npx playwright test screenshots --update-snapshots`, then look at the
new images before committing them.

## Deploy

`deploy/Dockerfile` (the image), `deploy/compose.staging.yml` (staging: a container on
`192.168.1.221` next to staging main, LAN only, `http://192.168.1.221:3100`), `.github/workflows/ci.yml`
(check + tests + build; the image to GHCR from `staging` and `v*` tags).

More: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/MAIN.md](docs/MAIN.md).
