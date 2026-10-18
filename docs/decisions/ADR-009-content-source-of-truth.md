# ADR-009 — Content source of truth is Payload, with Markdown import and export

- Status: Accepted
- Date: 2026-10-18
- Source: `docs/ai/01_ARCHITECTURE.md` §3, §12; Phase 0 Q3

## Context

Trainers are not developers and need draft → review → publish with comments and version history
(AC-19, AC-20, AC-21). The PO needs all content editable without a developer (TR-14).
Phase 0 Q3 raised the concern of content portability.

## Decision

- All content, including course content, is stored in Payload as structured blocks (Lexical rich text with
  a whitelist of features and custom blocks; no raw HTML).
- Versions and drafts are enabled on every editorial collection.
- A Markdown import tool converts existing material into Lexical.
- A scheduled job exports published content (Markdown + front-matter + asset manifest) to R2.

## Consequences

- Editors get a real editorial workflow; developers are not in the publishing loop.
- Portability is guaranteed by the export, not by storing content in Git.
- Lexical ↔ Markdown utilities must be verified in Payload's docs before implementation (M8).

## Revisit when

No foreseen trigger.
