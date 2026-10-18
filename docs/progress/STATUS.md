# STATUS

Updated: 2026-10-18 by Claude (session 1, Task 0.2)

## Current position
- Milestone: M0 — Repository & tooling foundation
- Task: 0.2 — Monorepo scaffold — state: awaiting manual test
- Branch / PR: `chore/m0-monorepo-scaffold` — PR to `develop` opened by the supervisor (`gh` CLI not installed)

## Last completed tasks
- 0.1 — Verify versions and record foundational ADRs — merged 2026-10-18 (PR #1, `efd7107`)

## Decisions since last milestone
- ADR-001…ADR-017 recorded from `docs/ai/01_ARCHITECTURE.md` §3 (see `docs/decisions/README.md`).
- ADR-005 — Database is a **placeholder** (supervisor, 2026-10-18): implement last or when a concrete DB is given.
- ADR-018 — Pinned versions, accepted. Task 0.2 added: ESLint 9.39.5 (not 10: Next's bundled plugins stop at 9),
  typescript-eslint 8.71.2, Prettier 3.9.10, `@types/*`.
- ADR-019 — TypeScript strictness (proposed): `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`; re-check in Task 3.1.
- pnpm 11 build-script policy: `unrs-resolver` install script explicitly denied (`pnpm-workspace.yaml`).
- Source PDFs live in `docs/sources/` and are **out of git** (`.gitignore`): the repository is public.

## Deferred because of the database placeholder (ADR-005)
- Task 0.3: no Postgres container in `infra/local/compose.yaml` (Mailpit only).
- Task 0.4: `/api/ready` checks configuration only; database check added later.
- Task 0.5: unit tests only; database-backed integration tests added later.
- Task 0.6: CI without a Postgres service container.
- Revisit before M3: Payload cannot start without a database adapter.

## Open issues / risks
- **Before M3 (Task 3.1):** concrete database needed, or an approved temporary adapter (e.g. SQLite) via a new ADR.
- Node 26 becomes LTS on 2026-10-28; we stay on 24 until Payload builds with 26 (ADR-018).
- The first `pnpm lint` on a fresh install took ~5 min on the supervisor's Windows machine (cold cache / antivirus);
  later runs take ~25 s. Watch it in CI (Task 0.6).
- Branch `chore/m0-adrs-versions` (merged) still exists locally and on GitHub: deletion was blocked by the agent's
  permissions; the supervisor deletes it (or enables "Automatically delete head branches").

## Waiting on human / PO
- Supervisor: concrete database choice (ADR-005), at the latest before M3.
- Supervisor: confirm ADR-019.
- PO items listed in `docs/ai/01_ARCHITECTURE.md` §17 (recette domain, shared accounts, brand files, …).

## Machine setup done on 2026-10-18 (supervisor's PC)
- Node.js 24.20.0 LTS installed with winget (replaced 22.13.1); `corepack enable pnpm` run as administrator.

## Next step (exact)
- After the supervisor's approval and merge of Task 0.2: plan Task 0.3 — Local infrastructure & environment validation
  (Mailpit compose, typed env loading with Zod, host → tenant map, temporary tenant page, tests). No Postgres (ADR-005).
