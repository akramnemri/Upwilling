# ADR-007 — Background jobs: Payload Jobs Queue executed by the worker container

- Status: Accepted
- Date: 2026-10-18
- Source: `docs/ai/01_ARCHITECTURE.md` §3, §5.3, §10

## Context

Emails, PDFs, webhook processing, exports and retention tasks must not block requests, and must survive
restarts and provider outages.

## Decision

Use Payload's built-in Jobs Queue, stored in the application database. The `worker` container
(`APP_ROLE=worker`, entry point `src/jobs/worker.ts`) initialises Payload through its Local API and runs
the queue. Web and cms containers only enqueue jobs.

## Consequences

- No Redis or external broker to operate.
- Jobs depend on the database (see ADR-005, placeholder).
- Jobs must be idempotent and have an explicit retry policy; failed jobs are visible in the admin.

## Revisit when

Job volume or latency requirements exceed what a database-backed queue handles comfortably.
