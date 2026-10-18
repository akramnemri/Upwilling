# ADR-014 — Localization: French default; Payload localization enabled with `fr` and `en`

- Status: Accepted (cost to verify in M3)
- Date: 2026-10-18
- Source: `docs/ai/01_ARCHITECTURE.md` §3; TR-10

## Context

TR-10 (English version) is "souhaité" but not planned. Enabling localization later would require a data
migration of every localized field.

## Decision

Payload localization is enabled from day one with `fr` (default) and `en` declared but unused.
UI copy is French. The language switcher stays hidden until English content exists.

## Consequences

- No later data migration to add English.
- Slightly more complex schema and queries; the real cost is measured in Task 3.1.

## Revisit when

Task 3.1 shows real added complexity → new ADR to disable localization.
