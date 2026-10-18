# STATUS

Updated: 2026-10-18 by Claude (session 1, Task 0.1)

## Current position
- Milestone: M0 — Repository & tooling foundation
- Task: 0.1 — Verify versions and record foundational ADRs — state: awaiting manual test
- Branch / PR: `chore/m0-adrs-versions` — PR to `develop` not opened by the agent (`gh` CLI not installed); supervisor opens it

## Last completed tasks
- none yet

## Decisions since last milestone
- ADR-001…ADR-017 recorded from `docs/ai/01_ARCHITECTURE.md` §3 (see `docs/decisions/README.md`).
- ADR-005 — Database is a **placeholder** (supervisor, 2026-10-18): implement last or when a concrete DB is given.
- ADR-018 — Pinned versions (proposed): Node 24 LTS, pnpm 11.28.6, Turborepo 2.11.9, Payload 3.91.0,
  Next.js 16.3.8, React 19.2.9, TypeScript 5.9.3, Tailwind 4.3.3, Vitest 4.1.12, Playwright 1.64.1,
  Storybook 10.6.2, Zod 4.6.7. Database not pinned.
- Source PDFs moved to `docs/sources/` and kept **out of git** (`.gitignore`): the repository is public.

## Deferred because of the database placeholder (ADR-005)
- Task 0.3: no Postgres container in `infra/local/compose.yaml` (Mailpit only).
- Task 0.4: `/api/ready` checks configuration only; database check added later.
- Task 0.5: unit tests only; database-backed integration tests added later.
- Task 0.6: CI without a Postgres service container.
- Revisit before M3: Payload cannot start without a database adapter.

## Open issues / risks
- **Before M3 (Task 3.1):** concrete database needed, or an approved temporary adapter (e.g. SQLite) via a new ADR.
- Node 26 becomes LTS on 2026-10-28; we stay on 24 until Payload builds with 26 (ADR-018).
- `pnpm` and `gh` are not installed on the agent's machine. `pnpm` is needed from Task 0.2
  (installable through Corepack with Node 22+, or `npm i -g pnpm@11.28.6`).

## Waiting on human / PO
- Supervisor: review ADR-001…018 and the version table; confirm or correct ADR-018.
- Supervisor: concrete database choice (ADR-005), at the latest before M3.
- PO items listed in `docs/ai/01_ARCHITECTURE.md` §17 (recette domain, shared accounts, brand files, …).

## Next step (exact)
- After the supervisor's approval and merge of Task 0.1: plan Task 0.2 — Monorepo scaffold
  (pnpm workspace + Turborepo, `apps/web` plain Next.js, `packages/config`, `packages/design-system`, root scripts, README).
