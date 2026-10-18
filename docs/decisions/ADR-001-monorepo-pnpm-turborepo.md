# ADR-001 — Monorepo with pnpm workspaces and Turborepo

- Status: Accepted
- Date: 2026-10-18
- Source: `docs/ai/01_ARCHITECTURE.md` §3, §4

## Context

Two half-time student developers build two sites that must share one visual identity (Stratégie §4)
and one back-office. Separate repositories would mean versioning and releasing the design system
and shared configuration independently, and coordinating changes across repositories.

## Decision

One Git repository (`akramnemri/Upwilling`) managed as a pnpm workspace, with Turborepo orchestrating
tasks (`dev`, `build`, `typecheck`, `lint`, `test`, `e2e`) and caching their results.
Layout: `apps/web` (the application), `packages/config` (shared tooling presets),
`packages/design-system` (tokens and components), `infra/`, `docs/`.

## Consequences

- A change to a token or a shared component lands in both sites in one atomic PR.
- One lockfile, one CI pipeline, one place to upgrade dependencies.
- Package boundaries must be kept clean (no deep imports into another package's internals).
- Turborepo becomes a build dependency; its cache must be configured in CI (Task 0.6).

## Revisit when

Unlikely to change. Only if a product (e.g. VLAB) needs an independent release cycle owned by another team.
