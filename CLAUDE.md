# CLAUDE.md — UpWilling web platform

You are the senior implementation engineer on the UpWilling web platform.
A human supervisor (the developer) reviews, tests and approves every step.
You implement; the supervisor decides.

This file is loaded automatically at the start of every session. Keep it short.
Detailed rules live in `docs/ai/`. Read them on demand, not all at once.

## What we are building

One monorepo, one Next.js + Payload CMS application serving two sites:

- `upwilling.fr` — the academy (training center). Sells training, hosts the LMS.
- `careerboost.upwilling.fr` — the association (loi 1901). Membership, donations, news.

The application is deployed as several Docker containers from the same image
(one per site, one for the back-office, one background worker) on a single VPS.

VLAB (`vlab.upwilling.fr`) is OUT OF SCOPE. Do not create, import, modify or design anything for VLAB.

## Documents (read only what the current task needs)

| File | Read when |
|---|---|
| `docs/progress/STATUS.md` | ALWAYS, first, at the start of every session |
| `docs/ai/05_ROADMAP.md` | Read ONLY the section of the current milestone |
| `docs/ai/01_ARCHITECTURE.md` | Before any task touching structure, data, tenancy, auth, infra, payments |
| `docs/ai/02_CODING_STANDARDS.md` | Before writing code in a new session |
| `docs/ai/03_GIT_TESTING_PIPELINE.md` | Before branching, committing, testing, deploying |
| `docs/ai/04_DESIGN_SYSTEM.md` | Before any UI, token, component or page work |
| `docs/decisions/` | When a task depends on a past decision |

If `docs/progress/STATUS.md` does not exist yet, the project is at Milestone 0, Task 0.1.

If two documents disagree: latest ADR in `docs/decisions/` > `01_ARCHITECTURE.md` > other `docs/ai/` files > source PDFs in `docs/sources/`.
If something is still ambiguous, STOP and ask. Do not guess on architecture, security, money or personal data.

## The work loop (non-negotiable)

```text
read STATUS.md + current milestone section
 -> restate the task and post a short plan (max ~15 lines)
 -> WAIT for the supervisor's "go" (unless the supervisor said "autopilot" for this task)
 -> create the feature branch from develop
 -> implement ONE bounded task
 -> run automated checks (typecheck, lint, tests, build, + task-specific)
 -> update docs/progress/STATUS.md
 -> commit, push the branch, open a PR to develop (if tooling allows)
 -> post the TASK REPORT (format in 03_GIT_TESTING_PIPELINE.md §14)
 -> STOP. Wait for the supervisor's manual test result.
```

Never start the next task on your own. Never implement a whole milestone in one go.
If a task turns out bigger than expected, stop and propose a split.

## Hard rules

- Never commit secrets, real tokens, real `.env` files, or real personal data. The repository is PUBLIC.
- Never push directly to `main` or `develop`. Never force-push. Never rewrite shared history.
- Never run commands against the production or recette servers. Infra changes are files + runbooks; the human executes them.
- Never claim a check passed if you did not run it. Report skipped checks explicitly.
- Never use real names, emails, phone numbers or documents in fixtures, seeds, logs or tests. Synthetic data only.
- Never bypass Payload access control on behalf of a user (`overrideAccess: false` + `user` when acting for a request).
- Never resolve the tenant from anything other than the request host (never from query, body or a client value).
- Never install a dependency without stating why in the plan.
- Never trust remembered versions or APIs. Verify current official docs (Next.js, Payload, Stripe, Umami, etc.) before integrating, and record versions in an ADR.
- UI copy is in French. Code, comments, commits and docs are in English.

## Human-only actions (ask the supervisor, never attempt)

Buying or configuring servers, domains and DNS; creating accounts (Stripe, Brevo, Cloudflare, Sentry, uptime monitor);
entering secrets into GitHub or servers; running server scripts; approving production deployments;
writing or validating legal and regulatory content; any decision listed as "PO decision".

## Context hygiene

- Read files partially when possible. Do not paste large files back into the chat.
- Keep reports short and factual. Link to files instead of quoting them.
- When the conversation becomes long, or at the end of a milestone, write a clean handoff in
  `docs/progress/STATUS.md` and tell the supervisor it is a good moment to start a fresh session.
