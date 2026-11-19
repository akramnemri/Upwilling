# Technology stack

What the UpWilling platform is built with, at which version, and why each tool was chosen over the usual
alternatives. One page for newcomers, the PO and reviewers.

- Updated: 2026-11-19 (after Task 2.4b).
- **This page summarizes; it does not decide.** Exact pins and their sources live in
  [ADR-018](decisions/ADR-018-pinned-versions.md); each choice and its trade-offs live in its own ADR
  ([index](decisions/README.md)). If this page and an ADR disagree, the ADR wins. Update this page in the same
  PR that changes ADR-018 or adds an ADR.
- "Alternatives set aside" lists only options the ADRs actually discuss, or the reason the ADR gives for the
  choice. Nothing here is a new decision.
- Status: **in use** = installed and running in the repository today; **planned** = decided, installed in a
  later task (version re-verified then).

## 1. Application

| Technology | Version | Status | Role | Why this one | Alternatives set aside |
|---|---|---|---|---|---|
| TypeScript | 5.9.3 | in use | Language of the whole repository | One typed language from the database to the UI; strict options (ADR-019) catch errors before runtime | TypeScript 7: new major, not yet used by Payload, linting compatibility unverified (ADR-018) |
| Node.js | 24.22.0 (24.x LTS) | in use | Runtime (build, server, worker) | LTS until 2028-04-30; Payload builds with Node 24 (ADR-018) | Node 26: not LTS when chosen; revisit once Payload builds with it |
| Next.js | 16.3.8 | in use | Web framework: pages, routing, server rendering | Payload 3 runs inside a Next.js app, so one application serves sites and admin (ADR-002); 16.3.x is the line Payload tests | 16.4.x: allowed by Payload's range, later `chore(deps)` PR |
| React | 19.2.9 | in use | UI library | Required by Next.js and Payload; latest patch of the line Payload tests | 19.3: outside the line Payload tests |
| Payload CMS | 3.91.0 | planned (Task 3.1) | Back-office, content, accounts, jobs | Embedded in the same Next.js app: one codebase, one admin, accounts shared by both sites, editors draft/review/publish without code (ADR-002, ADR-009) | Two separate applications and admin panels: double the upgrade and security work for a small team (ADR-002); Markdown files as the source of truth: trainers are not developers (ADR-009) |
| Zod | 4.6.7 | in use | Validation of environment, route input, webhooks | Typed schemas checked at runtime, one definition for type and check | — |
| Lucide icons | 1.61.0 | in use | The one icon set | Open license (ISC), tree-shaken, React 19 support | — |
| Radix Tabs | 1.2.1 | in use | Accessible tabs widget | HTML has no native tabs; Radix implements the WAI-ARIA pattern (keyboard, roles) | Radix for Accordion and Dialog: native `<details>` and `<dialog>` are enough |

## 2. Design system and styling

| Technology | Version | Status | Role | Why this one | Alternatives set aside |
|---|---|---|---|---|---|
| Design tokens (in-house generator) | — | in use | One source for colors, spacing, type of both brands | Change one base value and both sites follow; Career Boost keeps its own blue (Essai 2) | — |
| Tailwind CSS (+ PostCSS 8.5.32) | 4.3.3 | in use | Styling through utility classes | Its theme is generated from our tokens, and a lint rule rejects any class or value outside them | — |
| Rubik + Nunito (Fontsource files) | 5.3.0 | in use (provisional, PO to confirm) | Brand fonts | Self-hosted with `next/font/local`: no call to Google, no layout shift; SIL OFL license | Fonts fetched from Google at build or run time: `next/font/local` keeps them on our host (ADR-018) |
| Storybook (`@storybook/nextjs-vite`) on Vite | 10.6.5 / Vite 8.3.4 | in use | Component catalogue with brand switcher and accessibility panel | Runs `next/link` and `next/image` like the app; development only | 10.6.6–10.6.7: less than two weeks old when chosen |

## 3. Quality and testing

| Technology | Version | Status | Role | Why this one | Alternatives set aside |
|---|---|---|---|---|---|
| Vitest | 4.1.12 | in use | Unit and component tests | Used by Payload's template; fast, TypeScript-native | Vitest 5: adopt in a later PR |
| Testing Library + jsdom | 16.3.3 / jsdom 30.1.3 | in use | Component tests by role and keyboard | Tests what a user or screen reader sees, not internals | jsdom 31: new major, adopt later |
| Playwright | 1.64.1 | in use | End-to-end tests and screenshot comparison | Real browser on both site hosts; same pinned container in CI so screenshots match | — |
| axe-core | 4.14.0 | in use | Accessibility checks (WCAG 2.2 AA) | In component tests and in the browser; development only | — |
| ESLint + typescript-eslint + Prettier | 9.39.5 / 8.71.2 / 3.9.10 | in use | Lint and formatting | ESLint 9 is what `eslint-config-next` and Payload support | ESLint 10: Next's bundled plugins stop at 9 |
| Stylelint | 17.16.0 | in use | Forbids raw colors and sizes in CSS | ESLint has no CSS rules | Stylelint 18: new major, adopt later |
| gitleaks, shellcheck | 8.30.1 / 0.11.0 | in use | Secret scan and shell-script lint in CI | The repository is public | `gitleaks-action`: more third-party parts |

## 4. Repository and build

| Technology | Version | Status | Role | Why this one | Alternatives set aside |
|---|---|---|---|---|---|
| pnpm workspaces | 11.28.6 | in use | Package manager, monorepo | Strict, fast installs; the version range Payload declares (ADR-001, ADR-018) | Separate repositories: the design system would need its own versioning and releases (ADR-001); pnpm 12: outside Payload's range |
| Turborepo | 2.11.9 | in use | Runs and caches typecheck, lint, test, build | Only re-runs what changed (ADR-001) | — |
| esbuild | 0.28.2 | in use | Bundles the worker and the healthcheck | Single small files in the Docker image | — |
| GitHub Actions | actions pinned by commit SHA | in use | CI: checks, visual, image build, deploy | Next to the code; a SHA cannot be moved like a tag (ADR-018) | — |

## 5. Data and services

| Technology | Version | Status | Role | Why this one | Alternatives set aside |
|---|---|---|---|---|---|
| PostgreSQL | 18.6 | in use (recette, backups); app tables with Task 3.1 | Database, one per stack | Payload's Postgres adapter; simple, cheap, clear ownership (ADR-005) | Managed Postgres with point-in-time recovery: revisit later (ADR-005) |
| Payload Jobs Queue | with Payload | planned (M3) | Background jobs (emails, PDFs, exports) in the worker | Stored in Postgres: no Redis, no extra broker (ADR-007) | A separate queue (Redis/broker): one more service to run |
| Cloudflare R2 | — | planned | Media, private files, off-site backups | Cheap, keeps containers stateless (ADR-008) | — |
| Brevo | — | planned | Transactional email, sent only from the worker | Free tier at launch; Mailpit catches mail locally (ADR-012) | — |
| Stripe (two accounts) | — | planned (M5/M7) | Payments | The company and the association are two legal entities; revenue must not mix (ADR-011) | One shared account: mixes the two entities' money |
| Umami (self-hosted) | — | planned (Task 5.8) | Audience measurement | Cookieless, aims at the CNIL consent exemption, ~2 KB script, runs on our Postgres (ADR-010) | Matomo: heavier (~46 KB, PHP/MariaDB); fallback if the PO needs vendor CNIL papers (ADR-010) |
| Sentry (EU) + uptime monitor | — | planned (Tasks 1.6b, 1.6c) | Error tracking and outage alerts | Free tier, EU data region, personal data scrubbed, independent from our server (ADR-013) | — |

## 6. Hosting and operations

| Technology | Version | Status | Role | Why this one | Alternatives set aside |
|---|---|---|---|---|---|
| Docker image, several container roles | `node:24.22.0-trixie-slim` | in use | One image runs web (per site), cms and worker | A crash in one role does not take down the others, with one codebase (ADR-004) | — |
| One VPS + Docker Compose | Compose v5.6.0 | in use (recette on the supervisor's laptop for the test phase) | Production and recette stacks | Commercial use excludes free hosting tiers; cheapest option we fully control (ADR-003) | Free PaaS tiers: not allowed for commercial use (ADR-003); Oracle Cloud free VM for the test phase (ADR-021) |
| Caddy | 2.11.7 | in use | Reverse proxy, TLS, recette password | Automatic HTTPS, simple config, stock image (ADR-003, ADR-023) | — |
| Cloudflare (DNS, CDN, origin certificate) | — | planned (when the domain is ready) | Edge in front of the server | Hides the server, TLS end to end (ADR-023) | Let's Encrypt DNS-01: a DNS-edit secret on the server; Cloudflare Tunnel: one more moving part (ADR-023) |
| GHCR + deploy agent (`docker:29.9.1-cli`) | — | in use | Images per commit; the server pulls new versions | Works behind a home router; no GitHub key with root rights on the server (ADR-024) | SSH deploys: impossible behind the router; self-hosted runner: unsafe on a public repo; Watchtower-like tools: unmaintained (ADR-024) |
| Tailscale Funnel | 1.104.2 | in use (test phase only) | Public HTTPS access to recette on the laptop | Free, no bank card, no router change (ADR-025) | Cloudflare Tunnel: needs the domain; ngrok free: one name and a warning page; port forwarding: exposes the home address (ADR-025) |
| Encrypted backups: `pg_dump` + age + rclone | age 1.2.1 / rclone 1.75.2 | in use | Nightly encrypted database dumps, tested restore into recette | Simple and enough for the roadmap's needs (ADR-026) | pgBackRest / WAL archiving: heavier than needed; GnuPG: too much machinery for one recipient (ADR-026) |

## 7. Out of scope

VLAB (`vlab.upwilling.fr`) is not part of this platform (ADR-015).
