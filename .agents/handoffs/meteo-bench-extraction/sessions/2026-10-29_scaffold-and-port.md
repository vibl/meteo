# 2026-10-29 — scaffold `_/meteo` and port the bench into it

Session opened with "Run `.specs/prompts/plans/2026-10-26_meteo-bench-extraction-plan.md`" (the plan written by the 2026-10-21 → 2026-10-26 decision session). Carried out its steps 1 to 5, plus the three questions it left open. Did not deploy and did not touch the bench in wyts-platform.

## Done

- **The previous session's closing state was committed first**, as its own commit, not folded into this session's work: `b416a2cd docs(meteo): describe the bench in full and record the extraction decisions and plan` — `docs/wyts-framework/benches/meteo.md` (filled in from a stub) plus the two untracked `.specs/prompts/plans/2026-10-26_meteo-bench-extraction-*.md` files. Committed through `scripts/git/commit-group.ts`, which is the right path in this shared worktree (34 other files were dirty from other sessions and stayed untouched). `b416a2cd` is therefore the port base named in the new repo's first port commit.
- **`~/dev/_/meteo/` created and pushed** to `git@github.com:vibl/meteo.git`, public, default branch `main`. Three commits: `c1dcb8f` scaffold, `583ae1a` Tailwind entry + Prettier style, `36c869c` the port.
- **Scaffolded** with `pnpm dlx sv@latest create meteo --template minimal --types ts --add prettier --add "tailwindcss=plugins:none" --add sveltekit-adapter=adapter:node --install pnpm`. The `plugins:none` form is what makes the Tailwind add-on non-interactive, and `sveltekit-adapter=adapter:node` sets `@sveltejs/adapter-node` directly, so the plan's separate "replace the adapter" step was unnecessary. Result: Kit 2.49.4, Svelte 5.46.3, Vite 7.3.2 — the versions the plan expected.
- **Ported** Meteo's own code as is with imports repointed to `$lib`, rewrote the glue (three endpoints without the `/meteo` prefix, no `notify-rain-stopped`, no navigation, asset and manifest paths at the app root), replaced the `node-notifier` desktop notification with a browser notification, and added a minimal service worker for Chrome for Android. Details in the handoff's State section.
- **Built the deployment files**: multi-stage `Dockerfile`, `.dockerignore`, pnpm pinned to `10.28.1` in both `packageManager` and `corepack prepare` (the runbook `docs/development/runbooks/dokploy-pnpm-lockfile-config-mismatch.md` exists precisely because `pnpm@latest` resolves at build time).
- **Wrote** the new repo's `README.md` (from the bench doc, updated) and `AGENTS.md`.
- **Added `[meteo]` to `~/dev/projects.toml`** with `domain = ["tools"]`, then `dev-views check` (93 entries ok) and `dev-views build` (573 links).

Checks that passed: `pnpm check` (0 errors, 0 warnings), `pnpm lint`, `pnpm build`, `pnpm install --frozen-lockfile`, and the plan's `rg` check for leftover wyts-platform references (only provenance comments match).

## Decisions the user took

- **Repo visibility:** public, with "beware of credentials". Audited before pushing: no `.env` on disk or in history, no key/token/password/bearer matches outside the Météo-France token _variable names_.
- **The deployment detail in a public repo:** flagged, and the user chose to strip it from `README.md` and keep it in `AGENTS.md` only (`c47f1a1`). Said plainly to them, and worth repeating: `AGENTS.md` is in the same public repo, and `36c869c` was already pushed with the detail in the README, so this lowered its visibility without removing it from the public record. The remaining question — rewrite the history and force-push, while the repo is still four commits old — is open in the handoff.
- **`domain` facet:** `["tools"]`.
- **Agent docs in the new repo:** yes, an `AGENTS.md`; its content was left to the agent.
- **The UI kit:** copy `Button`, `Checkbox`, `Label` and `cn` from wyts-platform rather than generate them, after the CLI turned out to be unusable non-interactively (see below). This is a deliberate departure from the plan's STOCK-WITH-PALETTE wording, and it is also the only option that keeps parity: the page uses `size="icon-sm"` and wyts's customized `outline` variant.
- **The previous session's uncommitted files:** commit them as that session's closing state.

## Tried and failed

- **`shadcn-svelte init` non-interactively**, five attempts across versions 1.1.0, 1.6.1 and 1.7.1: a stale dlx cache, a 404 on the removed `slate` base color, a registry/CLI schema mismatch on `cssVarsTemplate`, then a mandatory design-system `--preset` whose IDs are opaque codes (`--preset vega` is rejected even though "Vega" is the list's name for the classic shadcn look). Written up in [.agents/docs/shadcn-svelte/cli-registry-drift.md](../../../docs/shadcn-svelte/cli-registry-drift.md).
- **Driving those prompts through a pty** (`script` + timed keystrokes, with `stty cols 180` — without it the pty is one column wide and the capture is one character per line). It did reach the preset list, which is how the preset names above were read, but the user stopped the run: blind-Entering through a list of design systems is not a way to configure an app. That was the right call.
- **Building the `Dockerfile`**: the Docker CLI is present in the agent sandbox (29.9.2) but `/var/run/docker.sock` is not, so the image was never built. The first Dokploy deploy will be its first build.

## Notes for next time

- `docs/wyts-framework/pwa.md` states the benches install **without** a service worker. The service worker added to `_/meteo` is for notifications on Chrome for Android only, not for installability, and it deliberately has no fetch handler so it can never serve stale code.
- The notification-permission request is tied to the birds checkbox turning on, guarded by a `hydrated` flag: without it, restoring the checkbox from `localStorage` would ask for permission outside a user gesture.

## Files created or updated outside the new repo

- `docs/wyts-framework/benches/meteo.md`, `.specs/prompts/plans/2026-10-26_meteo-bench-extraction-{decisions,plan}.md` — committed as `b416a2cd` (previous session's work).
- `.specs/prompts/plans/2026-10-26_meteo-bench-extraction-plan.md` — marked superseded by this handoff.
- `.agents/handoffs/meteo-bench-extraction/handoff.md` — created.
- `.agents/docs/shadcn-svelte/cli-registry-drift.md` — created.
- `AGENTS.md` — handoff pointer added.
- `~/dev/projects.toml` — `[meteo]` entry (not a git repository).

## History rewrite of the new repo

On the user's instruction, the deployment detail was taken out of the public `README.md` and the history rewritten so no commit reachable from `main` carries it there. Done as `git reset --soft 583ae1a` followed by one commit, so the port commit `297d0ac` holds exactly the tree that `c47f1a1` had — verified by comparing `HEAD^{tree}` before and after — then `git push --force-with-lease`. The pre-rewrite tip is kept locally as `backup/pre-readme-scrub`.

What this does not do, and was reported as such: GitHub still serves the orphaned `36c869c` by SHA (`gh api repos/vibl/meteo/commits/36c869c` resolves after the force-push). A force-push makes a commit unreachable, not unreadable. Deleting and recreating the repository, or asking GitHub Support to garbage-collect, is the only certain removal.
