# ADR-014 — Localization: French default; Payload localization enabled with `fr` and `en`

- Status: Accepted (cost verified in Task 3.1, 2026-11-25: kept)
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

## Update 2026-11-25 — Task 3.1: cost measured, decision kept

Measured on Payload 3.93.0 / PostgreSQL 18.6 with one localized field (`media.alt`):

- **Schema:** one `_locales` enum (`fr`, `en`) and one `<collection>_locales` table per collection that has
  localized fields (`media_locales`: id, value columns, `_locale`, `_parent_id`, a foreign key with cascade and a
  unique index on locale + parent). Collections without localized fields (`users`) are unchanged. In the initial
  migration this is 8 of 155 lines.
- **Reads:** one extra `LEFT JOIN` on `<collection>_locales` for the requested locale, in the same SQL statement
  (checked in PostgreSQL's statement log). No extra round trip.
- **Writes:** updating a localized field rewrites that document's rows in `<collection>_locales` (delete + insert).
  Irrelevant at our volumes.
- **Code:** none. Reads without `locale` get French; generated types stay plain (`alt: string`); fallback to
  French while English is empty is covered by an integration test.
- **Admin:** a locale selector ("Paramètres régionaux") appears in the admin header once localization is on.
  Editors could switch to English by mistake; with fallback on they would then see French values. Mention it in
  the editors' guide; hiding the selector would need a custom admin component (not worth it now).

**Conclusion:** the cost is small and contained. ADR-014 stays as decided; fields opt in with `localized: true`
only when they hold page content (texts, alternative texts), never for identifiers, prices or dates.

## Revisit when

Task 3.1 shows real added complexity → new ADR to disable localization.
