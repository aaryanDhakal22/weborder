# quicc storefront

Multi-tenant ordering websites for quicc restaurants. One SvelteKit app serves every store from its
own host (`<slug>.quiccpos.com` or a custom domain). Pages are server-rendered for SEO, and
**published as pre-compressed static snapshots** that are served in about 1–2 ms. An admin builds
a new store from a name, an address, a preset, a brand color and the POS menu CSV.

It runs today on a **built-in mock data source** (JSON files) with the same shape as the planned
main API, so it can be switched to main later with one environment variable (see
[docs/MAIN-API.md](docs/MAIN-API.md)).

## Run it

```bash
npm install
npm run dev
```

| Open | What |
| --- | --- |
| http://lombardis.localhost:5173 | Lombardi's: real POS menu (258 items after cleanup), pizza builder, deals |
| http://fern.localhost:5173 | Fern & Fold: pickup-only café, photo grid, side nav |
| http://lumbre.localhost:5173 | La Lumbre: custom homepage, printed menu, Spanish first (`/en` for English) |
| http://admin.localhost:5173 | Admin (password `quicc-dev` in dev): create, preview, publish stores |

`*.localhost` resolves to your machine in Chrome, Firefox and Safari with no hosts-file edits. The demo
stores are seeded from `fixtures/` into `data/` on first start; delete `data/` to start over.

Test card numbers on the checkout: `4242 4242 4242 4242` approves, `4000 0000 0000 0002` declines.
Order tracking advances by itself (stages every few seconds with `DEMO_FLOOR=fast`, the default), or
step it from the admin's Orders tab.

## Create a store

**In the admin:** New store → name, address, kind of store, a preset, a brand color (or pick it from
the logo), and the menu CSV. You get a cleanup report (POS deal halves, pre-sized buttons and $0
lines dropped; sizes made real; most-ordered items marked Popular), a draft preview link, and a
Publish button.

**From the terminal** (talks to the admin API):

```bash
npm run store -- create --name "Tony's Brick Oven" --preset pizzeria-loud --brand "#C0392B" \
  --type pizza_delivery --street "1 York Rd" --city Towson --state MD --zip 21204 \
  --phone "(410) 555-0100" --cuisine "Pizza, Subs" --csv menu.csv --publish
npm run store -- list
npm run store -- publish lombardis
```

Everything else (home page copy, SEO, structured data, sitemap, app icon, manifest, starter deals, a
WCAG-checked palette) is generated from that.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server on :5173 |
| `npm run build` / `npm start` | Production build / run it (`PORT`, default 3000) |
| `npm run check` | Svelte + TypeScript check |
| `npm test` | Unit tests (`node:test`): pricing, deals, hours, theme contrast, CSV import, sanitizer |
| `npm run test:e2e` | Builds, starts the production server on a temp data folder, tests tenancy, SEO, ordering, admin and snapshots over HTTP |
| `npm run store -- …` | Admin CLI (above) |
| `npm run shots` | Screenshots of every store × page × phone/tablet/laptop → `reports/screenshots/` (needs a running server, `BASE_PORT`) |
| `npm run perf` | Page weight, time to first byte and first paint → `reports/perf.md` (`PERF_PORT`) |
| `npm run export` | Static, script-free copy of the published sites → `export/` (`EXPORT_DATA`) |
| `npm run fonts` | Re-download the self-hosted preset fonts |

## Environment

| Variable | Default | Meaning |
| --- | --- | --- |
| `BASE_DOMAIN` | `localhost` | Stores answer on `<slug>.<BASE_DOMAIN>`; `quiccpos.com` in production |
| `ADMIN_HOST` | `admin.localhost` | Host of the admin |
| `ADMIN_PASSWORD` | `quicc-dev` | Admin login and CLI bearer token. **Set it in production.** |
| `SECRET` | random per start | Signs admin sessions, preview links and publisher requests. Set it so sessions survive restarts. |
| `DATA_DIR` | `data` | Mock store/order files and published snapshots |
| `DATA_SOURCE` | `mock` | `main` to use quicc main's `/site/v1` API (`MAIN_URL`, `MAIN_SITE_KEY`) |
| `SNAPSHOTS` | on | `off` serves every page with live rendering |
| `DEMO_FLOOR` | `fast` | `real` makes the simulated order stages take minutes |
| `PORT` | `3000` | Production port (the publisher renders pages by calling it) |
| `RENDER_ORIGIN` | | Override where the publisher sends render requests |
| `HOST_ALIASES` | | Dev/demo only: `name:8444=fern.localhost,…` serves each store on its own port of one machine name (e.g. behind `tailscale serve`) |

## Layout

```
src/lib/            pure modules (also run under node:test): types, pricing, hours, theme, menu-csv, i18n, util, live
src/lib/server/     config, tenancy, auth, orders, payments (mock), publish, seo, copy, create, seed, source/{mock,main}
src/lib/components/ Svelte components: ItemConfigurator, PizzaPie, MenuList, DealCard, Mascot, …
src/routes/(site)/  storefront pages under [[lang]]; sitemap, robots, manifest, icon
src/routes/api/     live, quote, checkout, orders, order events (SSE)
src/routes/admin/   admin pages + admin/api for the CLI
fixtures/           the three demo stores (Lombardi's from its real POS export)
scripts/            store CLI, CDP screenshot driver, perf, export, font fetcher
test/unit, test/e2e
deploy/             Caddyfile, Dockerfile, compose example (not deployed)
docs/               ARCHITECTURE.md, MAIN-API.md
```

## Dependencies

Runtime: none beyond SvelteKit's Node adapter. Dev: `svelte`, `@sveltejs/kit`, `@sveltejs/adapter-node`,
`@sveltejs/vite-plugin-svelte`, `vite`, `typescript`, `svelte-check`, `@types/node`, all pinned.
Everything else (CSV parsing, OKLCH color math and contrast checks, validation, i18n, HTML
sanitizing, HMAC sessions, compression, the screenshot driver) is written on the standard library.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how it fits together.
