# ADR-012 — Email: Brevo transactional, sent only from worker jobs; Mailpit locally

- Status: Accepted
- Date: 2026-10-18
- Source: `docs/ai/01_ARCHITECTURE.md` §3, §10

## Context

Transactional emails (verification, receipts, notifications) must not block requests and must survive
provider outages.

## Decision

- Brevo transactional email (free tier at launch).
- Emails are sent only from jobs executed by the worker (ADR-007), never inline in a request.
- Locally, Mailpit captures all emails.

## Consequences

- A Brevo outage is invisible to visitors; emails wait in the queue and are retried.
- Templates and sending live in the `notifications` module.

## Revisit when

Volume exceeds the Brevo free tier.
