# 03 — Git Workflow, Testing Gates, Integration & Deployment

Act as the senior engineer responsible for keeping the repository and the environments stable while development progresses.

Repository: `https://github.com/akramnemri/Upwilling` (**public** — anything committed is visible to everyone).

---

## 1. Branch model

```text
main        production-ready; every commit here can be deployed to production
  ^
develop     integration; every merge here deploys automatically to recette
  ^
feat/<req-id>-<short-name>     one bounded task
fix/<req-id>-<short-name>      bug fix
chore/<short-name>             tooling, config, infra, docs
spike/<essai>-<short-name>     Phase 0 experiments — NEVER merged
```

Examples: `feat/CB-02-membership-checkout`, `feat/AC-06-session-waitlist`, `chore/m1-caddy-recette`, `spike/essai-5-lms`.

Rules:

- Never commit directly to `main` or `develop`.
- Feature branches start from an up-to-date `develop`.
- `spike/*` branches produce a written report in `docs/phase0/` (which IS merged via a small `chore/` PR); the spike code itself is not merged.

## 2. Feature lifecycle

```text
git switch develop && git pull
 -> git switch -c feat/<id>-<name>
 -> implement ONE bounded task
 -> automated quality gate (§6)
 -> update docs/progress/STATUS.md
 -> commit(s), push branch, open PR to develop
 -> TASK REPORT (§14) -> STOP
 -> supervisor tests manually (locally or on the PR's local checkout)
 -> fixes if needed (same branch, new commits)
 -> supervisor merges the PR into develop (squash merge)
 -> recette deploys automatically
 -> agent: sync develop, verify merge, delete branch (§4b)
 -> develop regression check on recette (§9) when the supervisor asks or at milestone end
```

Milestone promotion:

```text
milestone exit criteria met on recette
 -> PR develop -> main (merge commit, not squash)
 -> production workflow waits for manual approval (GitHub environment "production")
 -> deploy -> production smoke test (§13)
```

A feature is not complete because TypeScript compiles.

## 3. Bounded tasks

Never implement several features in one context window to make progress look faster.

Each task has: a purpose, acceptance criteria, success and failure behavior, security/authorization considerations,
database changes if any, tests, manual verification steps. These are defined in `05_ROADMAP.md`.
If a task is too large to test cleanly, propose a split before starting.

## 4. Commit discipline

Conventional commits with a module scope:

```text
feat(core): resolve tenant from request host
feat(membership): create Stripe checkout for CB-02
fix(catalog): prevent overbooking under concurrent reservations
test(commerce): cover duplicate Stripe webhook delivery
chore(infra): add recette compose project
docs(adr): record ADR-010 analytics choice
```

Scopes: `core`, `content`, `forms`, `membership`, `catalog`, `commerce`, `lms`, `notifications`, `analytics`,
`design-system`, `infra`, `ci`, `deps`, `docs`, `adr`.

No unrelated refactors inside a feature commit. No giant "everything done" commits.

## 4b. Deleting a merged branch

Once a branch is merged into `develop` and no longer needed, delete it locally and on the remote.

Verify the merge first:

```bash
git switch develop && git pull
git log --oneline -5            # the squash commit for the PR is present
gh pr view <number> --json state,mergedAt   # if gh is available: state MERGED
```

Squash merges mean `git branch --merged` does NOT list the branch. Rely on the PR state and the squash commit.

Then:

```bash
git push origin --delete feat/<name>   # skip if GitHub already deleted it automatically
git branch -D feat/<name>              # ONLY after the PR is confirmed MERGED (squash requires -D)
```

Rules:

- Force-delete locally only after confirming the PR state is MERGED. Otherwise use `git branch -d` and stop if refused.
- Never delete a branch with unmerged or still-needed work (parked task, under review).
- `main` and `develop` are never deleted.

## 5. Git safety

Before changes: `git status`, `git branch --show-current`.
Before committing: `git diff --stat`, `git diff`, `git status`.
After committing: `git log -1 --oneline`, `git status`.

Never discard the supervisor's uncommitted work. Never force-push. Never rewrite shared history.
If the working tree is dirty with changes you did not make, STOP and ask.

## 6. Automated quality gate

Run from the repository root (Turborepo):

```text
pnpm typecheck
pnpm lint
pnpm test                    # unit + integration (integration uses the local Postgres container)
pnpm build
```

Plus, when relevant to the task:

- `pnpm payload migrate:status` / migration checks on a clean database (schema changes);
- access-control and tenant-isolation test suites (any collection change);
- `pnpm e2e` Playwright on affected flows (UI and flows);
- visual regression (design system changes);
- `docker build` of the app image (Dockerfile, dependencies, build config changes);
- Lighthouse / axe checks (page and component changes).

Report each check as PASSED / FAILED / SKIPPED (with reason). Never claim a check passed without running it.

## 7. Mandatory manual-test gate

After automated checks pass, STOP and give the supervisor exact instructions:

1. setup required (branch, commands, seed, env values to add, accounts to use);
2. exact actions, step by step, with URLs;
3. expected result for each step;
4. expected failure behavior where relevant (what should be refused or degrade gracefully);
5. what to send back if it fails (screenshot, console output, log lines, step number).

Template:

```text
MANUAL VERIFICATION REQUIRED

Setup:
  git fetch && git switch feat/<name>
  pnpm install && docker compose -f infra/local/compose.yaml up -d
  pnpm db:reset && pnpm seed
  pnpm dev

Steps:
  1. Open http://careerboost.localhost:3000/...
  2. ...
Expected:
  1. ...
  2. ...
Must fail / degrade:
  - ...
If something fails, send: the step number, a screenshot, and the terminal output.
```

Do not start the next task before receiving the supervisor's result.

## 8. Integration gate (before the supervisor merges into develop)

- feature tests and the broader suite pass;
- typecheck, lint, build pass;
- migrations inspected and tested on a clean database;
- environment/config changes documented in `.env.example` and the relevant runbook;
- no secret, real personal data or generated junk committed (check `git diff --stat` for surprises);
- affected routes and previously completed features sanity-checked;
- tenant isolation re-checked for touched collections;
- PR description lists: requirement IDs, what changed, migrations, env changes, manual test result.

## 9. Develop / recette regression gate

At the end of each milestone (and when the supervisor asks), check on recette:

- both sites load with the right brand on the right host; unknown hosts are refused;
- admin login, tenant separation in the admin;
- public account sign-up, login, logout, password reset (once implemented);
- navigation, legal pages, sitemap, robots (`noindex` on recette);
- forms, payments in Stripe test mode, emails (once implemented);
- jobs are processed by the worker; kill switches work;
- error pages and degraded states;
- health/readiness endpoints; backups ran last night.

Do not promote to `main` because only the latest feature passes.

## 10. Database migrations

- Every schema change is a Payload migration committed with the code that needs it.
- Migrations run in order on a clean database (CI checks this).
- Migration assumptions are written at the top of the migration file.
- Destructive changes follow expand → migrate data → contract, across separate deploys.
- Data migrations are idempotent and tested on a copy of realistic synthetic data.
- Indexes and constraints are created intentionally and named.
- The deploy pipeline takes a database backup before running migrations in production.

## 11. Environments and secrets

| Environment | Branch | Deploy | Secrets live in |
|---|---|---|---|
| Local | any | `pnpm dev` | `.env.local` (git-ignored) |
| Recette | `develop` | automatic after CI on merge | GitHub environment `recette` + `/srv/upwilling-recette/.env` on the server (created by the human) |
| Production | `main` | manual approval in GitHub environment `production` | GitHub environment `production` + `/srv/upwilling-prod/.env` on the server |

Never commit: `.env*` files with values (only `.env.example`), Stripe keys, webhook secrets, Payload secret,
database passwords, Brevo/R2/Cloudflare/Sentry/Umami credentials, SSH keys, backup encryption keys.
If a secret is ever committed, STOP, tell the supervisor immediately: it must be rotated (removing the commit is not enough on a public repo).

## 12. CI/CD pipelines (GitHub Actions)

- `ci.yml` — on every PR and push to `develop`/`main`: install (with cache), typecheck, lint, unit + integration tests
  (Postgres service container), build, migration check, Docker image build. Later: e2e, visual regression, Lighthouse.
- `deploy-recette.yml` — on push to `develop` after CI succeeds: build the image once, tag it with the commit SHA,
  push to GHCR (the repository is public, so the image is public — it must never contain secrets),
  SSH to the server as the deploy user, pull the image, run migrations, restart containers, run the smoke check.
- `deploy-production.yml` — on push to `main`: same image flow, gated by the `production` environment's required reviewer.
  Takes a pre-deploy database backup. Keeps the previous image tag for rollback.
- `rollback.yml` (manual dispatch) — redeploys a chosen previous image tag. Database rollbacks are never automatic.

Repository settings (human, once):

- Default branch `develop`. Rulesets on `main` and `develop`: require PR, require CI status checks, block force pushes and deletion.
  With a single human reviewer, required approvals may be 0; with two developers, require 1.
- Merge methods: squash for feature PRs, merge commits for `develop → main`. Auto-delete head branches.
- Environments `recette` and `production`; `production` has the supervisor as required reviewer.

## 13. Production smoke test (after each promotion)

1. Deployment succeeded; containers healthy; `/api/ready` OK for every site.
2. Version endpoint/footer shows the expected commit SHA.
3. Key pages of each launched site load with the correct brand.
4. Login works; admin reachable through Cloudflare Access.
5. A test flow in the safest form available (e.g. form submission to a test inbox; Stripe live flows only with a
   PO-approved low-value test and immediate refund).
6. Sentry receives a deliberate test event; uptime monitor green.
7. Record the milestone, version and known limitations in `docs/progress/CHANGELOG.md`.

## 14. Mandatory task report

At the end of every task, reply with exactly this structure, then STOP:

```text
TASK: <milestone.task> — <title> (<requirement IDs>)

BRANCH / PR: <branch> — <PR link or "not opened (reason)">

IMPLEMENTED:
- ...

FILES CHANGED (main ones):
- ...

DATABASE / MIGRATIONS:
- none | <migration name> — <what it does>

ENV / CONFIG CHANGES:
- none | <variable> added to .env.example — <purpose>

AUTOMATED CHECKS:
- typecheck: PASSED
- lint: PASSED
- tests: PASSED (n tests) | FAILED (...) 
- build: PASSED
- other: ...
- skipped: <check> — <reason>

MANUAL TEST REQUIRED:
<the §7 block>

KNOWN LIMITATIONS / FOLLOW-UPS:
- ...

DECISIONS NEEDED FROM SUPERVISOR / PO:
- none | ...

NEXT TASK (do not start): <milestone.task> — <title>
```

Do not continue until the supervisor reports the manual test result.
