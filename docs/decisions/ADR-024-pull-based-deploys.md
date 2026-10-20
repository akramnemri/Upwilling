# ADR-024 — Pull-based deploys: image tags + a deploy agent on the server

- Status: Proposed (Task 1.5b; the approach was accepted with the supervisor's "go" on 2026-10-20)
- Date: 2026-10-20
- Amends: `docs/ai/03_GIT_TESTING_PIPELINE.md` §12 (SSH deploy from GitHub Actions). Relates to ADR-003, ADR-020
  (deploy key), ADR-021 (Oracle VM, not available yet)
- Sources checked 2026-10-20: GitHub docs (reusable workflows, environments, GHCR visibility), Docker Hub `docker`
  and `registry` images

## Context

The domain and the server are not ready (supervisor, 2026-10-20): during the test phase the supervisor's own
machine is the server. It sits behind a home router: GitHub Actions cannot connect to it, so the SSH deploy of
03 §12 is impossible. A self-hosted GitHub runner on that machine would work, but on a **public** repository a
pull request from a fork can run its own workflow code on self-hosted runners; GitHub advises against it.

## Decision

1. **CI publishes, a tag decides.** CI publishes `ghcr.io/<owner>/upwilling-web:<commit>` (Task 1.5a). Deploying
   a stack means moving the image tag named after it, `recette` or `production`, to a published commit
   (`.github/workflows/promote.yml`). Nothing is rebuilt.
   - `develop` → `recette`: automatic, job `deploy-recette` of `ci.yml`, after every check and the publish.
   - `main` → `production`: job `deploy-production`, in the GitHub environment `production`, which requires the
     supervisor's approval.
   - Rollback: `rollback.yml` (manual) moves a tag back to an earlier published commit; production again needs
     the approval. Database rollbacks are never automatic.
2. **A deploy agent on the server pulls.** `infra/server/compose.deploy-agent.yaml` runs `deploy-agent/agent.sh`
   in a pinned `docker:cli` container with the Docker socket. Every minute it reads each stack's tag and, when it
   points to a new commit: fetches that commit's compose files, starts the stack on the image's **exact digest**
   with `up --wait`, checks `/api/ready` and `/api/version`, and on failure restores the last good release and
   remembers the failed commit (no retry loop). It keeps two releases and prunes older images.
3. **The edge networks are created beforehand** (`external` in every project, created by the agent when
   missing), so each project starts on its own; their names can be overridden for tests only.
4. Keep this model on the future VPS too unless a reason appears: it needs no inbound SSH and no deploy key in
   GitHub (ADR-020's main risk), and the same agent works behind NAT or on a public server.

## Consequences

- GitHub only learns that a tag moved; whether the deploy worked is in the agent's log on the server. Task 1.5c
  (public access) lets the workflow also poll the public `/api/version`.
- The agent can do anything Docker can on that machine (root-equivalent). It only runs images from one
  repository, by digest, and only what a tag points to. Whoever can change this repository's workflows on
  `develop`/`main` can therefore deploy: the same trust as merging code. Pull requests from forks cannot move tags
  (their token is read-only and the deploy jobs only run on pushes).
- Compose files come from GitHub at the deployed commit (raw.githubusercontent.com, public repository), so a
  compose change ships with the code; new `.env` variables still need a human first (runbook).
- The GitHub environments must exist with their protection **before** the first push to `main`: an environment
  that does not exist is created on first use without protection.
- On the supervisor's machine the sites are online only while it runs (accepted for the test phase).

## Alternatives not chosen

- SSH deploy (03 §12): impossible behind the home router; on a VPS it needs a root-equivalent deploy key in GitHub.
- Self-hosted GitHub runner on the server: fork pull requests could run code on it (public repository).
- Watchtower-like tools: archived or unmaintained, and they update containers without our checks and restore.

## Revisit when

- A real VPS exists (ADR-021 or a paid one): confirm the agent there, or go back to SSH if there is a reason.
- More than one server, or deploys need coordination (migrations in Task 3.1 may add a step).
