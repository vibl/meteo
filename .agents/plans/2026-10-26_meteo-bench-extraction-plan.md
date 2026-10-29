# Meteo bench extraction plan

> **Superseded (2026-10-29) by [.agents/handoffs/meteo-bench-extraction/handoff.md](../handoffs/meteo-bench-extraction/handoff.md).** This is the draft written before the work started. Steps 1 to 5 are done; steps 6 (deploy) and 7 (removal from wyts-platform) are still to do and their detail here is still current, except for the three corrections the handoff lists. Read the handoff first for where things stand.
>
> Written in wyts-platform's `.specs/prompts/plans/` and moved to this repo on 2026-10-29. Paths without a `~/dev/_/meteo/` prefix are relative to wyts-platform (`~/dev/_/wyts-platform/`).

Extract the Meteo bench out of wyts-platform into its own app at `~/dev/_/meteo/` (repo `vibl/meteo`), deploy it on Dokploy at `meteo.wyzar.io`, then remove it from wyts-platform.

Every decision behind this plan is settled and recorded, with its reasoning, in [2026-10-26_meteo-bench-extraction-decisions.md](2026-10-26_meteo-bench-extraction-decisions.md). Do not reopen them unless new facts weaken their reasoning. The bench itself is described in `docs/wyts-framework/benches/meteo.md`: read it before starting.

## Done when

- `pnpm dev` runs the app in `~/dev/_/meteo/`, and nothing in it imports from wyts-platform.
- `https://meteo.wyzar.io` serves it, and a push to `vibl/meteo` redeploys it.
- It passes the parity checklist below.
- Meteo is gone from wyts-platform (Removal step).

## Open questions to ask the user when reaching them

These were not settled in the decision session. Ask, do not pick.

- **Repo visibility** of `vibl/meteo`: private or public (asked in the Create the project step).
- **`domain` facet** of the `[meteo]` manifest entry: a free value. Other entries use values like `automation`, `data`, `websites` (asked in the Create the project step).
- **Agent docs in the new repo**: whether `_/meteo` gets its own `CLAUDE.md`/`AGENTS.md`, and what goes in it (asked in the Create the project step).

## Parity checklist

The behaviors today's bench has, per `docs/wyts-framework/benches/meteo.md` and the source. The new app must show each one.

- Hourly forecast grid, keeping only the last 3 hours and the future, without the rows where `T`/`relative_humidity` are null.
- Rain nowcast grid for the next hour.
- Day and night row shading from the sunrise/sunset times, and the current-hour row highlighted, re-selected every 30 s.
- Responsive grids below the `md` breakpoint (the `isBelowMd` column config).
- Refresh on load, when the user becomes active again (activity detector: tab visible, mouse, keyboard), and from the Refresh button. Concurrent loads are dropped.
- Birds alert checkbox, persisted in `localStorage` under `meteo:birds-alert-enabled`. While on, polling every 10 min. On a real rain→dry transition (never on the first fetch): plays `birds-singing.mp3` **and** shows a browser notification, which replaces the old server-side desktop notification.
- Installable as a PWA, with its icon and `#0EA5E9` theme color.
- The wyts dark palette and the current grid look.

## Steps

### 1. Cloudflare wildcard DNS check

The WILDCARD-INGRESS decision rests on Cloudflare features. Three were confirmed in the docs on 2026-10-26. One was not: **a proxied wildcard CNAME `*.wyzar.io` → `<tunnel UUID>.cfargotunnel.com`**. It is tested in step 6, when the record is created. If it doesn't route, use the fallback there. Nothing to do before then.

### 2. Create the project

- Read `~/dev/README.md` and `~/dev/AGENTS.md` (`~/dev` was reorganized on 2026-10-23).
- Scaffold in `~/dev/_/meteo/` with `pnpm dlx sv create meteo` (SvelteKit minimal, TypeScript, Prettier; add Tailwind through the `sv` add-ons). `meteo` has no near-homonym in `~/dev` other than the unrelated `weather-alert` [VERIFIED by listing `~/dev/_/` on 2026-10-26].
- Replace the adapter with `@sveltejs/adapter-node`.
- `git init`, then create the GitHub repo `vibl/meteo` (**ask the user for its visibility**) and push.
- Add `[meteo]` to `~/dev/projects.toml`: `kind = "project"`, `origin = "own"`, `status = "active"`, `context = "perso"`, `domain` = **ask the user**. Then run `dev-views check` and `dev-views build`.
- **Ask the user** whether the repo gets a `CLAUDE.md`/`AGENTS.md`.

### 3. UI kit and palette (STOCK-WITH-PALETTE)

- `shadcn-svelte init` (slate base, as wyts-platform's `components.json`), then add `button`, `checkbox`, `label` through its CLI.
- Paste the palette from wyts-platform's `src/styles/strategies/combination-a.css` into `src/app.css` as fixed tokens. **Not** the JS theme system (`src/lib/stores/themes.ts`, `theme.svelte.ts`), **not** daisyUI. The wyts theme is dark-only (`color-scheme: dark` in the grid theme).
- Grid theme: build a small `DatagridTheme` for the new app from `src/lib/components/ui/datagrid/theme.svelte` and `src/lib/theme/{wyts-tokens,svar-compat,svar-grid}.css` (about 580 lines in total). Keep only:
  - the `--wx-*` variable mapping onto the palette tokens;
  - the rules that change behavior: the grid fills its height (`.wx-grid { flex: 1; min-height: 0; width: 100% }`, and the "do not add display:flex to the wrapper" warning), word-boundary wrapping for auto-height rows, the header staying above scrolled rows (`z-index`), `nowrap` cells;
  - the `svar-theme` context the wrapper sets.
- Keep the SVAR icon font import (`https://cdn.svar.dev/fonts/wxi/wx-icons.css`, first line of wyts-platform's `app.css`) if the grids show any icon. [INFERRED: check when porting]

### 4. Port the code (FRESH-SCAFFOLD)

Before copying, note wyts-platform's current `HEAD` hash. The first port commit in `vibl/meteo` names it ("ported from wyts-platform at `<hash>`"). The last commit touching Meteo there is `0e0132ae` (2026-06-18) [VERIFIED].

**Copy as is** (Meteo's own code), then fix only import paths:

- `src/routes/meteo/+page.svelte` → `src/routes/+page.svelte` (the app's single page).
- `src/routes/meteo/{types,columns}.ts` → `src/lib/`.
- `src/routes/meteo/components/*` → `src/lib/components/`, **except** `RefreshFrequencySlider.svelte` (dead code: imported nowhere, and Meteo's only use of `svelte-range-slider-pips`).
- `src/lib/server/meteo/api.ts` → `src/lib/server/api.ts`, **minus** `notifyRainStopped()` and the `node-notifier` import.
- `src/lib/activity.ts` → `src/lib/activity.ts` (the activity detector, unchanged).
- `static/meteo/{birds-singing.mp3,icon.svg,manifest.webmanifest}` → `static/`.

**Rewrite (glue):**

- Endpoints: `src/routes/api/{forecast,rain-nowcast,sunrise-sunset}/+server.ts`, same one-liners as `src/routes/api/meteo/*`. **No** `notify-rain-stopped` endpoint, and therefore no `handle`, no `apiCall`, no `valibot`.
- Client API (`src/routes/meteo/api.ts` today): the paths become `/api/forecast` etc., and `notifyRainStopped` goes away.
- Asset path: `<audio src="/meteo/birds-singing.mp3">` becomes `/birds-singing.mp3`.
- PWA: in the manifest, `start_url`/`scope` `/meteo` become `/` and the icon `src` becomes `/icon.svg`. In `src/app.html`, a static `<link rel="manifest">` and `<meta name="theme-color" content="#0EA5E9">` replace wyts-platform's `PWA_BENCHES` script. Favicon: `icon.svg`.
- Navigation: none. No `AppShell`, no `pages.ts`, no `+layout.svelte` beyond what the scaffold needs.
- **Browser notification** (NOTIFICATIONS): where the page called `notifyRainStopped()`, show a notification ("Rain stopped", with the place name as today's text). Ask for permission when the user turns the birds checkbox on (that's a user gesture). On Chrome for Android, `new Notification()` from a page throws, and only `ServiceWorkerRegistration.showNotification()` works [PRIOR: verify]. If the app is used on a phone, register a minimal service worker (no fetch handler, no caching) and notify through it. Test both desktop and phone.

**Dependencies:** `@svar-ui/svelte-grid`, `@lucide/svelte`, plus what shadcn adds. Fresh scaffolds may bring newer Svelte/Kit/Vite than wyts-platform (Kit 2.49, Svelte 5.46, Vite 7.3 [VERIFIED in its `package.json`]). If SVAR grid misbehaves, pin to those versions first. Every package imported by server code must be in `dependencies`, not `devDependencies` (`docs/development/deployment/dokploy-platform.md`, operational gotchas).

**Verify locally:** `pnpm check` passes. `rg -n "wyts|\\$lib/server/http|apiCall|node-notifier"` finds nothing. Ask the user to run `pnpm dev` and go through the parity checklist (desktop notification included).

### 5. Dockerfile and README

- `Dockerfile`: a small multi-stage build (Node 22 alpine, `corepack` pnpm, `pnpm install --frozen-lockfile`, `pnpm build`, a prod stage with `pnpm install --prod` and `node build`, `PORT=3000`). Use wyts-platform's `Dockerfile` as reference only: everything about zero-sqlite3, patches, `DATABASE_URL` and port 4848 doesn't apply. Before the first deploy, read `docs/development/runbooks/dokploy-pnpm-lockfile-config-mismatch.md` in wyts-platform.
- `README.md`: built from wyts-platform's `docs/wyts-framework/benches/meteo.md` (data flow, Météo-France auth and the ROT13 cookie trick, page behavior, hardcoded Nogent-sur-Marne), updated for the new paths and the browser notification, with the shared-code and outside-references sections dropped. Add how to run and deploy it.

### 6. Deploy (DEPLOY-TOOLING, WILDCARD-INGRESS)

Read first: wyts-platform's `docs/development/deployment/dokploy-platform.md` and `networking-ingress.md`, and the home-server Dokploy docs in `~/dev/_/sys/.agents/docs/home-server/dokploy/`. Use the REST helper for writes (`tsx --env-file=.env.development.local scripts/deployment/dokploy-api.ts …` from wyts-platform): the Dokploy MCP write schemas have drifted.

**Dokploy application** (project `vianille-home-server`, environment `production`):

1. Create the application, with the GitHub provider on `vibl/meteo`, branch `master` or `main` (whatever the scaffold made), build type Dockerfile. Watch the present-not-optional fields on `saveBuildType` (`dockerfile`, `herokuVersion`, `railpackVersion`).
2. `autoDeploy: true`.
3. Domain `meteo.wyzar.io`, port 3000, HTTPS through Traefik's `websecure` entrypoint with the `letsencrypt` resolver (DNS challenge via Cloudflare, already set up). Traefik must present a valid certificate for the host, since the tunnel keeps TLS verification on.
4. Deploy, and watch it with `deployment.all` (sort by `createdAt`, check the commit hash in `description`).

**Tunnel** (one-time change to the shared tunnel, in wyts-platform's `scripts/deployment/cloudflare-tunnel-setup.ts`):

1. Ingress order: `wyts`, `zero`, `electric`, then the `dokploy.wyzar.io` rules (webhook path, then `http_status:404`), **then** `{ hostname: '*.wyzar.io', service: 'https://localhost:443', originRequest: { matchSNItoHost: true } }`, then the catch-all `http_status:404`. The Dokploy rules **must** stay above the wildcard: rules are matched first to last.
2. DNS: add a proxied `*` CNAME to the tunnel next to the explicit records the script already manages.
3. Run with `--dry-run`, then for real.
4. **Check before moving on:**
   - `https://meteo.wyzar.io` serves the app.
   - `https://dokploy.wyzar.io/` still returns 404 (the UI is not exposed).
   - `wyts`, `zero` and `electric` still work.
   - A random `https://<anything>.wyzar.io` gets a 404, not an error page from another app.
5. **Fallback** if the wildcard CNAME doesn't route: replace it with one explicit proxied CNAME `meteo` → tunnel, and keep the wildcard ingress rule. Record in the decisions file that each new app needs one DNS record.
6. Commit the script change in wyts-platform (`chore: route *.wyzar.io through the tunnel`).

Then run the parity checklist on `https://meteo.wyzar.io`, on desktop and on the phone: install the PWA, test the notification.

### 7. Removal from wyts-platform (REMOVAL: BUNDLED)

Only after step 6's parity check passes. One commit, which is why it has no `meteo` scope (the scope is removed in the same commit): `refactor: remove the meteo bench, extracted to vibl/meteo`.

- Delete `src/routes/meteo/`, `src/routes/api/meteo/`, `src/lib/server/meteo/`, `static/meteo/`.
- `git rm docs/wyts-framework/benches/meteo.md` (its content now lives in the new repo's README).
- `src/app.html`: drop `meteo` from `PWA_BENCHES`.
- `docs/wyts-framework/pwa.md`: switch the Meteo examples (icon padding, "focused tool", the `eae8b3d` history line) to Snippets.
- `docs/wyts-framework/benches.md`: remove the row.
- `docs/wyts-framework/architecture/data-model-strategy.md`: remove meteo from the list of mini-apps.
- `commitlint.config.js`: remove `'meteo'`. `CLAUDE.md`: remove the `meteo` row from the Scopes table. **Editing `CLAUDE.md` needs the user's explicit OK**: ask at this point.
- `pnpm remove node-notifier @types/node-notifier`. Leave `@svar-ui/svelte-grid` and `svelte-range-slider-pips` (other benches use them).
- Check: `rg -i meteo -g '!.specs/**' -g '!docs/dependencies/**'` finds nothing, `pnpm check` passes, and the favicon fallback for `/meteo` doesn't matter anymore.
- Update the decisions file and this plan with the outcome (status line at the top).

## Follow-ups (not part of this plan)

Surface these to the user when the plan is done:

- **INFRA-HOME:** move server-level tooling (`cloudflare-tunnel-setup.ts`, `dokploy-api.ts`) out of wyts-platform into a home for home-server infra (the sys repo or a new `~/dev/_/` project). Deferred in the decision session.
- **Template:** once a second app is extracted, decide whether `_/meteo` becomes the starter for future ones.
- **Endpoint abuse:** the endpoints are public by decision, and each call hits Météo-France from the home IP. If that becomes a problem, add caching or rate limiting.
