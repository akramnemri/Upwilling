# ADR-005 — Database: PostgreSQL

- Status: **Accepted** (supervisor, 2026-10-20: "we will go with postgres"). Was a placeholder since 2026-10-18.
- Date: 2026-10-18, updated 2026-10-20 (Task 1.4)
- Source: `docs/ai/01_ARCHITECTURE.md` §3, §9; supervisor instructions of 2026-10-18 and 2026-10-20;
  PostgreSQL versioning policy and the `postgres` Docker image page, checked 2026-10-20

## Update 2026-10-20 — PostgreSQL confirmed

- Engine: PostgreSQL, through `@payloadcms/db-postgres` (Task 3.1).
- Version: **major 18**, image `postgres:18.6-trixie` pinned by digest in `infra/server/compose.base.yaml`
  (multi-arch, so it also runs on the ADR-021 Arm VM). 18 is the current major, supported until 2030-11-14.
  Since 18 the image's volume is `/var/lib/postgresql` (data in `/var/lib/postgresql/18/docker`).
- One Postgres container per stack (production, recette), never published, database `app` (Task 1.4).
  The `umami` database comes with Task 5.8.
- **To verify in Task 3.1:** Payload's own CI ran `postgres:15` at v3.91.0 and its docs list no supported
  majors. Task 3.1 runs the integration tests against 18. If anything fails, drop to 17 (supported until
  2029-11-08) before real data exists: changing a major then costs only a new volume.
- Still to do in Task 3.1: a non-superuser role owning `app` for the application (the container's
  `postgres` superuser is for administration only), the local Postgres container (Task 0.3's deferral) and the
  CI service container with the migration check (Task 0.6's deferral).

The sections below are the original placeholder record.

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

Task 3.1 (Payload compatibility with major 18), or when a new PostgreSQL major is released.
