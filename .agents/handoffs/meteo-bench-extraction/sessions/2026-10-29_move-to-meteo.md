# 2026-10-29 — move the handoff and its plan from wyts-platform to meteo

Session opened in `~/dev/_/meteo` with "Move `~/dev/_/wyts-platform/.specs/prompts/plans/2026-10-26_meteo-bench-extraction-plan.md` and related docs here. Follow the global conventions instead of the wyts-platform ones", then clarified as "follow the global handoff conventions". No work on the extraction itself.

## Done

- **Moved to `~/dev/_/meteo/.agents/`**, following the global layout (`.agents/plans/` for dated plans, `.agents/handoffs/<name>/` for the handoff):
  - `.specs/prompts/plans/2026-10-26_meteo-bench-extraction-plan.md` → `.agents/plans/` (same name).
  - `.specs/prompts/plans/2026-10-26_meteo-bench-extraction-decisions.md` → `.agents/plans/` (same name), so the plan's and the decisions log's relative links to each other still work.
  - `.agents/handoffs/meteo-bench-extraction/` → same path in meteo, with its session log.
- **Removed the originals from wyts-platform** and committed that there, staging only those paths.
- **Fixed the links:** the plan's superseded note and the handoff's links to the plan and the decisions log now point inside meteo. The handoff's links to the shadcn-svelte lesson doc point to wyts-platform. The plan and the decisions log each got a note saying they were moved, and that paths without a `~/dev/_/meteo/` prefix are relative to wyts-platform. In the handoff's Next, the wyts-only paths are now prefixed "wyts-platform's".
- **Pointers:** meteo's `AGENTS.md` now carries the single-handoff pointer and links the decisions log locally. wyts-platform's `AGENTS.md` Handoffs paragraph now says there is no handoff there and points to this one, because steps 6 and 7 still run in wyts-platform. wyts-platform's `docs/wyts-framework/benches/meteo.md` status line now points to the decisions log's new location.

## Decisions taken in this session

- **The shadcn-svelte lesson doc stays in wyts-platform** (`.agents/docs/shadcn-svelte/cli-registry-drift.md`): it is written about that repo's `components.json` and its customized components, so that is where it is needed.
- **The 2025-12-01 Windmill plan stays in wyts-platform** (`.specs/prompts/plans/2025-12-01_meteo-bench-from-windmill.md`): it is the history of the bench inside wyts-platform, not of the extraction. Not read.
- **The earlier session log was not edited**, per the handoff rules. Its relative links to `.specs/` and `.agents/docs/` now resolve inside meteo and are broken; they name wyts-platform paths. The handoff's State says so.

## Files changed

- In meteo: `.agents/plans/2026-10-26_meteo-bench-extraction-{plan,decisions}.md` and `.agents/handoffs/meteo-bench-extraction/` (added, with the link fixes above), `AGENTS.md`.
- In wyts-platform: the three originals removed, `AGENTS.md` (Handoffs paragraph), `docs/wyts-framework/benches/meteo.md` (status line).
