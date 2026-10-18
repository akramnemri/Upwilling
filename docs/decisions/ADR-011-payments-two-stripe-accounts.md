# ADR-011 — Payments: Stripe, two separate accounts (academy and association)

- Status: Accepted
- Date: 2026-10-18
- Source: `docs/ai/01_ARCHITECTURE.md` §3, §14

## Context

The academy (company) and the association (loi 1901) are two legal entities. Their revenue must never mix.

## Decision

- Two Stripe accounts. Keys per tenant in environment variables
  (e.g. `STRIPE_SECRET_KEY__UPWILLING`, `STRIPE_WEBHOOK_SECRET__CAREERBOOST`), never in the database.
- Stripe Checkout (hosted); no card data on our servers.
- Webhooks at `hooks.upwilling.fr/api/webhooks/stripe/<tenant>`: verify signature, store the event with a
  unique constraint on its Stripe ID, acknowledge, process in a job, idempotently.

## Consequences

- The tenant determines which Stripe account is used; a wrong mapping is a financial and legal error,
  so it is covered by tests.
- Creating the Stripe accounts is a human action.

## Revisit when

No foreseen trigger.
