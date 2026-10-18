# ADR-004 — One Docker image, several container roles

- Status: Accepted
- Date: 2026-10-18
- Source: `docs/ai/01_ARCHITECTURE.md` §3, §5.1, §5.3

## Context

One codebase (ADR-002) must not mean one process: editors working in the admin, or a slow background
job, must not slow down or crash the public sites.

## Decision

The application is built once into one Docker image. Each container selects its role with environment
variables:

| Container | `APP_ROLE` | `SITE` | Serves |
|---|---|---|---|
| `web-upwilling` | `web` | `upwilling` | `upwilling.fr` public routes |
| `web-careerboost` | `web` | `careerboost` | `careerboost.upwilling.fr` public routes |
| `cms` | `cms` | — | `admin.upwilling.fr`, `hooks.upwilling.fr` (`/api/webhooks/*` only) |
| `worker` | `worker` | — | No HTTP; runs the jobs queue (ADR-007) |

The request proxy/middleware enforces the role and host rules. `GET /api/health` (liveness, no
dependency checks) and `GET /api/ready` (readiness) exist in every HTTP role.

## Consequences

- Fault isolation per site and per role at the cost of a little more memory.
- Every role must be tested (role/host routing matrix, Task 1.1).
- Caches live per container; cross-container cache revalidation goes through an internal endpoint
  (`01_ARCHITECTURE.md` §5.4).

## Revisit when

We need horizontal scaling (several replicas per site), which also requires a shared cache handler.
