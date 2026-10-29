# Meteo

A single-page weather view for one hardcoded place, Nogent-sur-Marne: an hourly forecast grid, a one-hour rain nowcast grid, daylight shading from sunrise/sunset times, and an optional "birds sing when the rain stops" alert. It installs as a PWA.

It was extracted from the `meteo` bench of wyts-platform (ported from commit `b416a2cd`), which kept 35 commits of its history between 2025-12-01 and 2026-06-18.

## Run it

```sh
pnpm install
pnpm dev
```

`pnpm check` typechecks, `pnpm format` and `pnpm lint` handle Prettier, `pnpm build` produces the `adapter-node` server in `build/` (`node build` runs it, on `PORT`, default 3000).

There is nothing to configure: no database, no environment variable, no secret. All data is fetched live from upstream on every load.

## Location

`LAT`/`LON`/`INSEE` for Météo-France and the slightly different `SUN_LAT`/`SUN_LON` for the sun API are hardcoded in `src/lib/server/api.ts`. Nogent-sur-Marne also appears in the page title, the heading and the notification text.

## Data flow

- `src/routes/+page.svelte` calls the three GET endpoints in parallel through `src/lib/api.ts`, then transforms the responses into grid rows (`transformForecast`, `transformRain`).
- `GET /api/forecast` → `fetchForecast()`, Météo-France `rwg.meteofrance.com/internet2018client/2.0/forecast`.
- `GET /api/rain-nowcast` → `fetchRainNowcast()`, Météo-France `…/2.0/nowcast/rain`.
- `GET /api/sunrise-sunset` → `fetchSunriseSunset()`, `api.sunrisesunset.io` (no auth).
- Each endpoint under `src/routes/api/` is a one-liner over `src/lib/server/api.ts`, which holds every upstream call.
- The endpoints are public by decision: there is no access control, and each call reaches Météo-France from the server's IP.

## Météo-France auth

The Météo-France API has no public key. `getAuthToken()` fetches the public forecast page for Nogent-sur-Marne, reads the `mfsession` cookie from `set-cookie`, and ROT13-decodes it into a bearer token. It then calls the `rwg` API with `Authorization: Bearer <token>` and `Referer: https://meteofrance.com/`.

- The token is fetched fresh for every request, never cached, because sessions expire and a stale token makes upstream return non-JSON. Parallel callers share one in-flight fetch (`inFlightToken`).
- This has to run on a server: a browser cannot read the `set-cookie` of a cross-origin response.

## Page behavior

- **Refresh triggers:** on mount, on every "user became active" event from `getGlobalActivityDetector()` (`src/lib/activity.ts` — tab visibility, window focus, mouse, keyboard, scroll, touch), and from the Refresh button. Concurrent loads are dropped.
- **Forecast rows:** only the last 3 hours and the future, with the entries whose `T`/`relative_humidity` are null dropped. Beyond the hourly horizon Météo-France nulls these, and `rain_1h` turns null once upstream switches to 3h/6h buckets (see `src/lib/types.ts`).
- **Current row:** the row of the current hour, re-selected every 30 s.
- **Day and night shading:** from the sunrise/sunset times, per row.
- **Responsive grids:** below the `md` breakpoint the grids switch to the narrow column configs in `src/lib/columns.ts`. Above it the wrappers are content-sized, which is why the responsive config is applied only below `md` (SVAR's width-based observer would otherwise close a layout feedback loop).
- **Birds alert:** a checkbox persisted in `localStorage` under `meteo:birds-alert-enabled`. While it is on, the page also polls every 10 min. It fires only on a real transition from "some rain" to "dry" between two snapshots (`rain_intensity > 1` means rain, 1 means dry), never on the first fetch. When it fires it plays `static/birds-singing.mp3` and shows a browser notification.
- **Notification:** `src/lib/notify.ts` asks for permission when the checkbox is turned on — that is the user gesture browsers require — and shows the notification through `ServiceWorkerRegistration.showNotification()` when a service worker is registered, falling back to `new Notification()`. Chrome for Android throws on the constructor, which is the only reason `src/service-worker.ts` exists: it has no fetch handler and caches nothing, so it can never serve stale app code. SvelteKit registers it in production builds only, not in `vite dev`.

## Look

Dark-only. The wyts palette lives in `src/app.css` as fixed tokens (no theme system, no light variant), together with the `--wx-*` mapping the SVAR grids read. The grid-specific variables and the behavior rules that make a grid fill its height sit with the wrapper in `src/lib/components/DatagridTheme.svelte`.

`Button`, `Checkbox` and `Label` under `src/lib/components/ui/` are shadcn-svelte components carried over from wyts-platform, so they keep its customizations — notably the `outline` variant and the `icon-sm` size the page uses. `components.json` describes what the shadcn CLI would generate today (vega preset, neutral base, Lucide), which is **not** where these three came from; see `AGENTS.md`.

## Container build

The `Dockerfile` is a multi-stage Node 22 alpine build — deps, prod-only deps, builder, then a production stage running `node build` on port 3000. Two things to keep in mind when changing it:

- pnpm is pinned twice on purpose, `packageManager` in `package.json` and `corepack prepare` in the `Dockerfile`, because `pnpm@latest` resolves at build time and a new pnpm major can refuse the committed lockfile under `--frozen-lockfile`.
- Every package the server imports must be in `dependencies`, not `devDependencies`: the production stage installs with `--prod`.

Where this is deployed and how is described in `AGENTS.md`.
