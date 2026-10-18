# STATUS

Updated: 2026-10-18 by Claude (end of session 2 — handoff; M0 closed; Task 1.1a in PR #9, awaiting manual test)

> This file is updated on the task branch. Until PR #9 is merged, `develop` still holds the Task 0.6 version:
> start a new session from `feat/m1-role-host-routing` (or after the merge, from `develop`).

## Current position
- Milestone: M1 — Deployment chain (Essai 1). M0 is complete (database parts deferred by ADR-005).
- Task: 1.1a — Role and host routing (first half of Task 1.1, split approved) — state: **implemented, waiting for the
  supervisor's manual test**
- Branch / PR: `feat/m1-role-host-routing` → `develop`, PR #9 (CI green: `checks`, `secret-scan`, SonarCloud).

## Last completed tasks
- 0.1 — Verify versions and record foundational ADRs — merged 2026-10-18 (PR #1, `efd7107`)
- 0.2 — Monorepo scaffold — merged 2026-10-18 (PR #3, `38fefa5`)
- 0.3 — Local infrastructure & environment validation — merged 2026-10-18 (PR #4, `c2699cd`)
- 0.4 — Error, logging & request-context foundation — merged 2026-10-18 (PR #5, `c15a88c`)
- 0.5 — Testing foundation — merged 2026-10-18 (PR #7, `10c2379`), manual test passed
- 0.6 — CI pipeline — merged 2026-10-18 (PR #8, `60e3ad9`), manual test passed (M0 closed)

## What exists now (so a new session does not have to rediscover it)
- pnpm 11 workspace + Turborepo: `apps/web` (Next.js 16.3.8, App Router, `src/`), `packages/config`
  (tsconfig/ESLint/Prettier presets), `packages/design-system` (placeholder: `BRANDS`, `isBrand`).
- `apps/web/src/lib/`: `env.ts` (Zod, `getEnv()`; vars `DEPLOY_ENV`, `LOG_LEVEL`, `APP_ROLE`, `SITE`), `errors.ts` (`AppError`,
  `normalizeError`, `toErrorResponse`), `logger.ts` (pino, `getLogger()`), `redaction.ts`, `console-scrubbing.ts`,
  `request-id.ts`, `request-context.ts` (`getRequestId()`, `getRequestLogger()`), `http/route-handler.ts` (`withErrorHandling`).
- `apps/web/src/modules/core/` (public interface `index.ts`): host allowlist per `DEPLOY_ENV` and `resolveHost()`;
  `routing/route-rules.ts`: `roleFromEnv()`, `resolveRoute()` (role layer: which hosts; host-kind layer: which paths).
- `apps/web/src/proxy.ts`: request ID per request + plain-text 404 whenever `resolveRoute()` refuses (`/api/health` exempt).
- `apps/web/src/instrumentation{,.node}.ts`: env check at startup (exit 1 if invalid), console scrubbing, `onRequestError` logging.
- Routes: `/` (temporary tenant page), `/api/health`, `/api/ready`, local-only `/api/dev/test-error` and `/dev/test-error`;
  `error.tsx`, `global-error.tsx`, `not-found.tsx` (French).
- Tests (Task 0.5): Vitest 4.1.12 projects in `apps/web/vitest.config.ts`: `unit` (`src/**/*.test.ts`,
  `tests/factories/**/*.test.ts`) and `integration` (`tests/integration/`, one placeholder until ADR-005); 153 tests.
  Env for tests: `DEPLOY_ENV=local`, `LOG_LEVEL=fatal`. Scripts in `apps/web`: `test:unit`, `test:integration`.
- E2E: Playwright 1.64.1, Chromium headless shell only, `apps/web/playwright.config.ts`, `tests/e2e/*.spec.ts` (11 tests).
  Runs `next start --port 3100` (`DEPLOY_ENV=local`); Turbo `e2e` depends on `build`. Report + traces on failure.
- Test data: `apps/web/tests/factories/person.ts` (`buildPerson`), emails restricted to `example.test` / `example.com`.
- `infra/local/compose.yaml`: Mailpit v1.31.6 only (no database, ADR-005).
- CI (Task 0.6): `.github/workflows/ci.yml`, jobs `checks` (install, format, typecheck, lint, test, build, e2e) and
  `secret-scan` (gitleaks v8.30.1 Docker image, full history). Actions pinned by commit SHA (ADR-018 "CI tooling").
  Repository settings to apply by hand: `docs/runbooks/github-repository-settings.md`.
  A third check, **SonarCloud Code Analysis**, also runs on PRs: it comes from a GitHub App on the repository,
  not from this repo's files (not set up by the agent; confirm with the supervisor before relying on it).

## Decisions since last milestone
- ADR-001…ADR-017 recorded from `docs/ai/01_ARCHITECTURE.md` §3 (see `docs/decisions/README.md`).
- ADR-005 — Database is a **placeholder** (supervisor, 2026-10-18): implement last or when a concrete DB is given.
- ADR-018 — Pinned versions, accepted. Exact pins (no `^`). Notable: ESLint 9.39.5 (not 10: Next's bundled plugins stop at 9);
  pino 9.14.0 (the version Payload 3.91.0 pins); Zod 4.6.7; Vitest 4.1.12; Mailpit v1.31.6.
- ADR-019 — TypeScript strictness (proposed): `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`; re-check in Task 3.1.
- Task 0.3: minimal Vitest brought forward from Task 0.5 (supervisor-approved).
- Task 0.5: Chromium headless shell download approved (supervisor, 2026-10-18); placeholder integration test requested.
- Task 0.6: gitleaks runs from its official Docker image (pinned by digest), not `gitleaks-action`. No `.gitleaks.toml`:
  the full history scan found nothing. Turbo strict env mode was checked: `CI` reaches Playwright.
- Task 1.1 split into 1.1a (role/host routing, code) and 1.1b (Dockerfile, worker entry, compose override, CI image build);
  supervisor-approved 2026-10-18 with decisions D1–D4:
  D1 `APP_ROLE` unset = serve every role, allowed only with `DEPLOY_ENV=local` (startup exits otherwise);
  D2 deny by default: `web` serves only its `SITE` host, no `/admin`, `/api` only `/api/ready` (+ `/api/dev/*` locally);
     `cms` serves admin + hooks hosts, hooks host only `/api/webhooks/*`; path rules apply per host kind in every role;
  D3 base image `node:24.22.0-trixie-slim` pinned by digest (1.1b); D4 `esbuild@0.28.2` devDependency bundles the worker (1.1b).
- Route rules match a canonical path (percent-decoded, lowercased, repeated slashes collapsed); malformed encoding and
  `.`/`..` segments are refused.
- Host allowlist: `www.*` and bare `localhost` are refused (404) by the app; Caddy redirects `www` (Task 1.4).
  Only the `Host` header is used, never `X-Forwarded-Host`.
- Invalid environment → the server prints the problems and **exits with code 1** (Next.js alone would keep listening).
- `/api/health` bypasses the host and role rules (Docker healthcheck uses Host: localhost); nothing else does.
  The request ID is always generated by the proxy (client value overwritten).
- Secrets are scrubbed from log keys, free-text messages, error messages/stacks and Next.js's own `console.error` output.
- `apps/web/AGENTS.md` and `apps/web/CLAUDE.md`, regenerated by `next dev`, stay git-ignored (supervisor decision).
- GitHub default branch is `develop` (supervisor-approved). `main` received Task 0.1 via PR #2 by mistake; content identical
  to `develop`, left as is, reconciled at the first `develop → main` promotion.
- Source PDFs live in `docs/sources/` and are **out of git** (`.gitignore`): the repository is public.

## Working agreements
- The supervisor may ask the agent to squash-merge a PR after a passed manual test; the agent then verifies the merge,
  syncs `develop` and deletes the branch (local + remote). Otherwise the supervisor merges.
- PR titles become the squash commit subject: use conventional commits with the task number.
- Each task is verified from a **fresh clone** with `pnpm install --frozen-lockfile` before the PR is opened.
  **Delete the clone right after** (disk space is tight, see below); never leave clones in the scratchpad.

## Deferred because of the database placeholder (ADR-005)
- Task 0.3: no Postgres container in `infra/local/compose.yaml`. Done that way.
- Task 0.4: `/api/ready` reports `database: "not_configured"`; the "stop the DB, ready fails" manual step waits for the DB.
- Task 0.5: no database-backed integration tests yet (placeholder `tests/integration/environment.test.ts`).
- Task 0.6: CI without a Postgres service container and without a migration check. Docker image build comes in Task 1.1b.
- Revisit before M3: Payload cannot start without a database adapter.

## Open issues / risks
- **Before M3 (Task 3.1):** concrete database needed, or an approved temporary adapter (e.g. SQLite) via a new ADR.
- Recette host map is empty until the recette domain is bought (ADR-017, Task 1.4).
- Node 26 becomes LTS on 2026-10-28; we stay on 24 until Payload builds with 26 (ADR-018).
- First `pnpm lint` after a fresh install can take minutes on Windows (antivirus); later runs ~25 s. Watch it in CI.
- Free-text scrubbing is best-effort (patterns); the rule stays "structured fields, never interpolate personal data".
- Client-side-only errors are not reported to the server yet (Sentry, Task 1.6).
- **Disk space on the supervisor's machine is tight** (about 5 GB free on 2026-10-18). This project's own footprint is
  ~2.5 GB (repo incl. `node_modules`/`.next`/`.turbo` ~1.1 GB, pnpm store ~0.6 GB, Playwright shell ~0.3 GB, Docker
  images ~0.15 GB). Task 1.1b builds Docker images: prune the build cache after testing (`docker builder prune`
  removes all unused build cache, including other projects': ask first), and never keep more than one local image tag.

## Waiting on human / PO
- Supervisor: manual test of Task 1.1a.
- Supervisor: confirm the repository settings runbook was applied (`docs/runbooks/github-repository-settings.md`).
- Supervisor: concrete database choice (ADR-005), at the latest before M3.
- Supervisor: confirm ADR-019.
- PO items listed in `docs/ai/01_ARCHITECTURE.md` §17 (recette domain, shared accounts, brand files, …).

## Supervisor's machine (Windows 11) — notes for the agent
- Node.js 24.20.0 (winget), pnpm 11.28.6 via Corepack (`corepack enable pnpm` was run as admin), GitHub CLI 2.102.0
  (logged in as `akramnemri`), Docker Desktop (may need to be started).
- In the agent's Git Bash, prepend `/c/Program Files/nodejs` and `/c/Program Files/GitHub CLI` to `PATH`
  (the shell may predate these installs), and set `COREPACK_ENABLE_DOWNLOAD_PROMPT=0`.
- Installed for this project outside the repo: Chrome Headless Shell 156 (`%LOCALAPPDATA%\ms-playwright\chromium_headless_shell-1248`),
  gitleaks image `ghcr.io/gitleaks/gitleaks:v8.30.1`. Docker Desktop also runs other projects' containers (Kubernetes,
  Elasticsearch/Kibana, MySQL): never stop, prune or remove anything that is not this project's.
- Large `docker`/Windows disk checks are slow here (antivirus): scan targeted folders, not the whole drive.

## Next step (exact)
1. Supervisor tests Task 1.1a manually (steps in the PR / task report).
2. After merge: sync `develop`, delete `feat/m1-role-host-routing` (§4b).
3. Then Task 1.1b — `apps/web/Dockerfile` (multi-stage, standalone output with `outputFileTracingRoot`, non-root,
   healthcheck script per role), entrypoint by `APP_ROLE`, `src/jobs/worker.ts` placeholder bundled by esbuild,
   `infra/local/compose.roles.yaml` (web-upwilling :3001, cms :3002, worker), CI `docker` job (build + smoke),
   ADR-018 rows (image digest, esbuild). Post the plan first; do not start unasked.
