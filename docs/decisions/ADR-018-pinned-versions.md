# ADR-018 — Pinned toolchain and framework versions

- Status: Accepted (supervisor merged PR #1, 2026-10-18; lint tooling rows added in Task 0.2; CI tooling added in Task 0.6)
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
| esbuild | **0.28.2** (devDependency of `apps/web`) | 0.28.2 (2026-08-08) | Bundles the worker and the Docker healthcheck into single CommonJS files (Task 1.1b, decision D4). Its install script is not run (`allowBuilds: esbuild: false`): the platform binary comes from an optional dependency. |

### CI tooling (added in Task 0.6, verified 2026-10-18 from each project's latest GitHub release)

GitHub Actions are pinned to the **full commit SHA** of the release tag (tags can be moved, a SHA cannot),
with the version in a trailing comment. Upgrades are `chore(ci)` PRs that update SHA and comment together.

| Action / tool | Version | Commit SHA / digest | Notes |
|---|---|---|---|
| `actions/checkout` | **v7.0.1** | `3d3c42e5aac5ba805825da76410c181273ba90b1` | `persist-credentials: false`. |
| `pnpm/action-setup` | **v6.1.0** | `ea17c68df8912ef543352723c149a84f56e3d413` | Reads pnpm's version from `packageManager`. |
| `actions/setup-node` | **v7.1.0** | `949feb2413d6458794dcd2491c4babbbce0c15c1` | Node from `.nvmrc`; pnpm store cache. |
| `actions/cache` | **v6.1.0** | `55cc8345863c7cc4c66a329aec7e433d2d1c52a9` | Turborepo local cache (`.turbo/cache`). |
| `actions/upload-artifact` | **v7.0.2** | `cf430e030ddbb5b0abf93d22962f4752f3646cd9` | Playwright report, on failure only. |
| shellcheck (Docker image `koalaman/shellcheck`) | **v0.11.0** | `sha256:61862eba1fcf09a484ebcc6feea46f1782532571a34ed51fedf90dd25f925a8d` | Lints every `*.sh` in the repository (Task 1.3). Latest release (2025-08-04). |
| gitleaks (Docker image `ghcr.io/gitleaks/gitleaks`) | **v8.30.1** | `sha256:c00b6bd0aeb3071cbcb79009cb16a60dd9e0a7c60e2be9ab65d25e6bc8abbb7f` | Run directly instead of `gitleaks-action` (fewer third-party parts, no licence question). |

### Container base image (added in Task 1.1b, verified 2026-10-19)

| Image | Tag | Digest (multi-arch index) | Notes |
|---|---|---|---|
| Node.js | **`node:24.22.0-trixie-slim`** | `sha256:7f486cabe892bff8fef04c0f7da8dba84a560be3e4e2740b7a86afc57ebec315` | Build and runtime stages of `apps/web/Dockerfile` (decision D3). Debian 13 slim; 24.22.0 is the latest Node 24 release (2026-10-14). Upgrades are `chore(deps)` PRs that change tag and digest together. |

### Server stack images (added in Task 1.4, verified 2026-10-20)

| Image | Tag | Digest (multi-arch index) | Notes |
|---|---|---|---|
| Caddy | **`caddy:2.11.7-alpine`** | `sha256:d8542f48d34a9cf4e4c11a478865229840e87e4c96ea3f439101f31a5d35f75f` | Edge proxy, `infra/server/compose.edge.yaml` (ADR-023). Latest release (2026-10-03). Stock image: no plugins needed. |
| PostgreSQL | **`postgres:18.6-trixie`** | `sha256:74935e72241653ca55e0414067e6d8763aceb8a810eb51b452253ec3dcfc4336` | One per stack, `infra/server/compose.base.yaml` (ADR-005). 18.6 is the current minor of the current major. |
| curl (test only) | **`curlimages/curl:8.23.0`** | `sha256:a134550be58ab783810e613ae96fd253c38f7bdd16d9bf9be350700c7a29ac06` | Client of `infra/server/test/smoke-stacks.sh` (presents the test client certificate). Never deployed. |
| Docker CLI | **`docker:29.9.1-cli`** | `sha256:6fae2214c3121a28d5aa639d09032f61310b7c9c75ffbad1025f261a1b621800` | Deploy agent, `infra/server/compose.deploy-agent.yaml` (ADR-024; added 2026-10-20). Includes Compose v5.6.0 and buildx. |
| Registry (test only) | **`registry:3.1.2`** | `sha256:ddf754342cfc8acc51a56d5d0ab6af06826461864460636d8bd5c546dab2a7b8` | Stand-in for GHCR in `infra/server/test/smoke-deploy.sh` (added 2026-10-20). Never deployed. |

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
