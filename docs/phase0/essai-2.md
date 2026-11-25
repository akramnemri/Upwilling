# Essai 2 — Design system and section patterns

- Phase 0, Essai 2 (without VLAB, ADR-015). Roadmap milestone M2. Skeleton written 2026-11-25 (Task 2.5c); the PO
  design review fills the feedback below, and Task 2.6 adds the propagation proof and the conclusion.
- **Result: not concluded yet.**

## Exit criteria (05_ROADMAP.md, M2)

| Criterion | Status | Evidence |
|---|---|---|
| Changing one base value changes both sites | To prove (Task 2.6) | Screenshots in the Task 2.6 PR |
| Career Boost's blue and logo stay specific | To prove (Task 2.6) | Screenshots in the Task 2.6 PR |
| Visual regression detects both cases | To prove (Task 2.6) | The CI `visual` job failing on each change (Task 2.3b set it up) |
| PO design review done | To do | Section "PO design review" below |

## What exists (Tasks 2.1 to 2.5)

- Tokens: one source for color, spacing and type; a theme per brand; contrast tested for every text/background pair
  in both brands (Task 2.1). Fonts Rubik and Nunito, self-hosted (Task 2.4a).
- Components: primitives, forms, accordion, tabs, dialog, breadcrumbs (Task 2.2); header, footer and page layout
  (Task 2.4b); 15 section patterns from 04_DESIGN_SYSTEM.md §4 (Task 2.5).
- Storybook with a brand switcher and an accessibility panel; a screenshot of every story in both brands, compared on
  every pull request (Task 2.3).
- How-to: `packages/design-system/README.md`. Technologies and versions: `docs/tech-stack.md`.

## PO design review

**Where:** recette (password-protected), one demo home page per brand, all copy synthetic:

- Academy: `https://upwilling-recette.tail3810a7.ts.net/dev/demo`
- Association: `https://careerboost-recette.tail3810a7.ts.net/dev/demo`
- Also: `/dev/tokens` (the two color themes) and `/dev/components` (the building blocks) on both addresses; Storybook
  on the supervisor's laptop.

**How:** the reference site (`https://www.massar-academy.com/en`) side by side, for structure and rhythm only: nothing
is copied from it (04_DESIGN_SYSTEM.md §1). Look at each page on a phone and on a computer.

**Date and participants:** _to fill in_

### Feedback

One row per remark. "Decision" is what the PO chose; "Follow-up" is the task that carries it out.

| # | Page / section | Remark (PO's words) | Decision | Follow-up |
|---|---|---|---|---|
| 1 | | | | |

### Decisions to take during the review

| Topic | Today (provisional) | PO decision |
|---|---|---|
| Brand colors (TR-01b) | Adjusted for readable contrast: academy green `#2E7D34` → `#1E832B`, association blue `#0070D8` → `#006BCF`, body text `#16233A` → `#1C2128`, secondary text `#4B5563` → `#636E7F` | |
| Fonts | Rubik (titles), Nunito (text), Task 2.4a | |
| Logo files | Career Boost: raster logo from the holding page; academy: mark + name | SVG files, light and dark |
| Legal details in each footer | `[À compléter par le PO]` placeholder (Task 2.4b) | Name, legal form, address, SIRET; academy: training declaration number |
| Section order of each home page | 04_DESIGN_SYSTEM.md §5, as on `/dev/demo` | |

## Propagation proof (Task 2.6)

_To fill in by Task 2.6: the two changes, their screenshots, and the CI runs where the visual job caught them._

## Conclusion

_To fill in by Task 2.6._
