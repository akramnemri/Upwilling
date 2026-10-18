# 05 — Roadmap: Milestones and Bounded Tasks

Act as the senior implementation engineer. Implement the project **one bounded task at a time**.

## Non-negotiable execution rule

```text
read docs/progress/STATUS.md
 -> read ONLY the current milestone section below
 -> post plan for the current task, wait for "go"
 -> implement it
 -> automated checks
 -> update STATUS.md
 -> TASK REPORT
 -> STOP
 -> supervisor tests manually and reports
 -> only then the next task
```

- Do NOT implement a whole milestone in one response. Do NOT silently move to the next task.
- Tasks marked **[HUMAN]** contain actions only the supervisor can do. Prepare files, scripts and instructions, then STOP.
- Tasks marked **[PO]** need a Product Owner decision. Present options with trade-offs, then STOP.
- Tasks marked **[SPIKE]** are time-boxed experiments on `spike/*` branches. The deliverable is a written report; the code is not merged.
- Requirement IDs refer to Phase 0, Annexe A.
- If a task reveals that the plan is wrong, say so and propose a correction. Do not silently drift.

## Session strategy (protect the context window)

- One milestone ≈ one to three sessions. Start a fresh session at every milestone boundary, and whenever the context gets long.
- `docs/progress/STATUS.md` is the memory between sessions. Keep it accurate and short.
- Do not re-read finished milestones. Do not re-read whole documents when one section is enough.

## Milestone overview

| # | Milestone | Phase 0 link | Ships to |
|---|---|---|---|
| M0 | Repository & tooling foundation | prerequisite of Essai 1 | — |
| M1 | Deployment chain, recette, backups, branded "under construction" pages | **Essai 1** (without VLAB) | recette (+ production stack ready, DNS not switched) |
| M2 | Design system foundation & section patterns | **Essai 2** (without VLAB) | recette |
| M3 | Payload core: multi-tenancy, roles, accounts, container roles, jobs | **Essai 4** | recette |
| M4 | Spikes & decision session | **Essai 5, Essai 6**, decision session | reports only |
| M5 | Career Boost site (launch #1) | Stratégie phase 2 | **production** |
| M6 | Academy: catalogue, sessions, requests, blog, regulatory pages | Stratégie phase 3 | recette |
| M7 | Academy: commerce & invoicing | Stratégie phase 3 | recette |
| M8 | Academy: minimal LMS + trainer workflow + pilot course | Stratégie phase 3, §7.2 | recette |
| M9 | Academy launch, data foundation & dashboards | Stratégie §12 | **production** |
| M10 | LMS enriched: quizzes, certificates, reviews, trainer space | Stratégie phase 5 | production |
| Later | VLAB redesign & integration, English, cross-site navigation, members' area, trainer remuneration | — | — |

Rule from Phase 0 §9: **no definitive feature development (M5+) before the decision session at the end of M4.**
M0–M3 build foundations that are needed whatever the decisions are.

---

# M0 — Repository & tooling foundation

**Goal:** an empty-but-professional monorepo where every check runs locally and in CI.
**Exit criteria:** fresh clone → `pnpm install` → local stack up → app responds on both local hosts → all checks green in CI.

### Task 0.1 — Verify versions and record foundational ADRs
- Verify from official sources (not memory): current Node.js LTS, pnpm, Turborepo, the latest Payload 3 release and the
  **Next.js versions it officially supports**, Payload's Postgres adapter and supported PostgreSQL major, Tailwind, Vitest, Playwright, Storybook.
- Write ADR-001…ADR-017 from `01_ARCHITECTURE.md` §3 into `docs/decisions/`, plus ADR-018 "pinned versions".
- Create `docs/progress/STATUS.md` (structure in `00_HOW_TO_USE.md`), `docs/glossary.md`.
- Out of scope: any code.
- Manual: supervisor reads the ADR list and the version table; confirms or corrects.

### Task 0.2 — Monorepo scaffold
- pnpm workspace + Turborepo; `apps/web` (plain Next.js app with App Router, TypeScript, no Payload yet);
  `packages/config` (tsconfig bases, ESLint flat config, Prettier); `packages/design-system` (empty package wired into the app).
- Root scripts: `dev`, `build`, `typecheck`, `lint`, `test`, `e2e`, `format`. `.editorconfig`, `.gitignore`, `.nvmrc`/engines, `.env.example`.
- README: prerequisites and setup commands.
- Acceptance: `pnpm install && pnpm typecheck && pnpm lint && pnpm build` pass from a clean clone.
- Manual: clone into a new folder, follow the README, open the app.

### Task 0.3 — Local infrastructure & environment validation
- `infra/local/compose.yaml`: Postgres (pinned version from 0.1), Mailpit. Named volumes. Healthchecks.
- Typed environment loading with runtime validation (fails fast with a clear message listing missing variables).
- Host → tenant map in config; local hosts `upwilling.localhost`, `careerboost.localhost`, `admin.localhost`.
- A temporary page showing the resolved tenant for the current host; unknown host → 404.
- Tests: env validation, host resolution (valid, unknown, uppercase, port, `www.`).
- Manual: start compose, open the three local hosts, try an unknown host, remove a required env var and see the error.

### Task 0.4 — Error, logging & request-context foundation
- `AppError` with stable codes, safe French messages, HTTP status; `normalizeError`.
- Structured logger with redaction; request ID generated in the proxy/middleware and propagated; job ID support reserved.
- `error.tsx`, `global-error.tsx`, `not-found.tsx`; safe JSON error format for route handlers.
- `GET /api/health` (liveness) and `GET /api/ready` (checks Postgres).
- Tests: AppError serialization, unexpected error → generic message, redaction (token, cookie, email never appear), health/ready.
- Manual: trigger a dev-only test error route; check the page shows a safe message and the log line is useful and clean;
  stop Postgres and see `/api/ready` fail while `/api/health` stays OK.

### Task 0.5 — Testing foundation
- Vitest (unit + integration projects), integration tests use the local Postgres (separate test database, reset per run).
- Playwright configured for multi-host local testing; one smoke e2e per local host.
- Test data factories that only generate synthetic data (`@example.test` emails).
- Manual: run `pnpm test` and `pnpm e2e`; break a test on purpose and confirm the failure output is readable.

### Task 0.6 — CI pipeline
- `.github/workflows/ci.yml` per `03_GIT_TESTING_PIPELINE.md` §12 (no deploy yet), with dependency and Turborepo caching.
- Secret scanning in CI (e.g. gitleaks) to protect the public repository.
- [HUMAN] Repository settings: default branch `develop`, rulesets, merge methods, auto-delete branches (instructions in the report).
- Manual: open a PR with a deliberate lint error → CI fails; fix → CI passes.

---

# M1 — Deployment chain (Essai 1)

**Goal:** a merge to `develop` appears on recette with no manual intervention; production can be deployed by approval; a backup can really be restored.
**Exit criteria (Phase 0, Essai 1):** two branded "under construction" pages on recette, deployed automatically; restore proven; one-page procedure written in `docs/phase0/essai-1.md`.
VLAB is excluded from this Essai (out of scope).

### Task 1.1 — Production Dockerfile with container roles
- Multi-stage build, Next.js standalone output, non-root user, healthcheck on `/api/health`, minimal final image.
- One image, role selected by `APP_ROLE` (`web`, `cms`, `worker`) and `SITE`; the worker role starts a placeholder loop that logs and exits cleanly on SIGTERM.
- Proxy/middleware enforces role and host rules (`01_ARCHITECTURE.md` §5.3).
- Tests: role/host routing matrix (web-upwilling refuses careerboost host and admin paths, cms refuses public hosts, etc.).
- Manual: build the image locally; run it three times with different roles via a local compose override; check each behaves as specified.

### Task 1.2 — Branded "under construction" pages (TR-13)
- One page per brand with logo, brand colors (temporary tokens until M2), short French text from config, contact email.
- `noindex` when `DEPLOY_ENV != production`; correct `<title>`, favicon, Open Graph defaults.
- Manual: both local hosts show the right brand; check mobile width and Lighthouse locally.

### Task 1.3 — Server provisioning runbook & scripts [HUMAN]
- `docs/runbooks/server-setup.md` + idempotent scripts in `infra/server/scripts/`: deploy user with SSH keys only, firewall (22/80/443),
  automatic security updates, fail2ban (or equivalent), Docker Engine + Compose plugin, directory layout `/srv/upwilling-prod` and `/srv/upwilling-recette`,
  swap file, time zone UTC, log rotation.
- Cloudflare DNS records list for production and the separate recette domain (records, proxy status, SSL mode "Full (strict)").
- Human: buy the VPS (8 GB RAM) and recette domain, run the scripts, create DNS records, report outputs.
- Manual: supervisor confirms SSH as deploy user works, root login disabled, `docker run hello-world` works.

### Task 1.4 — Compose projects & Caddy
- `infra/server/compose.production.yaml`, `compose.recette.yaml` (separate project names, networks, volumes, Postgres containers, memory limits, restart policies, log rotation).
- `Caddyfile`: host routing per `01_ARCHITECTURE.md` §5.2, security headers, `www` → apex redirect, recette basic auth + `X-Robots-Tag`, hooks host limited to `/api/webhooks/*`.
- TLS between Cloudflare and Caddy: verify the current recommended setup (Cloudflare origin certificate, or ACME DNS challenge) and document the choice in an ADR.
- `.env.production.example`, `.env.recette.example` (names only). Human creates the real `.env` files on the server.
- Manual: [HUMAN] start recette manually once following the runbook; open both recette hosts; check HTTPS, headers (securityheaders-style check), basic auth.

### Task 1.5 — Deployment workflows
- `deploy-recette.yml`, `deploy-production.yml`, `rollback.yml` per `03_GIT_TESTING_PIPELINE.md` §12; image tagged by commit SHA in GHCR; SSH deploy with a restricted key;
  migration step placeholder (real in M3); post-deploy smoke check against `/api/ready` and the home pages; `GET /api/version` returning the SHA.
- [HUMAN] Create GitHub environments and secrets (SSH key, host, known_hosts).
- Manual: merge a visible text change into `develop` → appears on recette without touching the server. Run the production workflow →
  waits for approval → deploys to the production stack on its non-public test hostname. Run rollback to the previous SHA.

### Task 1.6 — Backups, restore, monitoring
- Nightly encrypted `pg_dump` of production databases to R2 (retention 35 days, configurable), run by a host cron or a small container;
  restore script that restores a chosen backup into **recette**; runbook `docs/runbooks/backup-restore.md`.
- Sentry wiring (EU region) for web, cms, worker with PII scrubbing; test event route (dev/recette only).
- [HUMAN] Create R2 bucket and keys, Sentry project, external uptime monitor on `/api/ready` of each host.
- Manual: [HUMAN] perform a real restore into recette and confirm data is there; trigger a Sentry test event; stop a container and get the uptime alert.

### Task 1.7 — Essai 1 report
- `docs/phase0/essai-1.md`: what was built, how to deploy and roll back, measured RAM usage, issues met, answers to the Essai 1 questions.
- Update STATUS.md; propose `develop → main` promotion for the infra baseline.

---

# M2 — Design system foundation (Essai 2)

**Goal:** one source of truth for the visual identity, proven to propagate to both brands.
**Exit criteria (Essai 2, without VLAB):** changing one base value changes both sites; Career Boost's blue and logo stay specific; visual regression detects both cases; PO design review done.

### Task 2.1 — Tokens & theming pipeline (TR-01, TR-01b)
- Tokens per `04_DESIGN_SYSTEM.md` §3; generated CSS variables per brand; Tailwind mapping; `data-brand` set from tenant.
- Color scales in OKLCH; role shades chosen by measured contrast; contrast unit test for every role pair in both brands.
- Lint rule forbidding raw colors / arbitrary values in `apps/web`.
- Manual: switch hosts locally and see both themes on a token preview page (dev/recette only).

### Task 2.2 — Primitive components
- Primitives and form components from `04_DESIGN_SYSTEM.md` §4 (not section patterns yet). Keyboard and screen-reader behavior verified.
- Manual: keyboard-only walkthrough of the preview page; check focus rings and error states.

### Task 2.3 — Storybook & visual regression
- Storybook with brand switcher and accessibility addon; Playwright screenshot tests of stories in both brands, run in CI.
- Manual: change a token on a branch; see CI visual diff fail; revert.

### Task 2.4 — Header, footer & layout
- `SiteHeader` (anchor nav, CTA, accessible mobile menu), `SiteFooter` (legal entity line, legal links), page layout per tenant, fonts via `next/font`.
- Manual: both sites on mobile and desktop; menu works with keyboard; no layout shift on load.

### Task 2.5 — Section patterns (Masar-inspired, original)
- Section components from `04_DESIGN_SYSTEM.md` §4 with typed props and synthetic French placeholder copy.
- A demo page per brand composed of these sections, used for the PO review.
- Manual: [PO] design review on recette with the reference site side by side; collect feedback in `docs/phase0/essai-2.md`.

### Task 2.6 — Essai 2 proof & report
- Demonstrate both propagation cases with screenshots in the PR; write `docs/phase0/essai-2.md`.

---

# M3 — Payload core & multi-tenancy (Essai 4)

**Goal:** both sites served by one application with separated content and rights; shared accounts; container roles real; jobs working.
**Exit criteria (Essai 4):** no content of one site visible or editable from the other without explicit rights; a volunteer can edit Career Boost only; accounts are common to both sites.

### Task 3.1 — Install Payload
- Payload 3 inside `apps/web` with the Postgres adapter; admin on the admin host; French admin language; Lexical editor;
  R2 storage adapter (public + private buckets); migrations workflow and CI check; seed script with synthetic data.
- Localization per ADR-014 (verify cost; if problematic, propose an ADR change).
- Deploy step now runs migrations before switching containers.
- Manual: log into the local admin; upload an image (lands in R2/local emulation); run migrations on a clean DB.

### Task 3.2 — Tenants & tenant-scoped content
- `tenants` collection, multi-tenant plugin, a first tenant-scoped collection (`pages`, minimal fields) and per-tenant `site-settings`.
- Front-end reads only the current host's tenant data.
- Tests: isolation matrix for `pages` and `site-settings` (read/create/update/delete across tenants, as staff of each tenant and as public).
- Manual: create a page in each tenant; confirm each host shows only its own.

### Task 3.3 — Users, roles & access helpers
- `users` collection with roles from `01_ARCHITECTURE.md` §8; tenant assignment for staff; access helpers in `core`; field-level access for sensitive fields.
- Admin visible only to staff/trainers/super admins; trainers see nothing yet (LMS later).
- Tests: full access matrix (super admin, staff UpWilling, staff Career Boost/volunteer, trainer, public user, anonymous).
- Manual: log in as each synthetic role and confirm what is visible and editable.

### Task 3.4 — Public accounts on both sites (TR-02)
- Sign-up with email verification, login, logout, forgot/reset password, account page — on both sites, same account.
- Cookie configuration per environment (host-only locally, `.upwilling.fr` in production, recette domain on recette).
- Rate limiting and lockout; Turnstile on sign-up; emails sent via the jobs queue (worker) through Mailpit locally.
- Tests: sign-up, verification, wrong password, lockout, reset token single-use and expiry, logout.
- Manual: full account journey locally; on recette, log in on one site and confirm the session on the other.

### Task 3.5 — Container roles, jobs & kill switches
- Worker runs the Payload Jobs Queue for real; email sending moved entirely to jobs; retry policy and dead-letter visibility in the admin.
- Cross-container cache revalidation (`01_ARCHITECTURE.md` §5.4) with tests.
- Per-tenant feature flags in `site-settings`, read with caching on the front-end; a demo flag that hides a section with a French message.
- Manual: stop the worker, sign up (email waits), start the worker (email arrives); publish a page in the admin and see the public page update within seconds; toggle the demo flag.

### Task 3.6 — Essai 4 report
- `docs/phase0/essai-4.md`: limits of the multi-tenant plugin, isolation test results, decision recommendation (one app confirmed or fallback).

---

# M4 — Spikes & decision session (Essai 5, Essai 6)

**Goal:** replace estimates with facts before building the academy.
**Exit criteria:** two written reports, a synthesis, and the PO's decisions recorded as ADRs. The roadmap for M6–M10 is updated accordingly.

### Task 4.1 — [SPIKE] Minimal LMS on Payload (Essai 5, cap: 3 person-days)
- Branch `spike/essai-5-lms`. Collections: courses, modules, lessons, enrollments, progress; one realistic synthetic lesson with
  Lexical custom blocks (code, callout, downloadable resource, disabled VLAB placeholder).
- Trainer role limited to drafts of own courses; review states (submitted, changes requested, approved, published) using Payload versions/drafts.
- Try Markdown import of one existing lesson file (supplied by the PO, synthetic or approved).
- Report `docs/phase0/essai-5.md`: what worked, admin usability for a non-developer, estimate for minimal and enriched LMS **based on what was built**.

### Task 4.2 — [SPIKE] Payments & invoicing (Essai 6, cap: 2 person-days)
- Branch `spike/essai-6-payments`. Stripe test mode: Checkout → webhook → idempotent enrollment record; bank-transfer invoice path;
  purchase-order with payment terms; multi-participant session order.
- Research and compare invoicing options compatible with the French e-invoicing reform (dedicated invoicing tool with API vs Stripe Invoicing + approved platform);
  generate one sample invoice PDF with all mandatory mentions (synthetic data).
- Report `docs/phase0/essai-6.md` with a recommendation and costs.

### Task 4.3 — Phase 0 synthesis & decision session [PO]
- `docs/phase0/synthesis.md`: results of Essais 1, 2, 4, 5, 6; Essai 3 postponed (VLAB); the decision grid from Phase 0 §5 filled in;
  the list of decisions to take (architecture, LMS scope at launch, launch dates, invoicing tool, data plan, task split between developers).
- After the session, record decisions as ADRs and update M5–M10 in this file (supervisor approves the diff).

---

# M5 — Career Boost site (launch #1)

**Goal:** Career Boost live in production with its content, membership and donations.
**Exit criteria:** CB-01, CB-02, CB-03, CB-05, CB-07, CB-08 done (CB-04 if PO confirmed), TR-04/05/06/12/14 satisfied, content entered by the PO side, DNS switched, production smoke test passed.

### Task 5.1 — Page builder
- `pages` blocks mapped to section patterns; drafts, preview, live preview; SEO fields; tag-based revalidation on publish; slug rules per tenant.
- Tests: block rendering, draft not publicly visible, revalidation job.
- Manual: build the Career Boost home in the admin from blocks; preview a draft; publish and see it live.

### Task 5.2 — Navigation, footer, legal pages, SEO plumbing (TR-05, TR-06)
- Per-tenant navigation and footer globals; legal page templates; `sitemap.xml`, `robots.txt`, redirects, canonical URLs, Open Graph images.
- Manual: check sitemap and robots per host; recette stays `noindex`.

### Task 5.3 — News (CB-05)
- `news` collection (shared module, tenant-scoped) with list (pagination), detail, featured items; optional cross-site highlighting (scenario 14).
- Manual: publish three synthetic articles; pagination; highlight one on the other site.

### Task 5.4 — Forms: contact & volunteer applications (CB-07)
- Forms with server validation, Turnstile, rate limit, duplicate protection, storage with retention, internal notification email via job, kill switch.
- File upload for CV if the PO wants it (private bucket, PDF only, size limit).
- Manual: submit valid and invalid forms; check admin entries and Mailpit emails; disable the form via the kill switch.

### Task 5.5 — Membership (CB-02, CB-03) [PO amounts]
- Membership plans (categories, amounts, period); Stripe Checkout on the **association** account; webhook → job → membership activation, idempotent;
  receipt PDF generated by the worker and emailed; member status visible in the account and admin.
- Tests: duplicate webhook, failed payment, cancelled checkout, tenant isolation, kill switch.
- Manual: Stripe test cards (success, decline); replay a webhook from the Stripe CLI; check one membership and one receipt only.

### Task 5.6 — Donations (CB-04) [PO receipt rules]
- One-off and recurring donations via Stripe; donor receipts; tax receipt only if the PO confirmed eligibility.
- Manual: one-off and recurring test donations; cancel a recurring donation.

### Task 5.7 — Official documents (CB-08) & bureau page (CB-01)
- Public documents list with file metadata; private documents never publicly reachable.
- Manual: upload public and private documents; try the private file URL while logged out.

### Task 5.8 — Analytics (DA-01, DA-06)
- Umami container per ADR-010 (prod + recette), first-party script proxy, CNIL-exempt configuration; `analytics` module wrapper;
  server-side domain events for membership, donation, volunteer application; `docs/analytics/events.md` and `cnil-self-assessment.md` drafts for the data analyst and PO.
- Manual: visit pages and see them in Umami; complete a test membership and see the server-side event (no personal data in it).

### Task 5.9 — Launch hardening & go-live [HUMAN]
- Lighthouse and axe on key pages; security headers review; backup + restore check; regression gate on recette; content entry completed by the PO side;
  privacy policy and legal mentions validated by the PO.
- Promotion `develop → main`; [HUMAN] DNS switch for `careerboost.upwilling.fr`; production smoke test; CHANGELOG entry.

---

# M6 — Academy: catalogue, sessions, requests (no payment yet)

**Goal:** the academy's public offer is browsable and requestable.
**Exit criteria:** AC-01, AC-02, AC-05 (without payment), AC-06, AC-07, AC-14, AC-15, AC-17, AC-22 on recette.

### Task 6.1 — Trainings & catalogue (AC-01, AC-02, AC-22)
- `trainings` (fields validated with the PO: program, prerequisites, duration, format, level, theme, price or "sur devis", trainer), trainer public profiles, catalogue with filters and pagination, detail pages.
- Manual: create synthetic trainings; filter combinations; empty results state.

### Task 6.2 — Public sessions, seats & waitlist (AC-05, AC-06)
- `publicSessions` with dates (Europe/Paris), capacity; seat reservation and automatic waitlist as a transactional service; promotion from waitlist on cancellation; notifications via jobs.
- Payment is not connected yet: reservations are "pending payment" with an expiry, ready for M7.
- Tests: concurrency (e.g. 50 parallel reservations for 10 seats → exactly 10 held), expiry, waitlist order, cancellation promotion.
- Manual: two browsers competing for the last seat; waitlist promotion email in Mailpit.

### Task 6.3 — In-company requests (AC-07) & contact/appointment (AC-17)
- Request form → admin pipeline (new, quote sent, accepted, refused) → internal notification; appointment link (agenda integration deferred unless the PO decides).
- Manual: submit a request; move it through statuses in the admin.

### Task 6.4 — Blog (AC-14) & regulatory pages (AC-15)
- Reuse `news` for the academy blog; regulatory page templates (general terms, accessibility, results indicators) with content from the PO.
- Manual: publish a blog post; check regulatory pages are reachable from the footer.

---

# M7 — Academy: commerce & invoicing

**Goal:** the academy can sell e-learning and session seats and issue compliant invoices.
**Exit criteria:** AC-03 (purchase part), AC-08, AC-09, AC-10 on recette with Stripe test mode; accountant review of a sample invoice.
Adjust these tasks to the decisions recorded after M4.

### Task 7.1 — Orders & Stripe Checkout (academy account)
- `orders` with explicit states; Checkout for e-learning and session seats; webhook → job → `order.paid` event → seat confirmation / access grant hooks (LMS hook stubbed until M8); idempotency.
- Tests: duplicate webhooks, partial failures, expired seat holds, tenant isolation.

### Task 7.2 — Pricing rules (AC-10)
- Promo codes with limits, member pricing for Career Boost members (needs the cross-tenant member status through the `membership` module interface), group pricing.
- Tests: usage limits under concurrency, rounding in cents, expiry.

### Task 7.3 — Bank transfer & purchase orders (AC-08)
- Pay-by-invoice and purchase-order flows with payment terms; manual validation in the admin; reminders via jobs.

### Task 7.4 — Invoices & credit notes (AC-09)
- Invoicing per the M4 decision: gapless numbering per legal entity, mandatory mentions, VAT per accountant guidance, PDF by the worker, credit notes for refunds, e-invoicing path.
- Manual: [PO/accountant] review a generated synthetic invoice and credit note.

### Task 7.5 — Purchase funnel measurement (DA-02)
- Server-side events for each funnel step and abandonment; no client-side e-commerce tracking.

---

# M8 — Academy: minimal LMS

**Goal:** the full chain of Stratégie §7.2 works with one pilot course: trainer drafts → review → publish → purchase → access → invoice.
**Exit criteria:** AC-03, AC-04, AC-13, AC-18, AC-19, AC-20, AC-21 on recette; pilot course completed end to end.
Reuse what the Essai 5 spike validated; rebuild cleanly (spike code is not merged).

### Task 8.1 — Course structure & lesson content
- Courses, modules, lessons; Lexical blocks per `01_ARCHITECTURE.md` §12; disabled VLAB placeholder block.

### Task 8.2 — Enrollment & access control (AC-03, AC-13)
- Enrollment granted by `order.paid`; access duration rules (PO); private materials via signed URLs after access check.
- Tests: no access without enrollment, expired access, other tenant, direct file URL.

### Task 8.3 — Learner space (AC-04)
- My trainings, progress per lesson, resume where I left off, materials, my invoices.

### Task 8.4 — Trainer workflow (AC-18 → AC-21)
- Staff-created trainer accounts; trainers edit only their own draft courses; submit for review; review comments; changes requested; publish by staff only; version history.
- Tests: trainer cannot publish, cannot see other trainers' courses, cannot change prices.

### Task 8.5 — Markdown import & export (ADR-009)
- Admin import of Markdown into a draft lesson; scheduled export of published content to R2.

### Task 8.6 — Pilot course end to end [PO]
- Run the complete chain with a pilot course on recette; write the trainer guide draft (`docs/guides/trainer.md`, French).

---

# M9 — Academy launch & data foundation

**Goal:** the academy is live; the data plan starts producing dashboards.
**Exit criteria:** academy in production; DA-05, DA-07, DA-08, DA-09 operational; restore drill passed.

### Task 9.1 — Learning events & retention jobs (DA-03, DA-09)
### Task 9.2 — Analytics database & nightly pseudonymised copy (DA-07)
### Task 9.3 — Metabase (DA-08) — container with memory limit, read-only role, behind Cloudflare Access; dashboards built by the data analyst [HUMAN]
### Task 9.4 — Training-organization result indicators (DA-05) [PO]
### Task 9.5 — Academy launch hardening & go-live [HUMAN] — same checklist as Task 5.9, plus load test on session booking and checkout

---

# M10 — LMS enriched

AC-11 quizzes and end-of-module evaluation, AC-12 certificates (PDF by the worker, template from the PO), AC-16 reviews/testimonials,
AC-23 trainer space, learning statistics. Detail these tasks after M9 with the PO, using the same task format.

---

# Later (not planned yet)

- VLAB redesign and integration (VL-01…VL-06, Essai 3): `packages/auth`, local token verification, lab launch from a lesson, completion signal to progress.
- English version (TR-10), navigation across universes (TR-03), members' area (CB-06), trainer remuneration (AC-24), agenda integration (AC-17).
- Scale levers when needed: bigger VPS → replicas + shared cache handler → managed Postgres → separate VLAB server.

---

## Task definition template (for new or re-planned tasks)

```text
### Task X.Y — <Title> (<requirement IDs>) [HUMAN] [PO] [SPIKE]
Goal: one sentence.
Scope: bullet list of what is built.
Out of scope: what must not be touched.
Acceptance criteria: observable, testable statements.
Security / tenancy / personal data: specific risks and how they are covered.
Database: collections/fields/migrations expected.
Automated: tests to write and checks to run.
Manual: exact supervisor steps and expected results.
Human / PO actions: if any.
```
