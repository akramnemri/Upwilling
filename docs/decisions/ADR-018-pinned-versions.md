# ADR-018 — Pinned toolchain and framework versions

- Status: Accepted (supervisor merged PR #1, 2026-10-18; lint tooling rows added in Task 0.2)
- Date: 2026-10-18
- Verified on: 2026-10-18, from official sources only (no remembered versions)

## Context

`CLAUDE.md` forbids trusting remembered versions. Payload 3 constrains the Next.js and React versions it
supports, so Payload is the anchor: everything else is chosen to match what Payload officially supports
and what Payload itself builds and tests with.

Sources used:

- npm registry metadata (`npm view <pkg> version time peerDependencies engines`).
- Node.js: `https://nodejs.org/dist/index.json` and the release schedule
  `https://github.com/nodejs/Release/blob/main/schedule.json`.
- Payload repository at tag `v3.91.0`: root `package.json`, `.tool-versions`, `pnpm-workspace.yaml` (catalog),
  `templates/blank/package.json`, `.github/workflows/main.yml`.

## Decision

Versions are pinned **exactly** in `package.json` (no `^`), so the lockfile and every environment agree.
Upgrades are deliberate PRs (`chore(deps)`), never drive-by changes.

| Tool / package | Pinned | Latest seen | Why this version |
|---|---|---|---|
| Node.js | **24.x LTS** (24.22.0; `.nvmrc` = `24`, Docker `node:24-*`) | 26.12.0 (Current, LTS on 2026-10-28) | Node 24 "Krypton" is LTS, supported until 2028-04-30. Payload builds with Node 24.13.0 (`.tool-versions`). Payload requires `>=20.18.1`. |
| pnpm | **11.28.6** (`packageManager` field) | 12.14.0 | Payload uses pnpm 11.9.0; its template declares `pnpm: ^9 \|\| ^10 \|\| ^11`. pnpm 12 is not in that range. |
| Turborepo (`turbo`) | **2.11.9** | 2.11.9 | Latest; requires Node `>=20`. |
| Payload (`payload`, `@payloadcms/*`) | **3.91.0** (all `@payloadcms/*` packages in lockstep) | 3.91.0 (2026-10-15) | Latest Payload 3. Installed in Task 3.1, re-verified then. |
| Next.js | **16.3.8** | 16.4.2 (16.4.0 released 2026-10-06) | `@payloadcms/next@3.91.0` peer range: `>=15.2.9 <15.3.0 \|\| >=15.3.9 <15.4.0 \|\| >=15.4.11 <15.5.0 \|\| >=16.3.3 <17.0.0`. Payload's blank template ships 16.3.3; 16.3.8 is the latest patch of that tested line. 16.4.x is allowed by the range and can be adopted in a later `chore(deps)` PR. |
| React / React DOM | **19.2.9** | 19.3.1 | Payload peer range `^19.0.1 \|\| ^19.1.2 \|\| ^19.2.1`; Payload builds and tests with 19.2.6. 19.2.9 is the latest patch of that line. |
| TypeScript | **5.9.3** | 7.0.2 | Payload builds with 5.7.3 and its template ships 5.7.3. TypeScript 7 (new major) is not used by Payload yet; ESLint/typed-lint compatibility unverified. |
| Tailwind CSS (`tailwindcss`, `@tailwindcss/postcss`) | **4.3.3** | 4.3.3 | Latest v4 (released 2026-07-16). Used from Task 2.1. |
| Vitest | **4.1.12** | 5.0.5 (5.0.0 released 2026-09-03) | Payload's template uses Vitest 4 (4.0.18). Vitest 4.1.x is still patched (4.1.12 on 2026-10-15). Vitest 5 can be adopted later. |
| Playwright (`@playwright/test`) | **1.64.1** | 1.64.1 | Latest. Next.js peer accepts `^1.51.1`. |
| Storybook (`storybook`, `@storybook/nextjs-vite`) | **10.6.2** | 10.6.2 | Latest; `@storybook/nextjs-vite` peer accepts Next `^16`. Used from Task 2.3; framework choice confirmed then. |
| Zod (runtime validation, 02 §1) | **4.6.7** | 4.6.7 | Proposed schema library for env, route input and webhooks. Installed in Task 0.3. |
| ESLint (`eslint`, `@eslint/js`) | **9.39.5** | 10.13.0 | `eslint-config-next@16.3.8` bundles `eslint-plugin-react`, `-import` and `-jsx-a11y`, whose peer ranges stop at ESLint 9. Payload's template uses ESLint 9. (Added in Task 0.2.) |
| `eslint-config-next` | **16.3.8** | — | Same version as Next.js. |
| `typescript-eslint` | **8.71.2** | 8.71.2 | Latest; supports TypeScript `<6.1`. |
| Prettier | **3.9.10** | 3.9.10 | Latest. |
| `@types/node` / `@types/react` / `@types/react-dom` | **24.19.2 / 19.2.18 / 19.2.7** | — | Latest patches of the Node 24 and React 19.2 lines. |
| Database | **not pinned** | — | Placeholder; see ADR-005. |

## Consequences

- Dependabot or manual upgrade PRs must keep `@payloadcms/*` in lockstep and stay inside Payload's
  Next.js/React peer ranges.
- Each later task that installs one of these packages re-checks the registry and notes any newer patch.
- The TypeScript compiler options decision (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  02 §1) is taken in Task 0.2, when the tsconfig is written, and recorded in a separate ADR.

## Revisit when

- Node 26 becomes LTS (2026-10-28) **and** Payload builds with it → consider moving.
- Payload's template moves to Next 16.4, TypeScript 6+/7, Vitest 5 or pnpm 12.
- A security advisory affects a pinned version.
