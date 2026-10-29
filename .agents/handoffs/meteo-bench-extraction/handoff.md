# Meteo bench extraction

**Status:** active — the app is deployed at `https://meteo.wyzar.io` and passes the parity check there; push auto-deploy does not work yet, the user's phone refuses to install it (phone-side), and the bench has not been removed from wyts-platform.

## Goal

Extract the Meteo bench out of wyts-platform into its own app at `~/dev/_/meteo/` (repo `vibl/meteo`), deploy it on Dokploy at `meteo.wyzar.io`, then remove it from wyts-platform.

Done when `pnpm dev` runs the app in `~/dev/_/meteo/` with nothing importing from wyts-platform, `https://meteo.wyzar.io` serves it and a push redeploys it, it passes the parity checklist, and Meteo is gone from wyts-platform.

## Plan

The decisions, each with its reasoning, are in [2026-10-26_meteo-bench-extraction-decisions.md](../../plans/2026-10-26_meteo-bench-extraction-decisions.md). They are settled; do not reopen them unless new facts weaken their reasoning.

The step-by-step plan is [2026-10-26_meteo-bench-extraction-plan.md](../../plans/2026-10-26_meteo-bench-extraction-plan.md), now superseded by this handoff (steps 1 to 6 are done, apart from push auto-deploy). Step 7 (removal from wyts-platform) is still to do and is still worth reading in full there: this handoff does not repeat its detail. Both files sit under `.agents/plans/`, so the user's rule applies: ask before reading them.

Corrections to that plan, found while carrying it out:

- **wyts-platform has no `CLAUDE.md` any more.** Commit `24217ea6` made `AGENTS.md` the instructions file and dropped it. Step 7's "remove the `meteo` row from the Scopes table in `CLAUDE.md`" means `AGENTS.md`, whose Scopes table is around line 113. The plan's requirement to **ask the user before editing it** still stands.
- **The shadcn-svelte CLI no longer does what step 3 assumes** (SHADCN-DRIFT). See [the lesson doc](../../../../wyts-platform/.agents/docs/shadcn-svelte/cli-registry-drift.md), which stays in wyts-platform because it describes that repo's components. The user chose to copy the three components from wyts-platform instead.
- **The port base is `b416a2cd`**, not the hash the plan was written against.
- **WILDCARD-INGRESS worked as planned**, including the proxied wildcard CNAME the decisions file listed as undocumented: no fallback needed. A random `*.wyzar.io` host answered 502 at first; since cloudflared's restart for the token rotation it answers 404, as the plan expected (cause of the change unknown).

## State

**Where this handoff lives.** In `~/dev/_/meteo/.agents/`, with the plan and the decisions log in `.agents/plans/`. They were written in wyts-platform, so paths in them without a `~/dev/_/meteo/` prefix are relative to `~/dev/_/wyts-platform/`; step 7 runs there. wyts-platform's `AGENTS.md` points here.

**The app.** `~/dev/_/meteo/`, branch `main`, pushed to `git@github.com:vibl/meteo.git` (public). What was built and why is in the [scaffold-and-port log](sessions/2026-10-29_scaffold-and-port.md) and in the repo's own `AGENTS.md` and `README.md`. `pnpm check`, `pnpm lint` and `pnpm build` pass. The local backup branch `backup/pre-readme-scrub` is safe to delete. `src/lib/assets/favicon.svg` (from the scaffold) is unused and was left in place.

**Deployed, and parity confirmed by the user** on `pnpm dev` and on `https://meteo.wyzar.io` (2026-10-29: "perfect").

**PWA install on the user's Android phone fails, for a phone-side reason.** Brave and Firefox install nothing, silently, and "Add to Home screen" fails for wikipedia.org too, so the phone refuses all pinned shortcuts. The manifest got PNG icons anyway (commit `3aac8a5`, deployed). The phone's brand and launcher are not known yet; the notification check on Android waits on an installed app. See [the install doc](../../docs/pwa/android-install.md).

- Dokploy application `meteo`: `6DxKJnAeV08TefWwctYRH`, swarm name `meteo-orjeii`, GitHub provider `jXWLziIJwxc9cu_G2xQSA` on `vibl/meteo` `main`, build type Dockerfile, `autoDeploy: true`. Domain `wG2rfm2GnKo2UkPkLi207`: `meteo.wyzar.io`, port 3000, `https: true`, `certificateType: letsencrypt`. First build (manual `application.deploy`) succeeded in about a minute. These IDs are also in meteo's `AGENTS.md`.
- Tunnel: wildcard ingress rule and proxied `*` CNAME live since 2026-10-29 (tunnel config version 3). Connector token rotated 2026-10-29 (procedure in `networking-ingress.md`). Verified through Cloudflare after the rotation (`curl --resolve` to a Cloudflare IP): `meteo`/`wyts`/`zero`/`electric` 200, `dokploy.wyzar.io/` 404, webhook path 401, random host 404.
- wyts-platform commit `226087af` (`chore: route *.wyzar.io through the tunnel`, only `scripts/deployment/cloudflare-tunnel-setup.ts`) is **not pushed**, and neither is the docs commit made at the end of this session. wyts-platform's working tree holds the user's own unrelated uncommitted changes (`.env`, `.gitignore`, several plan files, `scripts/claude-keepalive/README.md`, `scripts/inspect/zero-replica-exists-cost.ts`): never stage them.

**Push auto-deploy is broken, for every Dokploy app, not just meteo.** The GitHub App Dokploy uses, `Dokploy-2026-05-07-vibl`, has the right webhook URL (`https://dokploy.wyzar.io/api/deploy/github`, reported by the user) but GitHub sends it no `push` events: its delivery log showed only one delivery (`installation_repositories.added`, which Dokploy always answers 400, so "failed" is normal for it). The wyts Server app's last push-triggered deployment is 2026-08-11 (read from `deployment.all`). Cause not found; the user was asked to check the app's "Permissions & events" → Push subscription and any pending permission request on the installation. Details in wyts-platform's `docs/development/deployment/dokploy-platform.md`, section "GitHub App".

**GitHub Apps.** The user deleted the two stale apps, `Dokploy-2025-12-08-6dpi7v` and `Vibl-Dokploy-Home-Server`, and added `vibl/meteo` to `Dokploy-2026-05-07-vibl`; Dokploy now lists both repos.

**Credential exposures from the deploy session are settled:** the leaked tunnel token was rotated, and the leaked GitHub App secret belonged to a deleted app.

## Next

1. **Help the user fix the phone's shortcut refusal**, once they give the phone's brand, model and launcher; then confirm the install and the notification on Android.
2. **Get the user's answers** on the remaining open questions: push events, pushing wyts-platform.
3. **Fix push auto-deploy** once the cause is known, then confirm with a trivial push to `vibl/meteo`: `deployment.all applicationId=6DxKJnAeV08TefWwctYRH` should show a new deployment whose `description` holds the pushed commit hash. This is part of "done".
4. **Step 7, removal from wyts-platform** — parity has passed, so it is unblocked. One commit, `refactor: remove the meteo bench, extracted to vibl/meteo`. It touches many files (listed in the plan's step 7), so **list them for the user and ask before editing**, per the global file-safety rule, and ask separately before editing wyts-platform's `AGENTS.md`. Stage by explicit path only.
5. **Close this handoff** and surface the plan's three follow-ups (INFRA-HOME, the template question, endpoint abuse).

## Open questions

- **Why no push events reach `Dokploy-2026-05-07-vibl`.** Blocks the "a push redeploys it" criterion, and affects the wyts apps too.
- **Push wyts-platform's two local commits?** Asked, no answer yet. Pushing triggers nothing while push events are broken.
- **Which phone and launcher** refuse home-screen shortcuts. Blocks the Android install and notification checks, not the rest.
- **An orphaned commit on GitHub still carries the deployment detail in the old README** (`gh api repos/vibl/meteo/commits/36c869c` resolves until GitHub garbage-collects it). The user has been told and has not decided. No credentials are involved. Blocks nothing.
- **Editing wyts-platform's `AGENTS.md`** in step 7 needs the user's explicit OK.

## Read first

- [sessions/2026-10-29_pwa-install-and-token-rotation.md](sessions/2026-10-29_pwa-install-and-token-rotation.md) — the latest session: PWA install diagnosis, token rotation.
- [sessions/2026-10-29_deploy.md](sessions/2026-10-29_deploy.md) — deploy, tunnel, GitHub App investigation.
- [sessions/2026-10-29_scaffold-and-port.md](sessions/2026-10-29_scaffold-and-port.md) — the session that built the app.
- wyts-platform's `docs/development/deployment/dokploy-platform.md` ("GitHub App") and `networking-ingress.md` ("Public `*.wyzar.io` hosts").
- The plan's step 7 (ask before reading), and `~/dev/_/meteo/AGENTS.md`.
