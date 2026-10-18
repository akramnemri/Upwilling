# ADR-010 — Analytics: self-hosted Umami plus server-side domain events; Metabase in M9

- Status: Accepted (CNIL self-assessment to be validated by the PO)
- Date: 2026-10-18
- Source: `docs/ai/01_ARCHITECTURE.md` §3, §13

## Context

We need audience measurement without a consent banner where legally possible, and business funnel data
(DA-02, DA-03, DA-06). The client script must stay small for performance.

## Decision

- Umami, self-hosted, cookieless, configured to meet the CNIL consent-exemption criteria. The tracker is
  served first-party through a proxied path on each site. We fill the CNIL self-assessment ourselves in
  `docs/analytics/cnil-self-assessment.md`; the PO validates it.
- Business funnels use server-side domain events in an append-only `analytics_events` table
  (pseudonymous subject hash, whitelisted properties, no PII).
- The separate analytics database and Metabase dashboards come in Milestone 9.

## Consequences

- No client-side linking of analytics to accounts, no per-visitor e-commerce tracking, no session replay,
  heatmaps or A/B testing (outside the exemption).
- Umami needs its own database (depends on ADR-005).

## Revisit when

The PO requires vendor-provided CNIL documentation → switch to Matomo behind the same `analytics` module.
