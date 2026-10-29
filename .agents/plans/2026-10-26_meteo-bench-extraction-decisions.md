# Meteo bench extraction: decisions so far (handoff)

Handoff from the session "\*Meteo bench extraction plan" (2026-10-21 to 2026-10-26). The goal is a set of decisions that ends in writing a plan for extracting the Meteo bench out of wyts-platform into its own independent app, in its own directory and git repo. This file is **not** that plan: it records the decisions. All of them were settled on 2026-10-26, and the plan is [2026-10-26_meteo-bench-extraction-plan.md](2026-10-26_meteo-bench-extraction-plan.md).

Written in wyts-platform's `.specs/prompts/plans/` and moved to this repo on 2026-10-29; the work is now tracked in [the handoff](../handoffs/meteo-bench-extraction/handoff.md). Paths without a `~/dev/_/meteo/` prefix are relative to wyts-platform (`~/dev/_/wyts-platform/`).

## How to work on this

- The user wants **each decision brought as it comes**, one at a time: options under subheadings with for/against bullets, then a pick. Wait for the answer before moving on.
- Settled decisions below are settled. Do not reopen them unless new facts weaken their reasoning.
- Once every open decision is settled, write the extraction plan as a new file in `.specs/prompts/plans/`, so it can be carried out without this conversation.
- `~/dev` was reorganized on 2026-10-23. Read `~/dev/README.md` before creating the new project; `~/dev/AGENTS.md` points to it.

## What Meteo is

Everything here was read in source on 2026-10-21. The paths were re-checked on 2026-10-26.

- **Size:** about 937 lines under `src/routes/meteo/`, plus a server module and four endpoints. [VERIFIED]
- **Server:** `src/lib/server/meteo/api.ts` scrapes a session cookie from meteofrance.com, decodes it into a token, and calls Météo-France's forecast and rain-nowcast APIs, plus `api.sunrisesunset.io`. The endpoints under `src/routes/api/meteo/` (`forecast`, `rain-nowcast`, `sunrise-sunset`, `notify-rain-stopped`) are thin wrappers around it. [VERIFIED]
- **A server is needed:** the browser can't do the Météo-France cookie handling directly because of cross-origin rules. [INFERRED, not tested]
- **Notification:** `notify-rain-stopped` uses `node-notifier`, which shows a desktop notification on the machine running the server. The page also plays `birds-singing.mp3` in the browser. [VERIFIED]
- **No database:** the code never touches the DB, no table name mentions Meteo, and the `node` table has zero rows whose `node_type` contains "meteo" or "weather". [VERIFIED, queried 2026-10-21]
- **Static assets:** `static/meteo/` holds `birds-singing.mp3`, `icon.svg` and `manifest.webmanifest` (a PWA manifest). [VERIFIED]
- **Bench doc:** `docs/wyts-framework/benches/meteo.md` was an empty stub until 2026-10-26. It now describes the bench in full: data flow, the auth trick, page behavior, shared-code dependencies, dead code, and every reference outside the bench. Read it before planning.
- **Dead code:** `components/RefreshFrequencySlider.svelte` is imported nowhere, and it is Meteo's only use of `svelte-range-slider-pips`. [VERIFIED, per the bench doc and the import list]
- **No secrets:** `src/lib/server/meteo/api.ts` reads no environment variable. The coordinates are hardcoded. [VERIFIED 2026-10-26]
- **Shared wyts-platform code it uses:** [VERIFIED]
  - `AppShell` and `bench-config`, for navigation only.
  - `Button`, `Checkbox` and `Label` from `$lib/components/ui`.
  - `DatagridTheme` from the datagrid kit. The two grids are built on `@svar-ui/svelte-grid`.
  - `getGlobalActivityDetector` from `src/lib/activity.ts` (194 lines).
  - `apiCall` from `src/lib/api.ts` (16 lines).
  - The server-side `handle` from `$lib/server/http`.
- **Related code outside the repo:** `~/dev/_/scraping-lab/meteofrance/` holds two 2024 scripts, `getCookie.js` and `getAuthToken.js`, doing the same cookie handling. `~/dev/_/weather-alert/` is a dormant 2021 hot-weather email alert (Vercel, Firestore, SES), unrelated except by name. [VERIFIED]

## Settled decisions

### WHY

- All three reasons offered in the session's first question: a pilot for the wyts-next architecture work, an app the user wants to deploy and use on their own, and a way to shrink wyts-platform. (The user answered "the three you're mentioning".) The user also wants a pattern that future extracted apps can follow.

### SUCCESS-CRITERIA

- All of these: it runs with `pnpm dev` in its own directory, it's deployed, it has no imports from wyts-platform, and it has feature parity with today's bench.

### MOVE-OR-COPY

- Meteo **leaves wyts-platform entirely**: its routes, endpoints, server module and static assets are removed from this repo once the new app works.

### DATA

- **No database** in the new app, and no data to migrate.

### STACK

- **Only what's needed** from the current stack. That means SvelteKit plus a small server for the Météo-France calls. No DB and no sync layer.

### NOTIFICATIONS

- **Drop `node-notifier`.** The rain-stopped notification moves to the browser (Notification API, alongside the existing birds sound).
- Browser notifications need HTTPS, which the Cloudflare Tunnel provides. [PRIOR]

### DEPLOYMENT

- **Dokploy on `home-server`**, as for wyts-platform: a Dokploy Application built from the repo's own `Dockerfile`, auto-deployed on push, exposed through the Cloudflare Tunnel on `*.wyzar.io`.
- The runtime is therefore plain Node (`adapter-node`). [INFERRED]
- Requests to Météo-France would come from the home IP, as today, so datacenter-IP blocking is not a concern. [INFERRED, not tested]
- **Public endpoints are fine**: no access control.
- Dokploy and network docs live in `~/dev/_/sys/.agents/docs/home-server/dokploy/` (search them with `zvec_grep_search`, `root: /home/vianney/dev/_/sys`). Dokploy's own docs are indexed in the notes workspace `~/dev/_/dokploy/` (`root: /home/vianney/dev/_/dokploy`).
- The wyts-platform deployment scripts live in `scripts/deployment/`: `dokploy-api.ts`, `cloudflare-tunnel-setup.ts`, `dokploy-env-diff.ts`, `dokploy-save-env.ts`, `dokploy-sync-env.ts`. Whether the new app copies them or uses them from a shared package is part of SHARED-CODE. [VERIFIED that they exist]

### DIRECTORY

- **Path:** `~/dev/_/meteo/`. `~/dev/README.md` puts every project the user writes flat under `~/dev/_/`.
- **Repo:** `vibl/meteo`.
- **Hostname:** `meteo.wyzar.io`.
- **Manifest:** an entry `[meteo]` in `~/dev/projects.toml` with `context = "perso"`, then `dev-views build`. The other facets (`domain`, `kind`, `origin`, `status`, `lang`) are still to be filled: `kind = "project"`, `origin = "own"` and `status = "active"` are the obvious values. [INFERRED]

### SHARED-CODE

Settled on 2026-10-26, as a series of sub-decisions.

#### SHARING-MODEL

- **HYBRID:** app code is copied into `_/meteo` and owned there. No shared packages for now: there is too little code (about 400 lines besides deployment), and a locally linked package would likely break the Dokploy Docker build, whose context is the app's repo alone. [INFERRED]
- A template for future extracted apps waits until a second app shows what repeats. Meteo can then serve as its base.

#### FRESH-SCAFFOLD

- The new repo starts from a freshly created SvelteKit app (`sv create`), and code is copied in as the build needs it. Not a pruned copy of wyts-platform, and no `git filter-repo` history import.
- **Meteo's own code is copied as is** (page, grids, cells, columns, types, the Météo-France server module), since feature parity is a success criterion. Only the glue is rewritten: navigation dropped, notification moved to the browser, endpoint paths shortened.
- The first port commit names the wyts-platform commit it was copied from, so the 35 commits of Meteo history (2025-12-01 to 2026-06-18) stay one `git log` away.

#### UI-KIT

- **STOCK-WITH-PALETTE:** stock shadcn-svelte setup (`shadcn init`, then `Button`, `Checkbox`, `Label` added through the CLI). The wyts dark palette is pasted into `app.css` as fixed tokens from `src/styles/strategies/combination-a.css`, without the JS theme system (`src/lib/stores/themes.ts`) and without daisyUI.
- For the grids, copy only SVAR's `--wx-*` variable mapping and the rules that change behavior from `DatagridTheme` (`src/lib/components/ui/datagrid/theme.svelte`) and `src/lib/theme/{wyts-tokens,svar-compat,svar-grid}.css` (about 580 lines in all): the grid fills its height, cells wrap on word boundaries, the header stays above the rows.

#### DEPLOY-TOOLING

- **NONE-IN-APP:** the Meteo repo carries no deployment scripts. Meteo has no secrets, so the env scripts have nothing to do. Its deployment is a `Dockerfile`, auto-deploy on push, and a Dokploy domain. The one-time setup goes through wyts-platform's `scripts/deployment/dokploy-api.ts`.

#### WILDCARD-INGRESS

- The Cloudflare Tunnel routes `*.wyzar.io` to Traefik through one ingress rule, placed after the specific `dokploy.wyzar.io` rules, with `matchSNItoHost: true` and TLS verification kept on. A new app then needs only a domain in Dokploy.
- The user accepted the trade-off: a `wyzar.io` domain set in Dokploy goes public without a second check, and getting the rule order wrong would expose the Dokploy UI.
- Checked in Cloudflare's docs on 2026-10-26: wildcard ingress hostnames and first-match-wins order [VERIFIED], `matchSNItoHost` for remotely managed tunnels, meant for wildcard routing [VERIFIED], proxied wildcard DNS records on all plans and Universal SSL coverage of first-level subdomains [VERIFIED]. **Not documented:** a wildcard CNAME to `<UUID>.cfargotunnel.com`. The plan tests it, and falls back to one explicit DNS record per app with the wildcard ingress kept.

#### INFRA-HOME (deferred)

- Moving the server-level tooling (`cloudflare-tunnel-setup.ts`, `dokploy-api.ts`) out of wyts-platform is **deferred** until after the extraction (the user left it to the agent). With WILDCARD-INGRESS, the tunnel script rarely changes, so nothing blocks Meteo.

#### Small modules

- `getGlobalActivityDetector` (`src/lib/activity.ts`): copied as is.
- `handle` (`$lib/server/http`) and `apiCall` (`src/lib/api.ts`): **not copied**. Their only Meteo user is the `notify-rain-stopped` POST, which disappears with NOTIFICATIONS, and so does `valibot`. [VERIFIED that they're only used there]

### REMOVAL

- **BUNDLED:** once `meteo.wyzar.io` passes a parity check, a single change removes the bench's folders and every outside reference listed in the "References outside the bench" section of `docs/wyts-framework/benches/meteo.md`: `src/app.html` (`PWA_BENCHES`), `pwa.md`, `benches.md`, `data-model-strategy.md`, the `meteo` scope in `commitlint.config.js` and `CLAUDE.md`, and the `node-notifier` and `@types/node-notifier` dependencies, which nothing else uses. [VERIFIED 2026-10-26] No redirect from `/meteo`, and no side-by-side period.
- **The bench doc** moves to the new repo as the basis of its README. wyts-platform keeps no tombstone.
- **`pwa.md`** switches its examples (including the icon example) to Snippets, the other PWA bench.
- `@svar-ui/svelte-grid` and `svelte-range-slider-pips` stay in wyts-platform, since other benches use them. [VERIFIED]

## Side work done in the same session (no action needed)

- Dokploy docs cloned (`~/dev/clones/Dokploy/website`) and indexed in the notes workspace `~/dev/_/dokploy/`.
- `~/dev/clones/AGENTS.md` now defines "your own files" as files worth backing up, so rebuildable `.zvec-grep/` indexes may sit at owner level.
- `~/dev/clones/Dokploy/dokploy` was refreshed to `eaffeba4a` (2026-10-26). Its stray note was moved to `~/dev/_/sys/.agents/docs/home-server/dokploy/postgres_config_injection.md`, which is not yet committed in the sys repo.
