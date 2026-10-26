# STATUS

Updated: 2026-10-26 by Claude (session 4 — Tasks 1.3–1.5b merged; recette runs on the laptop via the deploy agent;
Task 1.5c implemented, PR open; its live start waits for the supervisor's Tailscale console steps)

> This file is updated on the task branch. Until the 1.5c PR is merged, `develop` is behind: start a new session
> from `feat/m1-funnel` (or after the merge, from `develop`).

## Handoff for the next session (read first)
- **Hosting for the test phase** (supervisor, 2026-10-20): the domain and the server are not ready, so the
  **supervisor's laptop is the server**, and public access must be free with no bank card. Pull-based deploys
  (ADR-024, accepted); public access through Tailscale Funnel (ADR-025, proposed, Task 1.5c).
- **Recette runs on the laptop** since 2026-10-26: `C:\upwilling-server\agent` (deploy agent, `DEPLOY_STACKS=recette`
  by default) deployed `93903a4` automatically; `C:\upwilling-server\recette\.env` holds the generated database
  password (never displayed). Set up by the agent at the supervisor's request: agreed exception, ADR-025.
- **Task 1.5c** files are written and tested; `C:\upwilling-server\funnel\` is prepared (copies of the files, `.env`
  with `TS_AUTHKEY=` empty and the recette login, password generated and never displayed). Waiting for the
  supervisor: Tailscale console steps (runbook `local-server.md` §9a), then the key pasted into `funnel\.env`.
- **Tailscale secrets:** never ask for a key in the chat; the supervisor writes it into `.env` (an earlier key
  pasted in the chat was revoked, 2026-10-20).
- Oracle Cloud (ADR-021) and the Cloudflare setup (ADR-023) stay the plan once a card / the domain are available.

## Current position
- Milestone: M1 — Deployment chain (Essai 1). M0 is complete.
- Task: 1.5c — Public access to recette through Tailscale Funnel — state: **implemented, waiting for the supervisor's
  review and the live start**. `infra/server/compose.funnel.yaml` (ingress Caddy + 3 Tailscale devices),
  `caddy/Caddyfile.funnel` (port per site, Host rewrite to the ADR-022 recette hosts, basic auth except
  `/api/version`, headers), `tailscale/serve-*.json`, `.env.funnel.example`; `promote.yml` polls
  `vars.RECETTE_PUBLIC_URL` after a recette promotion (warning only). Test: `infra/server/test/smoke-funnel.sh`
  (also in CI). Also fixed for both Caddyfiles: security headers were missing on Caddy's own 401 page.
- 1.5b manual test: passed 2026-10-26 (agent started on the laptop, recette deployed and checked).
- GitHub environments (checked 2026-10-26): `production` has the supervisor as required reviewer; the supervisor
  said the branch rules were fixed afterwards (not re-checked).
- Branch / PR: `feat/m1-funnel` → `develop`.

## Last completed tasks
- 0.1 — Verify versions and record foundational ADRs — merged 2026-10-18 (PR #1, `efd7107`)
- 0.2 — Monorepo scaffold — merged 2026-10-18 (PR #3, `38fefa5`)
- 0.3 — Local infrastructure & environment validation — merged 2026-10-18 (PR #4, `c2699cd`)
- 0.4 — Error, logging & request-context foundation — merged 2026-10-18 (PR #5, `c15a88c`)
- 0.5 — Testing foundation — merged 2026-10-18 (PR #7, `10c2379`), manual test passed
- 0.6 — CI pipeline — merged 2026-10-18 (PR #8, `60e3ad9`), manual test passed (M0 closed)
- 1.1a — Role and host routing — merged 2026-10-19 (PR #9, `58acca2`), manual test waived by the supervisor
- 1.1b — Docker image with container roles — merged 2026-10-19 (PR #10, `29fa6df`), manual test waived
- 1.2 — Branded "under construction" pages — merged 2026-10-20 (PR #11, `7745d4d`) at the supervisor's request,
  manual test (phone width, Lighthouse) not reported; PO inputs still open (contact emails, academy logo, copy)
- 1.3 — Server provisioning runbook & scripts — merged 2026-10-20 (PR #12, `b04c200`), manual test waived, real run
  deferred (no server). Merged despite SonarCloud's `docker:S6471` at the supervisor's request ("merge").
- 1.4 — Compose projects & Caddy — merged 2026-10-20 (PR #13, `2c4cc44`), manual test waived (no server).
  Supervisor decisions: PostgreSQL confirmed (ADR-005), separate edge project, basic auth on recette-admin, ADR-023 accepted.
- 1.5a — Image publishing to GHCR, `GET /api/version` — merged 2026-10-20 (PR #14), reviewed by the supervisor;
  publish verified 2026-10-20: CI on develop green, package made public by the supervisor, `imagetools inspect`
  shows linux/amd64 + linux/arm64 anonymously, and the pulled image reports its commit on `/api/version`.
- 1.5b — Pull-based deploys (promote/rollback workflows, deploy agent) — merged 2026-10-26 (PR #15), reviewed by
  the supervisor, ADR-024 accepted; manual test passed 2026-10-26 (agent set up by the agent at the supervisor's
  request, recette deployed `93903a4` automatically, version and readiness checked).

## What exists now (so a new session does not have to rediscover it)
- pnpm 11 workspace + Turborepo: `apps/web` (Next.js 16.3.8, App Router, `src/`), `packages/config`
  (tsconfig/ESLint/Prettier presets), `packages/design-system` (`BRANDS`, `isBrand`, `contrastRatio`, and the
  TEMPORARY theme `temporary-brand-theme.ts`: color roles per brand + small scale as `--uw-*` variables, injected by
  the root layout as a `<style>`; replaced by the token pipeline in Task 2.1). Asset rights: `assets/LICENSES.md`.
- `apps/web/src/modules/content/` (Task 1.2): `UNDER_CONSTRUCTION` per tenant (French copy, logo, icons, OG image,
  `contactEmail: null` until the PO gives it), `UnderConstructionPage`, `buildSiteMetadata()` (title, description,
  icons, Open Graph, robots), `isIndexable()` = production **and** site host only. The proxy adds
  `X-Robots-Tag: noindex, nofollow` to every other response (Next 16 may stream the robots meta tag into `<body>`).
  Brand files: `apps/web/public/brands/<brand>/` (copied into the image).
- `apps/web/src/lib/`: `env.ts` (Zod, `getEnv()`; vars `DEPLOY_ENV`, `LOG_LEVEL`, `APP_ROLE`, `SITE`), `errors.ts` (`AppError`,
  `normalizeError`, `toErrorResponse`), `logger.ts` (pino, `getLogger()`), `redaction.ts`, `console-scrubbing.ts`,
  `request-id.ts`, `request-context.ts` (`getRequestId()`, `getRequestLogger()`), `http/route-handler.ts` (`withErrorHandling`).
- `apps/web/src/modules/core/` (public interface `index.ts`): host allowlist per `DEPLOY_ENV` and `resolveHost()`;
  `routing/route-rules.ts`: `roleFromEnv()`, `resolveRoute()` (role layer: which hosts; host-kind layer: which paths).
- `apps/web/src/proxy.ts`: request ID per request + plain-text 404 whenever `resolveRoute()` refuses (`/api/health` exempt).
- `apps/web/src/instrumentation{,.node}.ts`: env check at startup (exit 1 if invalid), console scrubbing, `onRequestError` logging.
- Routes: `/` (brand page per site, simple page on the admin host), `/api/health`, `/api/ready`, `/api/version`
  (commit baked into the image as `APP_VERSION`, "local" otherwise; public on site hosts, Task 1.5a),
  local-only `/api/dev/test-error` and `/dev/test-error`;
  `error.tsx`, `global-error.tsx`, `not-found.tsx` (French).
- Tests (Task 0.5): Vitest 4.1.12 projects in `apps/web/vitest.config.ts`: `unit` (`src/**/*.test.ts`,
  `tests/factories/**/*.test.ts`) and `integration` (`tests/integration/`, one placeholder until ADR-005); 200 tests.
  Env for tests: `DEPLOY_ENV=local`, `LOG_LEVEL=fatal`. Scripts in `apps/web`: `test:unit`, `test:integration`.
- E2E: Playwright 1.64.1, Chromium headless shell only, `apps/web/playwright.config.ts`, `tests/e2e/*.spec.ts` (19 tests).
  Runs `next start --port 3100` (`DEPLOY_ENV=local`); Turbo `e2e` depends on `build`. Report + traces on failure.
- Test data: `apps/web/tests/factories/person.ts` (`buildPerson`), emails restricted to `example.test` / `example.com`.
- `infra/local/compose.yaml`: Mailpit v1.31.6 only (no database, ADR-005).
- Docker (Task 1.1b): `apps/web/Dockerfile` (build context = repo root, `.dockerignore`), base
  `node:24.22.0-trixie-slim` pinned by digest; Next.js `output: "standalone"` with `outputFileTracingRoot` = repo root.
  Runtime: user `node`, app files owned by root, `HEALTHCHECK` → `dist/healthcheck.cjs`, entrypoint
  `apps/web/docker/entrypoint.sh` (`APP_ROLE=worker` → `dist/worker.cjs`, else `server.js`). `ENV HOSTNAME=0.0.0.0`
  is required (Docker sets HOSTNAME to the container ID). Image ~400 MB as listed by Docker Desktop, app 49 MB.
- `pnpm build` in `apps/web` = `next build` + `scripts/bundle-entries.mjs` (esbuild → `dist/worker.cjs`,
  `dist/healthcheck.cjs`, CommonJS because pino calls `require()`).
- Worker placeholder: `src/jobs/worker.ts` (entry) + `worker-loop.ts` (`runWorkerLoop`, abortable); heartbeat file in
  `/tmp` every 10 s; SIGTERM → finishes the iteration, logs `worker stopped`, exit 0. Liveness logic:
  `src/lib/container-health.ts` (`checkContainerHealth`: HTTP `/api/health` for web/cms, heartbeat ≤ 60 s for worker).
- `infra/local/compose.roles.yaml` (project `upwilling-roles`): web-upwilling :3001, cms :3002, worker; `init`,
  `read_only` + tmpfs, memory limits, log rotation. `infra/local/smoke-roles.sh`: 29 checks, used locally and in CI.
  Runbook: `docs/runbooks/local-container-roles.md`. Measured idle RAM: web ~52 MiB, cms ~52 MiB, worker ~26 MiB.
- Server (Task 1.3): `infra/server/scripts/provision.sh` (idempotent steps, `--dry-run`, `--only`; SSH step last,
  with lockout guards), `verify.sh` (read-only PASS/WARN/FAIL + versions), `lib.sh`. Tested by
  `infra/server/test/test-in-container.sh` (privileged systemd container, Ubuntu 26.04 and 24.04, `--oci` mode with an
  Oracle-style `rules.v4` fixture; swap/time skipped; checks container egress through Oracle's FORWARD REJECT).
  Runbooks: `docs/runbooks/server-setup.md`, `docs/runbooks/cloudflare-dns.md`. Decisions: ADR-020.
  `/srv/upwilling-edge` added to the layout in Task 1.4.
- Server stacks (Task 1.4, ADR-023): `infra/server/compose.edge.yaml` (project `upwilling-edge`: Caddy 2.11.7, the only
  published port, 443 → 8443 inside, runs as the deploy uid, read-only; owns the internal networks
  `upwilling-edge-prod` / `upwilling-edge-recette`), `compose.base.yaml` (shared `app` and `postgres` definitions,
  used through `extends`), `compose.production.yaml` (`upwilling-prod`) and `compose.recette.yaml`
  (`upwilling-recette`): web-upwilling, web-careerboost, cms, worker, postgres 18.6 (uid 999, read-only, volume
  `/var/lib/postgresql`, database `app`). Web/cms join the edge network with aliases `prod-*` / `recette-*`.
  `infra/server/caddy/Caddyfile`: host routing (§5.2 + ADR-022 recette hosts), Cloudflare origin certificate +
  Authenticated Origin Pulls (client certificate required), strict SNI, security headers (no HSTS yet), basic auth on
  recette (not on `recette-hooks`), webhook-only hooks hosts, `www` → apex, catch-all 404, Cloudflare `trusted_proxies`.
  Env templates: `infra/server/.env.{edge,production,recette}.example`. Runbook: `docs/runbooks/compose-stacks.md`.
  Test: `infra/server/test/smoke-stacks.sh` (test project names, throwaway certificates in the git-ignored
  `infra/server/test/.work/`, requests from a `curlimages/curl` container). Measured idle RAM with the 1.4 image:
  web ~55–61 MiB, cms ~56–59 MiB, worker ~23 MiB, postgres ~39 MiB, caddy ~14 MiB.
- Deploys (Task 1.5b, ADR-024): `.github/workflows/promote.yml` (reusable: checks the commit's image exists, moves
  `ghcr.io/akramnemri/upwilling-web:<stack>` to it, in the GitHub environment named after the stack), called by
  `ci.yml` jobs `deploy-recette`/`deploy-production` and by `rollback.yml` (manual). Deploy agent:
  `infra/server/compose.deploy-agent.yaml` (`docker:29.9.1-cli`, Docker socket, read-only, state volume) +
  `deploy-agent/agent.sh` (POSIX sh; per stack: pull tag → revision label + digest → compose files from
  raw.githubusercontent.com at that commit → `up --wait` → `/api/ready` + `/api/version` checks → restore previous
  release on failure, remember the failed commit; keeps 2 releases). Edge networks are now `external` in every
  project (names overridable for tests), created by the agent / runbook. Runbook: `docs/runbooks/local-server.md`.
- CI: `.github/workflows/ci.yml`, jobs `checks` (install, format, typecheck, lint, test, build, e2e),
  `secret-scan` (gitleaks v8.30.1 Docker image, full history), `docker` (image build + `smoke-roles.sh` + `smoke-stacks.sh`, Tasks 1.1b/1.4),
  `shellcheck` (v0.11.0 image, every `*.sh`, Task 1.3), `image` (PRs: amd64 + arm64 native builds, `/api/version`
  check), `publish` + `publish-manifest` (pushes to develop/main, after every other job: GHCR, Task 1.5a),
  `deploy-recette` / `deploy-production` (Task 1.5b). The docker job also runs `smoke-deploy.sh`.
  Actions and images pinned (ADR-018 "CI tooling"). The docker job bakes the commit in (`APP_VERSION`).
  Repository settings to apply by hand: `docs/runbooks/github-repository-settings.md`.
  A third check, **SonarCloud Code Analysis**, also runs on PRs: it comes from a GitHub App on the repository,
  not from this repo's files (not set up by the agent; confirm with the supervisor before relying on it).

## Decisions since last milestone
- ADR-001…ADR-017 recorded from `docs/ai/01_ARCHITECTURE.md` §3 (see `docs/decisions/README.md`).
- ADR-005 — Database: **PostgreSQL, accepted** (supervisor, 2026-10-20; placeholder since 2026-10-18). Major 18
  (`postgres:18.6-trixie`); Payload compatibility with 18 is verified in Task 3.1 (fallback 17 before real data).
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
- Task 1.1b: PR stacked on PR #9 (supervisor, 2026-10-19). E2E keeps `next start` (Next warns it "does not work"
  with standalone, but it does in 16.3.8): the standalone server cannot run natively on Windows (EPERM on pnpm
  symlinks), so the image is tested by the Docker smoke test instead. Next.js exits 143 after a graceful SIGTERM
  drain: expected, asserted by the smoke test.
- Task 1.2: brand colors kept at the 04 §2 values (the Career Boost logo sent 2026-10-19 matches them within ±8 per
  channel). Text green is `#2E7D34` (raw `#389840` is 3.7:1 on white). Contrast test lives in `apps/web` until the
  design-system package gets its own tests (Task 2.1). No dependency added. Contact details are never taken from
  personal profiles (the supervisor suggested LinkedIn; declined, CLAUDE.md personal-data rule).
- Task 1.3 (ADR-020, proposed): Ubuntu 26.04 LTS (24.04 accepted); users `<admin>` (key + password, sudo) and
  `deploy` (key, docker group, no sudo); SSH keys only, no root; ufw 22/80/443 and **only Caddy publishes ports**
  (Docker bypasses ufw; `verify.sh` fails on other public ports); fail2ban sshd; security updates daily, no auto
  reboot; Docker from its apt repo (key fingerprint checked), `daemon.json` log caps + `live-restore` +
  `no-new-privileges`; 2 GB swap; UTC; journal 500 MB. Deploy key restriction is due in Task 1.5.
- ADR-021 (accepted, test phase only): Oracle Cloud Always Free `VM.Standard.A1.Flex` 2 OCPU / 12 GB, EU home
  region, Ubuntu 26.04 aarch64. VCN security list = outer firewall (22/80/443); never ufw on Oracle images.
  Synthetic data only; move to a paid EU VPS **before accepting traffic**. The app image must be built for
  linux/arm64 (Task 1.5). Risk: idle reclamation (7 days < 20% CPU, network, memory) → upgrade to Pay As You Go.
- ADR-022 (accepted, test phase only): recette on first-level hosts of upwilling.fr (`recette`, `recette-careerboost`,
  `recette-admin`, `recette-hooks`, later `recette-stats`), host-only cookies only, no real users; hard switch to a
  separate recette domain before accepting traffic. Task 1.4 added these hosts (not `recette-stats`, which goes to
  Umami) to the `recette` allowlist and Caddy.
- ADR-023 (accepted 2026-10-20, Task 1.4): Cloudflare origin certificate + zone-level Authenticated Origin Pulls with our own
  CA (origin only reachable through Cloudflare, so Access cannot be bypassed); Caddy publishes 443 only (no port 80,
  no HTTP/3); separate edge compose project (supervisor-approved 2026-10-20); basic auth on every recette host
  except hooks, standing in for Cloudflare Access on `recette-admin` (supervisor, 2026-10-20). HSTS waits for launch.
- ADR-024 (accepted 2026-10-26, Task 1.5b): pull-based deploys. CI publishes, the
  promote workflow moves the stack's image tag (production behind the `production` environment's approval), the
  deploy agent on the server pulls and deploys by digest. Amends the SSH deploy of 03 §12. Kept for the VPS later
  unless a reason appears (no inbound SSH, no deploy key in GitHub).
- ADR-025 (proposed, Task 1.5c): test-phase public access to recette through Tailscale Funnel (3 tagged devices →
  local ingress Caddy with Host rewrite to the ADR-022 hosts + basic auth); removed when the domain/server exist.
  Also records the agreed exception: the agent may run setup steps on the supervisor's laptop when asked, never on
  a real server, never entering a secret the human holds.
- Database: Oracle Database 11g (mentioned 2026-10-20) is not usable; PostgreSQL was confirmed instead.
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

## Deferred database work (PostgreSQL now confirmed, ADR-005) — picked up in Task 3.1
- Task 0.3: no Postgres container in `infra/local/compose.yaml` yet.
- Task 0.4: `/api/ready` reports `database: "not_configured"`; the "stop the DB, ready fails" manual step waits for the DB.
- Task 0.5: no database-backed integration tests yet (placeholder `tests/integration/environment.test.ts`).
- Task 0.6: CI without a Postgres service container and without a migration check.
- Task 1.4: the server stacks run Postgres with its `postgres` superuser only; the app's own non-superuser role and
  `DATABASE_URL` come with Task 3.1. Backups: Task 1.6.

## Open issues / risks
- Task 3.1: verify Payload against PostgreSQL 18 (ADR-005); fall back to 17 before real data if needed.
- `X-Frame-Options: DENY` from Caddy will block Payload's live preview (admin frames the sites): revisit in M5.
- The server stacks have never run on a real server or on arm64; the first real start is the deferred 1.4 manual step.
- Node 26 becomes LTS on 2026-10-28; we stay on 24 until Payload builds with 26 (ADR-018).
- First `pnpm lint` after a fresh install can take minutes on Windows (antivirus); later runs ~25 s. Watch it in CI.
- Free-text scrubbing is best-effort (patterns); the rule stays "structured fields, never interpolate personal data".
- Client-side-only errors are not reported to the server yet (Sentry, Task 1.6).
- `next start` + standalone prints a warning in e2e; if a later Next.js version really stops supporting it, e2e must
  move to the Docker image or run on Linux only.
- No ISR/data-cache writes exist yet; when they do (M3+), check they stay inside `.next/cache` (tmpfs, read-only image).
- Disk space: the supervisor freed space on 2026-10-19 (~79 GB free). Still keep one local image tag only, and ask
  before `docker builder prune` (it removes other projects' build cache too).

## Waiting on human / PO
- PO: public contact address for each site (organization mailbox, e.g. a `contact@` address); academy logo files
  (SVG, + favicon); vector source of the Career Boost logo; validation of the French copy in
  `apps/web/src/modules/content/under-construction.ts`. **Before go-live** the two `contactEmail: null` must be filled.
- Human (test phase, ADR-021, **blocked: no card for Oracle's verification yet**): create the Oracle Cloud account
  (EU home region, consider Pay As You Go + budget alert), the VCN and the Arm VM (`docs/runbooks/server-setup.md` §11), then run §3–§6 and send the `verify.sh` output. Apply the Cloudflare zone settings
  (`docs/runbooks/cloudflare-dns.md` §1); records come with Tasks 1.4/1.5/5.9/9.5. Confirm or amend ADR-020.
- Supervisor (Task 1.5c): Tailscale console steps (`docs/runbooks/local-server.md` §9a), key into
  `C:\upwilling-server\funnel\.env`; after the first start: remove and revoke the key, tell the agent the tailnet
  name, add `RECETTE_PUBLIC_URL` to the GitHub environment `recette`. Confirm or amend ADR-025. Save the recette
  and database passwords from the `.env` files in the password manager.
- Supervisor: Docker Desktop "Start when you sign in" (`local-server.md` §2).
- Human (when the server exists): Task 1.4's manual step, `docs/runbooks/compose-stacks.md` (origin certificate,
  Authenticated Origin Pulls, `.env` files, start edge + recette, recette DNS records, checks).
- Supervisor (optional): in SonarCloud, mark docker:S6471 on `infra/server/test/Dockerfile` as "Safe"; PR #12 was
  merged without it, so the finding stays open on `develop` until then.
- Supervisor: add the `docker` and `shellcheck` checks to both rulesets (`docs/runbooks/github-repository-settings.md` §3).
- Supervisor: GitHub auto-merge is disabled in the repository settings (an attempt on PR #10 was refused); enable it
  only if you want the agent to use it.
- Supervisor: confirm the repository settings runbook was applied (`docs/runbooks/github-repository-settings.md`).
- Supervisor: confirm ADR-019.
- PO items listed in `docs/ai/01_ARCHITECTURE.md` §17 (shared accounts, brand files, …). Recette domain: postponed
  until accepting traffic (ADR-022).

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
1. Supervisor: Tailscale console steps and the key in `funnel\.env` (runbook §9a–b), then "done" in the chat.
2. Agent: `docker compose -f compose.funnel.yaml up -d --wait` in `C:\upwilling-server\funnel` (agreed exception,
   ADR-025); check the three addresses and `/api/version` once the supervisor gives the tailnet name.
3. Supervisor reviews the 1.5c PR; "merge" → squash, sync `develop`, delete the branch (§4b). Then Task 1.6
   (backups, restore, monitoring; plan first) or the supervisor's choice.
4. When a card is available: human creates the Oracle VM (runbook §11) and runs §3–§6, then
   `docs/runbooks/compose-stacks.md`; the server-dependent steps of 1.4–1.6 resume.
