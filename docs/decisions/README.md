# Architecture Decision Records

One file per decision: `ADR-XXX-short-title.md` with context, decision, consequences, revisit-when.
The most recent ADR wins over older ADRs and over `docs/ai/*.md`. Superseding an ADR means writing a new one
and setting the old one's status to "Superseded by ADR-YYY".

| ADR | Title | Status |
|---|---|---|
| [001](ADR-001-monorepo-pnpm-turborepo.md) | Monorepo with pnpm workspaces and Turborepo | Accepted |
| [002](ADR-002-single-multitenant-app.md) | One Next.js + Payload app serves both sites | Accepted (Essai 4 confirms) |
| [003](ADR-003-single-vps-docker-caddy-cloudflare.md) | One VPS, Docker Compose, Caddy, Cloudflare | Accepted |
| [004](ADR-004-one-image-container-roles.md) | One image, several container roles | Accepted |
| [005](ADR-005-database.md) | PostgreSQL 18 (one container per stack) | Accepted (2026-10-20; compatibility re-checked in Task 3.1) |
| [006](ADR-006-accounts-sessions.md) | Accounts, sessions, admin access | Accepted (PO decision pending) |
| [007](ADR-007-jobs-queue.md) | Payload Jobs Queue in the worker | Accepted |
| [008](ADR-008-object-storage-r2.md) | Files and backups on Cloudflare R2 | Accepted |
| [009](ADR-009-content-source-of-truth.md) | Payload as content source of truth | Accepted |
| [010](ADR-010-analytics-umami.md) | Umami + server-side events | Accepted (PO validates CNIL self-assessment) |
| [011](ADR-011-payments-two-stripe-accounts.md) | Two Stripe accounts | Accepted |
| [012](ADR-012-email-brevo.md) | Brevo via worker jobs, Mailpit locally | Accepted |
| [013](ADR-013-errors-sentry-uptime.md) | Sentry EU + external uptime monitor | Accepted |
| [014](ADR-014-localization.md) | Localization `fr` + `en` from day one | Accepted (cost checked in M3) |
| [015](ADR-015-vlab-out-of-scope.md) | VLAB out of scope | Accepted |
| [016](ADR-016-git-branching.md) | Git workflow | Accepted |
| [017](ADR-017-recette-environment.md) | Recette on the same VPS, separate domain | Accepted |
| [018](ADR-018-pinned-versions.md) | Pinned versions | Accepted |
| [019](ADR-019-typescript-strictness.md) | TypeScript strictness options | Proposed (re-checked in Task 3.1) |
| [020](ADR-020-server-baseline.md) | Server baseline: OS, access, hardening | Proposed (supervisor to confirm) |
| [021](ADR-021-test-phase-hosting-oracle.md) | Test phase on an Oracle Cloud Always Free Arm VM | Accepted (test phase only; amends 003) |
| [022](ADR-022-test-phase-recette-hosts.md) | Test-phase recette hosts under upwilling.fr | Accepted (test phase only; amends 017) |
| [023](ADR-023-edge-tls-cloudflare-caddy.md) | Edge TLS: Cloudflare origin certificate + Authenticated Origin Pulls | Accepted |
| [024](ADR-024-pull-based-deploys.md) | Pull-based deploys: image tags + deploy agent | Accepted |
