# 01 — Project Context & Architecture

Act as the senior engineer responsible for keeping this architecture coherent.

This document is the authoritative description of what we build and how it is structured.
Read the sections relevant to the current task. If a task seems to require breaking a rule
written here, STOP and explain the conflict to the supervisor instead of working around it.

---

## 1. The project in one page

UpWilling (Suresnes, France) runs three related web presences:

| Site | Nature | Legal entity | Status in this project |
|---|---|---|---|
| `upwilling.fr` | Academy / training center: embedded systems & Linux training, mentoring, coaching. Sells online courses and inter/intra-company sessions. | UpWilling (company, training organization) | **In scope** |
| `careerboost.upwilling.fr` | UpWilling Career Boost, association loi 1901: mission, membership, donations, news, volunteers. | The association | **In scope** |
| `vlab.upwilling.fr` | VLAB: remote access to embedded hardware from the browser. | Partnership | **Out of scope** (see §15) |

Starting point: nothing to migrate. Each site currently shows a WordPress "under construction" page
that stays online until that site's launch. We build from a blank page.

Team and constraints:

- Two half-time student developers (~2.5 person-days per week each), a Product Owner (PO),
  a content writer (Khawla BEN JEMAA, AI-assisted), and later a data analyst profile.
- Low traffic at first. Monthly hosting budget must stay small.
- Priorities, in order: correctness and security, user-perceived speed, fault isolation,
  low maintenance cost, ability to scale later without rewrites.

---

## 2. Source documents and precedence

Human: store the source PDFs in `docs/sources/`.

Precedence, highest first:

1. ADRs in `docs/decisions/` (most recent wins).
2. This file.
3. *Stratégie web unifiée* v2.1 (October 2026).
4. *Phase 0 — Analyse et décision*, including Annexe A (requirements).

**Superseded, do not follow:** "Upwilling — Guide technique v2.0" and "Upwilling — L'essentiel technique".
They describe Vercel Hobby, Neon, one repo per product, a separate "Compte" project with Better Auth,
and a different Career Boost scope. None of that applies.

**Requirement IDs.** Use the Annexe A identifiers everywhere (branch names, commits, tests, docs):
`AC-xx` academy, `CB-xx` Career Boost, `VL-xx` VLAB (deferred), `TR-xx` cross-cutting, `DA-xx` data.

---

## 3. Decisions (summary)

Each decision gets an ADR file in `docs/decisions/ADR-XXX-short-title.md` during Milestone 0.
Format: context, decision, consequences, revisit-when.

| ADR | Decision | Main reason | Revisit when |
|---|---|---|---|
| 001 | Monorepo with pnpm workspaces + Turborepo | Two half-time devs; one design system version for all sites; atomic changes | Never likely |
| 002 | One Next.js + Payload 3 application serves both sites (multi-tenant) | One codebase, one admin, shared accounts | If Essai 4 fails → two apps in the same monorepo sharing packages |
| 003 | One VPS (8 GB RAM minimum), Docker Compose, Caddy, Cloudflare DNS/CDN in front | Commercial use excludes free PaaS tiers; cheapest controllable option; Docker required | Traffic or availability needs grow |
| 004 | One Docker image, several container roles (web per site, cms, worker) | Fault isolation at the price of one codebase | Need for horizontal scaling |
| 005 | PostgreSQL: one production instance, separate databases; Payload migrations only | Simple, cheap, clear ownership | Move to managed Postgres for point-in-time recovery |
| 006 | Accounts: Payload `users` collection; session cookie on `.upwilling.fr`; admin host behind Cloudflare Access | Built-in, shared across sites, future VLAB compatibility | VLAB integration (asymmetric tokens) |
| 007 | Background jobs: Payload Jobs Queue (stored in Postgres), executed by the worker container | No Redis, no extra broker | Job volume or latency needs grow |
| 008 | Media, private files and backups on Cloudflare R2; app containers are stateless | Enables future replicas; cheap | — |
| 009 | Content source of truth = Payload (structured blocks), with Markdown import and scheduled Markdown export | Trainers are non-developers and need draft/review/publish; portability kept via export | — |
| 010 | Analytics: self-hosted Umami (cookieless, configured for CNIL consent exemption, self-assessed) + server-side domain events; Metabase deferred to Milestone 9 | Lightweight (~2 KB script vs ~46 KB), runs on our Postgres, no PHP/MariaDB | If the PO requires vendor-provided CNIL documentation → switch to Matomo behind the same `analytics` module |
| 011 | Payments: Stripe, **two separate Stripe accounts** (academy company, association) | Two legal entities must not mix revenue | — |
| 012 | Email: Brevo transactional, sent only from worker jobs; Mailpit locally | Free tier, never blocks requests | Volume > free tier |
| 013 | Error tracking: Sentry free tier, EU data region, PII scrubbing; external uptime monitor | Cheap, independent from the VPS | — |
| 014 | Localization: French default; Payload localization enabled from day one with `fr` (+ `en` declared, unused) | TR-10 (English, "souhaité") without a later data migration. Verify the cost in M3 | If it adds real complexity → ADR to disable |
| 015 | VLAB out of scope; integration contract reserved | VLAB needs a redesign first | VLAB redesign done |
| 016 | Git: `feat/*` → `develop` (auto-deploy to recette) → `main` (production after manual approval) | Matches Stratégie §5 | — |
| 017 | Recette (staging) on the same VPS as production, isolated compose project, own Postgres container, lower memory limits, **separate registrable domain** | Cheapest option; separate domain prevents production cookies leaking to recette | Recette load disturbs production |

---

## 4. Repository layout

```text
Upwilling/
├─ CLAUDE.md
├─ apps/
│  └─ web/                         Next.js + Payload (both sites, admin, worker entry)
│     ├─ src/
│     │  ├─ app/
│     │  │  ├─ (frontend)/         public routes; tenant resolved from host
│     │  │  ├─ (payload)/          Payload admin + API routes (generated layout)
│     │  │  └─ api/                health, readiness, internal revalidation, webhooks
│     │  ├─ modules/               bounded contexts (see §7)
│     │  ├─ jobs/                  worker entry point + task registry
│     │  ├─ lib/                   errors, logger, env, http helpers, request context
│     │  ├─ proxy.ts / middleware.ts  (name depends on the installed Next.js version)
│     │  └─ payload.config.ts
│     ├─ tests/                    integration + e2e (unit tests sit next to code)
│     └─ Dockerfile
├─ packages/
│  ├─ config/                      shared tsconfig, eslint, prettier presets
│  └─ design-system/               tokens (base + brands), generated CSS, React components, brand assets
├─ infra/
│  ├─ local/compose.yaml           postgres, mailpit, (umami)
│  └─ server/                      compose.production.yaml, compose.recette.yaml, Caddyfile, scripts/
├─ docs/
│  ├─ ai/                          these prompts
│  ├─ decisions/                   ADRs
│  ├─ progress/STATUS.md           live handoff file
│  ├─ phase0/                      Essai reports
│  ├─ runbooks/                    server setup, deploy, rollback, restore, incident
│  ├─ analytics/                   event catalogue, CNIL self-assessment
│  ├─ integrations/                stripe.md, brevo.md, umami.md, r2.md (verified requirements)
│  └─ sources/                     source PDFs (human)
├─ .github/workflows/
├─ turbo.json
├─ pnpm-workspace.yaml
└─ package.json
```

Reserved for later, do NOT create now: `apps/vlab/`, `packages/auth/` (token verification for VLAB).

---

## 5. Runtime topology

### 5.1 Containers (production)

| Container | Image | Role env | Serves | Notes |
|---|---|---|---|---|
| `caddy` | caddy | — | TLS, routing by host, security headers, basic auth on recette | Only container exposing ports 80/443 |
| `web-upwilling` | app | `APP_ROLE=web`, `SITE=upwilling` | `upwilling.fr` public pages, server actions, account pages | Rejects other hosts; blocks admin routes |
| `web-careerboost` | app | `APP_ROLE=web`, `SITE=careerboost` | `careerboost.upwilling.fr` | Same |
| `cms` | app | `APP_ROLE=cms` | `admin.upwilling.fr` (Payload admin + API), `hooks.upwilling.fr` (webhooks only) | Editors never slow down public sites |
| `worker` | app | `APP_ROLE=worker` | Nothing (no HTTP except an internal health port if needed) | Runs the Payload Jobs Queue: emails, PDFs, webhook processing, exports, retention |
| `postgres` | postgres (pinned major) | — | Databases `app`, `umami` (later `analytics`) | Not exposed publicly |
| `umami` | umami | — | Umami dashboard (behind Cloudflare Access) + tracker endpoint | Tracker proxied first-party through each site path |

Recette runs the same set as a separate compose project (`upwilling-recette`) with its own Postgres
container, its own volumes, its own secrets and lower memory limits.

Starting memory limits (tune after measurement): web 384–512 MB each, cms 512 MB, worker 384 MB,
postgres 1 GB, umami 256 MB, caddy 64 MB; recette roughly 60 % of these.
Metabase (M9) adds ~1.5 GB. An 8 GB VPS fits all of this; move to 16 GB when VLAB or load arrives.

### 5.2 Hostnames

Production:

| Host | Routed to |
|---|---|
| `upwilling.fr` (`www.` redirects to apex) | `web-upwilling` |
| `careerboost.upwilling.fr` | `web-careerboost` |
| `admin.upwilling.fr` | `cms` (behind Cloudflare Access) |
| `hooks.upwilling.fr` | `cms`, only `/api/webhooks/*`, everything else 404 |
| `stats.upwilling.fr` | `umami` dashboard (behind Cloudflare Access) |
| `vlab.upwilling.fr` | not routed by this project |

Recette: same structure on a **separate registrable domain** chosen by the human
(example: `upwilling-recette.fr` → `www.`, `careerboost.`, `admin.`, `hooks.`, `stats.`).
Reason: the production session cookie is set on `.upwilling.fr`; any `*.upwilling.fr` recette host
would receive production session cookies. All recette hosts send `X-Robots-Tag: noindex, nofollow`
and are protected by basic auth or Cloudflare Access.

Local: `upwilling.localhost:3000`, `careerboost.localhost:3000`, `admin.localhost:3000`
(modern browsers resolve `*.localhost` to 127.0.0.1). Locally, cookies are host-only;
cross-site shared sessions are verified on recette.

### 5.3 Roles inside one image

- The Next.js request proxy/middleware enforces the role:
  - `web`: only the hosts of `SITE`; admin and Payload API routes return 404, except the explicit public endpoints the site needs.
  - `cms`: only the admin and hooks hosts; on `hooks.*` only `/api/webhooks/*`.
- The worker is a separate Node entry point (`src/jobs/worker.ts`, compiled into the image) that
  initialises Payload through its Local API and runs the jobs queue in a loop. It never serves pages.
- `GET /api/health` = liveness (no dependency checks). Used by Docker healthchecks,
  so a database outage never causes restart storms.
- `GET /api/ready` = readiness (database + critical config). Used by deploy smoke tests and the uptime monitor.

### 5.4 Cache revalidation across containers

Public pages are cached inside each web container. Payload hooks run in the `cms` container,
so they cannot revalidate another process's cache directly.

Rule: editorial `afterChange`/`afterDelete` hooks enqueue a `revalidate` job (or call directly with retry)
that sends `POST http://web-<site>:3000/api/internal/revalidate` over the private Docker network,
with a shared secret header and a list of cache tags. Tags follow `tenant:collection:id-or-slug`.
When we later run several replicas per site, we switch to a shared Next.js cache handler (Redis) — not before.

---

## 6. Multi-tenancy

- Tenants: `upwilling` and `careerboost`. Stored in a `tenants` collection; slugs are immutable.
- Use the official Payload multi-tenant plugin (verify its current API). If it cannot express
  a rule we need, document the gap in the Essai 4 report before writing custom code.
- **Tenant resolution:** from the request host only, via a static, validated host→tenant map in config.
  Unknown host → 404. Never from query strings, bodies, cookies or client state.
- Collections are tenant-scoped by default (pages, news, navigation, media, forms, catalog, orders, memberships, courses…).
  Not tenant-scoped: `users`, `tenants`.
- Staff users are assigned to one or more tenants. A Career Boost volunteer editor never sees academy data (Essai 4 criterion).
- Per-tenant settings (tenant-scoped settings document): site name, logos, contact addresses, email sender name,
  social links, Umami website ID, legal entity details (company name, SIRET, address, VAT number,
  training organization declaration number for the academy), feature flags / kill switches.
- **Secrets are never stored in the database.** Per-tenant secrets are environment variables, e.g.
  `STRIPE_SECRET_KEY__UPWILLING`, `STRIPE_WEBHOOK_SECRET__CAREERBOOST`.
- Theme: the tenant selects the brand tokens (`data-brand` attribute on `<html>`). Never a hard-coded color in a page.
- Every tenant-scoped collection gets an isolation test: read, create, update and delete across tenants must fail.

---

## 7. Modules (bounded contexts)

These are the "services" of the system, implemented as modules inside one application.
Each module could later be extracted into its own service because its boundary is respected today.

| Module | Owns | Milestone |
|---|---|---|
| `core` | tenancy, users & roles, access helpers, settings, feature flags, domain events bus, request context | M0–M3 |
| `content` | pages (block builder), navigation, footer, media, news/blog, legal pages, SEO, redirects | M3–M5 |
| `forms` | contact, volunteer applications (CB-07), intra-company requests (AC-07), anti-bot, retention | M5–M6 |
| `membership` | membership plans, memberships, donations, receipts (association) | M5 |
| `catalog` | trainings, sessions, seats & waitlist, trainers' public profiles (academy) | M6 |
| `commerce` | orders, Stripe checkout, payments, bank transfer / purchase orders, invoices, credit notes, promo codes | M5 (association minimal) / M7 |
| `lms` | courses, modules, lessons, enrollments, progress, review workflow, quizzes, certificates | M8–M10 |
| `notifications` | email templates, sending jobs, delivery logging | M3+ |
| `analytics` | Umami integration, server-side domain events, exports | M5+ |

Module folder:

```text
modules/<name>/
  collections/   Payload collection/global configs owned by this module
  services/      domain logic, as pure as possible
  server/        server actions, route handlers (thin)
  components/    UI specific to this module
  jobs/          job task definitions
  index.ts       public interface — the ONLY import path for other modules
```

Rules:

- Another module imports only from `modules/<name>/index.ts`. Enforce with an ESLint boundary rule.
- Payload relationship fields between modules are allowed (the admin needs them), but business logic that
  reads or changes another module's data goes through that module's exported functions.
- Cross-module side effects go through domain events: `commerce` emits `order.paid`; `lms` grants access,
  `catalog` confirms the seat, `membership` activates the membership, `notifications` sends the receipt.
  Side effects that must be atomic with the write stay in the same transaction; everything else is a job.
- `core` depends on nothing. Feature modules depend on `core`. No dependency cycles.

---

## 8. Identity, roles and access

Roles:

| Role | Who | Can |
|---|---|---|
| `superAdmin` | UpWilling technical admins | Everything |
| `staff` (`editor` or `manager`, per tenant) | UpWilling team, association volunteers | Content and operations of their tenants only |
| `trainer` | Contracted trainers (academy only) | Created by staff only (AC-18). Draft and edit **their own** courses, submit for review, never publish (AC-19, AC-20) |
| public account | Learners, members, donors | Their own profile, orders, enrollments, memberships. No admin access |

Learner, member and donor are relationships (enrollment, membership, donation), not admin roles.

Rules:

- Deny by default. Every collection defines `read`, `create`, `update`, `delete` and admin access explicitly.
  Sensitive fields get field-level access.
- Payload's Local API bypasses access control by default. When code acts on behalf of a request,
  always pass `user` and `overrideAccess: false`. Code that legitimately runs as the system (jobs, webhooks)
  documents why in a comment.
- One account across both sites (Stratégie §8). **PO/legal decision pending:** the academy and the association
  are two legal entities. Default until decided: shared credentials and basic profile; tenant-specific data
  (orders, memberships, donations) visible only to that tenant's staff; the sign-up form and privacy notices explain this.
- Session cookie: `Domain=.upwilling.fr` in production (host-only locally), `HttpOnly`, `Secure`, `SameSite=Lax`.
  CSRF origin allowlist configured. Login rate limiting and lockout. Email verification before any purchase,
  membership or donation. Minimum password length 12.
- Admin host behind Cloudflare Access (free plan) in addition to Payload login. Payload has no built-in second factor;
  verify current options before adding a plugin.
- VLAB (later) will verify the Payload session token itself, without calling the site. Do not build this now.

---

## 9. Data and persistence

- Production Postgres container with databases `app` and `umami` (later `analytics`). Pin the major version
  after checking what Payload's Postgres adapter supports.
- Every schema change is a committed Payload migration. Development may use schema push locally, but a task that
  changes the schema is not done until its migration exists and runs on a clean database. CI fails on pending schema changes.
- Deploy order: backup → run migrations (one-off container) → switch containers. Breaking changes use
  expand → migrate data → contract across several deploys.
- Use real constraints: unique keys for business rules (Stripe event ID, order idempotency key, one active
  membership per period, one seat per person per session), foreign keys, check constraints where useful.
- Multi-row business operations run in one transaction (seat booking, order → enrollment).
  Seat booking must stay correct under concurrency: lock or conditional update, plus a concurrency test.
- Media in R2 through the Payload storage adapter. Private files (course materials, invoices, CVs,
  trainer qualification documents AC-25) live in a private bucket and are served through short-lived
  signed URLs after an access check.
- Backups: nightly `pg_dump` of every production database, encrypted, uploaded to R2, 35-day retention
  (TR-08, to confirm with PO). R2 media protected by a second copy or lifecycle versioning.
  A real restore into recette is performed at M1 and then quarterly.

---

## 10. Fault isolation (requirements)

1. **Process level.** Each container has `restart: unless-stopped`, a liveness healthcheck, a memory limit and log rotation.
2. **Page level.** Every route segment that can fail has an `error.tsx`; a `global-error.tsx` exists; `not-found.tsx` per site.
3. **Block level.** Independent page blocks that fetch their own data are wrapped in `<Suspense>` plus an error boundary with a small fallback.
4. **Dependency level.** Every external call (Stripe, Brevo, R2, Umami, future VLAB) has a timeout, a typed error and a fallback.
5. **Async by default.** Anything the visitor does not need in the response goes to the jobs queue
   (emails, PDFs, webhook processing, exports, analytics forwarding). Webhooks verify, persist the raw event
   with its unique provider ID, acknowledge fast, then process in a job, idempotently.
6. **Cache as a safety net.** Public pages are static or incrementally regenerated; if revalidation fails,
   the last good version keeps being served.
7. **Kill switches.** Per-tenant feature flags editable in the admin (checkout, membership, donations,
   registrations, forms). When off, the UI shows a friendly French message and an alternative (contact, invoice request).

Expected degradation:

| Failure | Visitor experience |
|---|---|
| Brevo down | Nothing visible; emails queued and retried |
| Stripe down | "Paiement momentanément indisponible", alternative proposed; browsing works |
| Worker down | Pages work; jobs wait and catch up |
| `cms` down | Editors blocked; public sites unaffected |
| One web container down | Only that site; Docker restarts it |
| Postgres down | Cached public pages still served; login, checkout, forms show a maintenance message |
| VPS down | Everything down; external monitor alerts; restore from backups (accepted risk at launch) |

---

## 11. Performance

Budgets (mobile, 4G, p75): LCP ≤ 2.5 s, CLS ≤ 0.1, INP ≤ 200 ms.
Cached public pages: server response ≤ 200 ms from France. Lighthouse performance ≥ 90 on key pages, checked in CI.

Rules:

- Public content pages are static or incrementally regenerated, revalidated by tag on publish.
- Personal parts (account menu, cart, progress) are dynamic islands streamed with `<Suspense>`.
- No client-side fetching for editorial content.
- `next/image` with modern formats and explicit sizes; `next/font` self-hosted fonts.
- Minimal client JavaScript on marketing pages. No animation library for effects CSS can do.
- Database: indexes for real query patterns, explicit Payload `depth`, select only needed fields, pagination everywhere.
- Cloudflare caches static assets. HTML edge caching for anonymous visitors is a later optimisation, not a default.

---

## 12. Content model (ADR-009)

Decision: Payload is the single source of truth for all content, including course content.

Why: trainers are not developers and need draft → review → publish with comments and version history
(AC-19, AC-20, AC-21); the PO needs everything editable without a developer (TR-14).
The portability concern from Phase 0 Q3 is handled by export, not by storing content in Git.

Rules:

- Rich text uses Payload's Lexical editor with an explicit whitelist of features and custom blocks:
  code block (language + filename), callout (info/warning/tip), figure (image + caption + alt required),
  video embed (allowlisted providers), downloadable resource (private file, access-checked),
  and later quiz reference and VLAB lab (disabled placeholder until VLAB integration).
- No raw HTML blocks.
- Versions and drafts are enabled on every editorial collection. Live preview where useful.
- **Markdown import:** a tool (admin action or CLI) that converts existing course material from Markdown into Lexical.
- **Markdown export:** a scheduled job exports published content (Markdown + front-matter + asset manifest) to R2,
  so content can be reused for slides or handouts and survives a tool change.
- Verify the current Lexical ↔ Markdown conversion utilities in Payload's docs before implementing.

---

## 13. Analytics and measurement (ADR-010)

- **Umami**, self-hosted, cookieless. The tracker script is served first-party (proxied path on each site).
  Configuration follows the CNIL consent-exemption criteria (strictly audience measurement, publisher's exclusive account,
  anonymous statistics, limited retention). The CNIL no longer publishes a list of exempt tools: we fill the CNIL
  self-assessment ourselves in `docs/analytics/cnil-self-assessment.md`. The PO validates it.
- What we do NOT do client-side: link analytics to a user account, e-commerce tracking tied to a visitor,
  session replay, heatmaps, A/B testing. Those fall outside the exemption.
- **Server-side domain events** cover business funnels (DA-02, DA-03, DA-06): an append-only `analytics_events` table
  in the app database with `occurred_at`, `tenant`, `event_name`, a pseudonymous subject hash (HMAC with a server secret),
  and whitelisted properties (no free text, no PII).
- Event names are defined in `docs/analytics/events.md`, which the data analyst validates (Phase 0 §8.3 deliverable).
- Retention and anonymisation per DA-09 are implemented as scheduled jobs.
- The separate analytics database, nightly copy and Metabase dashboards come in Milestone 9.

---

## 14. Payments, invoicing, membership (principles)

- Two Stripe accounts: academy (company) and association. Keys per tenant in environment variables.
- Stripe Checkout (hosted). No card data ever touches our servers.
- Webhooks at `hooks.upwilling.fr/api/webhooks/stripe/<tenant>`: verify signature, store the event with a unique
  constraint on the Stripe event ID, acknowledge, process in a job, idempotently.
- Invoices (academy): one numbering sequence per legal entity, chronological and without gaps; mandatory legal mentions;
  VAT handling to be confirmed by an accountant (training may be VAT-exempt under conditions); credit notes for refunds.
- French e-invoicing reform: receiving is mandatory since September 2026; issuing becomes mandatory for SMEs and
  micro-companies in September 2027. The invoicing path chosen after Essai 6 must be compatible.
- Association: membership receipts (not invoices). Tax receipts for donations only if the PO confirms eligibility.

---

## 15. VLAB (out of scope)

- Do not create `apps/vlab`, import VLAB code, design VLAB screens or write VLAB integration code.
- Essai 3 (VLAB integration) and VL-01…VL-06 are postponed until VLAB is redesigned. The PO has been informed.
- Reserved so that integration stays easy later: hostname `vlab.upwilling.fr`, session cookie on `.upwilling.fr`,
  a future `packages/auth` for local token verification, a disabled "VLAB lab" lesson block, reserved analytics event names.

---

## 16. Environments

| | Local | Recette (staging) | Production |
|---|---|---|---|
| Where | Developer machine | Same VPS, compose project `upwilling-recette` | Same VPS, compose project `upwilling-prod` |
| Domain | `*.localhost` | Separate domain (§5.2) | `upwilling.fr` and subdomains |
| Data | Synthetic seed | Synthetic seed + restore tests | Real |
| Stripe | Test mode | Test mode | Live mode |
| Email | Mailpit | Brevo with recette sender, or Mailpit-style sink | Brevo |
| Deploy | — | Automatic on merge to `develop` | Manual approval after merge to `main` |
| Access | Developers | Team + PO + management, password-protected | Public |

Until a site launches, production containers may run on a non-public test hostname;
the real DNS switch for each site is a human action at that site's launch.

---

## 17. Open questions for the PO (track answers in ADRs)

1. Recette domain to buy (§5.2).
2. Shared accounts across two legal entities (§8).
3. VAT status of training; invoicing tool (after Essai 6).
4. Membership categories and amounts (CB-02); donation tax receipts (CB-04).
5. Brand source files: logos, exact colors (TR-01b), fonts (see `04_DESIGN_SYSTEM.md`).
6. Backup retention (TR-08), accessibility target (TR-07), performance thresholds (TR-12).
7. Whether to replace the WordPress "under construction" pages with branded ones before launch (TR-13).
8. Answers to Phase 0 questions Q1 (VLAB as internal tool or product) and Q2 (e-learning vs live sessions) — they size the LMS.
