# ADR-016 — Git workflow: `feat/*` → `develop` (recette) → `main` (production)

- Status: Accepted
- Date: 2026-10-18
- Source: `docs/ai/01_ARCHITECTURE.md` §3; `docs/ai/03_GIT_TESTING_PIPELINE.md` §1–§4; Stratégie §5

## Context

Two developers, one supervisor approving every task, one public repository.

## Decision

- Branches: `feat/<req-id>-<name>`, `fix/<req-id>-<name>`, `chore/<name>`, `spike/<essai>-<name>` (never merged).
- Feature PRs are squash-merged into `develop`, which deploys automatically to recette.
- `develop` → `main` uses a merge commit; production deploys after manual approval.
- No direct commits to `main` or `develop`, no force-push, no history rewriting.
- Conventional commits with a module scope.

## Consequences

- Rulesets on `main` and `develop` (PR required, CI required, no force-push, no deletion) are configured by
  the human (Task 0.6).

## Revisit when

No foreseen trigger.
