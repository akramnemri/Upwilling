# ADR-013 — Error tracking: Sentry (EU region, PII scrubbing); external uptime monitor

- Status: Accepted
- Date: 2026-10-18
- Source: `docs/ai/01_ARCHITECTURE.md` §3, §10

## Context

Errors must be visible to the team quickly, without sending personal data, and the VPS being down must be
detected from outside the VPS.

## Decision

- Sentry free tier, EU data region, PII scrubbing enabled, wired into web, cms and worker roles (Task 1.6).
- An external uptime monitor checks `/api/ready` on each host.

## Consequences

- Monitoring keeps working when the VPS is down.
- Creating the Sentry project and the uptime monitor is a human action.

## Revisit when

No foreseen trigger.
