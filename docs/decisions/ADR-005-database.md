# ADR-005 — Database: PostgreSQL (placeholder)

- Status: **Proposed — placeholder.** The concrete database is pending the supervisor's decision.
- Date: 2026-10-18
- Source: `docs/ai/01_ARCHITECTURE.md` §3, §9; supervisor instruction of 2026-10-18

## Context

The architecture describes one production PostgreSQL instance with separate databases (`app`, `umami`,
later `analytics`), Payload migrations as the only way to change the schema, and nightly encrypted backups.

On 2026-10-18 the supervisor stated that PostgreSQL is a **placeholder**: its implementation is to be done
last, or when a concrete database is provided.

## Decision (provisional)

- The target remains PostgreSQL through `@payloadcms/db-postgres`, as described in `01_ARCHITECTURE.md` §9.
- No PostgreSQL version is pinned yet (see ADR-018). Facts recorded for later:
  `@payloadcms/db-postgres@3.91.0` depends on `pg@8.20.0` and `drizzle-orm@0.45.2`;
  Payload's own CI at tag `v3.91.0` (`.github/workflows/main.yml`) runs a `postgres:15` service.
  The supported majors must be re-verified in Payload's documentation when this ADR is finalized.
- Until then, M0 work that depends on a database is deferred:
  - Task 0.3: no Postgres container in `infra/local/compose.yaml` (Mailpit only).
  - Task 0.4: `/api/ready` checks configuration only; the database check is added later.
  - Task 0.5: unit tests only; database-backed integration tests are added later.

## Consequences

- M0 and the non-database parts of M1/M2 can proceed.
- **Blocking point:** Payload needs a database adapter to start (Task 3.1). Before M3 the supervisor must
  either provide the concrete database, or approve a temporary adapter for local development (e.g. Payload's
  SQLite adapter) recorded in a new ADR. Migrations generated for one adapter do not carry over to another.
- The jobs queue (ADR-007), backups (Task 1.6) and Umami (ADR-010) also depend on this decision.

## Revisit when

The supervisor provides the concrete database, or M3 is about to start — whichever comes first.
