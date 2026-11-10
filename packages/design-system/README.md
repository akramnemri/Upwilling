# @upwilling/design-system

Single source of truth for the visual identity of both sites (Stratégie §4, `docs/ai/04_DESIGN_SYSTEM.md`).

## Tokens (Task 2.1a)

```text
tokens/
  base/color.json        constants, source colors, the 11-step lightness/chroma ladder
  base/*.json            typography, spacing, shape, motion, layout (one group per key)
  brands/<brand>.json    which source color is each brand's primary, accent, support
  semantic/color.json    color roles (light theme) and the contrast pairs they must pass
scripts/build-tokens.ts  the generator
css/tokens.css           GENERATED: `:root` (non-color tokens) + one `[data-brand="…"]` block per brand
css/theme.css            GENERATED: the Tailwind v4 theme (`@theme inline`) mapping utilities to the tokens
src/generated/tokens.ts  GENERATED: the same values for TypeScript (roles, palettes, pairs, base tokens)
```

After editing a token file:

```bash
pnpm --filter @upwilling/design-system tokens
```

and commit the generated files with it. A unit test fails while they are out of date, and the generator
refuses to write a theme where a contrast pair fails (4.5:1 text, 3:1 UI components).

How colors are made: each source color becomes an 11-step palette (50–950) in OKLCH: every step has the
ladder's lightness, the source's hue, and the source's chroma times the step's factor, reduced only where
sRGB cannot show it. Roles pick a step by measured contrast (`lightestStepWithContrast`), name a step,
use the exact source (`"step": "source"`, e.g. the logo orange), or move along a palette (`darkerThan`).

CSS variables (all `--uw-` prefixed):

- `--uw-color-<role>`: what components use (`primary`, `text-muted`, `danger-text`, …). Never a brand color name.
- `--uw-palette-<palette>-<step>`: previews and tints (`primary`, `accent`, `support`, `neutral`, statuses).
- `--uw-<group>-<name>`: everything else (`--uw-space-4`, `--uw-font-size-lg`, `--uw-radius-md`, …).

The application imports both stylesheets once, after Tailwind (`apps/web/src/app/globals.css`), and sets
`data-brand` on `<html>` from the request host. Preview: `/dev/tokens` on any site host, locally and on
recette (refused in production).

## Tailwind classes (Task 2.1b)

`css/theme.css` removes Tailwind's default theme (`--*: initial`) and maps each token to its Tailwind
namespace. Every utility reads a `--uw-*` variable, so the same class gives each brand its own color.

| Tokens                                    | Classes                                                                                                                                                  |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color roles                               | `bg-primary`, `text-text-muted`, `border-border-strong`, `bg-danger-surface`, … (roles only: palettes are not contrast-checked, so they are not classes) |
| `space`, `section-space`, `gutter`, `gap` | `p-4`, `py-section-md`, `px-gutter-page`, `gap-gap-md` (only the token scale: `p-13` does not exist)                                                     |
| Typography                                | `font-display`, `text-lg`, `font-semibold`, `leading-body`, `tracking-wide`                                                                              |
| Shape, motion                             | `rounded-md`, `shadow-md`, `ease-standard`                                                                                                               |
| Layout                                    | `md:`, `lg:` (breakpoints), `@md:` and `max-w-prose` (containers)                                                                                        |

`duration`, `z-index`, `border-width` and `focus-ring` have no Tailwind namespace: the generator writes
`@utility` classes for them instead (`duration-fast`, `z-modal`, `border-thick`, `focus-visible:focus-ring`).
`transition-*` utilities default to `--uw-duration-base` and `--uw-easing-standard`. A new token group
must be mapped in `src/tokens/tailwind-theme.ts`, or the generator stops.

`css/base.css` (hand-written) declares the two animations the components use (`animate-spin`,
`animate-pulse`) and stops every animation and transition under `prefers-reduced-motion`.

Lint refuses what bypasses the tokens, in `apps/web` and in `react/` (shared rules:
`@upwilling/config/eslint/design-tokens`): raw colors in code, arbitrary Tailwind values such as
`p-[13px]` or `bg-(--x)`, and classes the theme does not define. In `apps/web`, Stylelint also refuses raw
colors, font sizes and spacing in CSS (`stylelint.config.mjs`). An exception needs a disable comment that
says why (`-- <reason>`).

## React components (Tasks 2.2a, 2.2b)

`react/`, imported as `@upwilling/design-system/react`. Server Components (no `"use client"`) except
`SubmitButton`, styled with token classes only; every visible or announced text comes from props
(French copy lives in the application). Preview: `/dev/components` on any site host, locally and on
recette.

| Group      | Components                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------------- |
| Layout     | `Container` (token width + page gutter), `Section` (rhythm, background + matching text color), `Stack`, `Grid` |
| Typography | `Heading` (level ≠ size), `Text`, `Eyebrow`                                                                    |
| Actions    | `Button` (primary, secondary, ghost, link; sm/md/lg; icon; loading), `ButtonLink`, `Link`                      |
| Content    | `Icon` (Lucide), `Badge`, `Chip`, `AnnouncementPill`, `Card` + `CardMedia/Header/Body/Footer`                  |
| Forms      | `Field` (+ `Input`, `Textarea`, `Select`, `FileInput`), `Checkbox`, `Fieldset`, `RadioGroup`, `ChoiceCards`    |
| Submission | `SubmitButton` (Client Component: pending state of the enclosing `<form action={…}>`)                          |
| Feedback   | `Spinner` (labelled status or decorative), `Skeleton`, `Alert`, `EmptyState`                                   |

Conventions:

- Variants are plain lookup tables of full class names (Tailwind must see them literally); `cx()` joins
  them. A caller's `className` is for placement (margins, grid position), not restyling: classes are not
  merged.
- `Link` and `ButtonLink` use `next/link` for paths (`/…`, `#…`, `?…`) and a plain anchor otherwise. A new
  tab needs `newTabLabel` (read after the link text). `Button` defaults to `type="button"`; while
  `loading` it is disabled and reads `loadingLabel` after its text.
- Icons: import each Lucide icon by name and pass the component (`icon={ArrowRight}`); decorative unless
  given a `label`.
- Forms: a `Field` passes its wiring (`id`, `aria-describedby` = help then error, `aria-invalid`,
  `required`) to its control through a render prop: `{(control) => <Input name="email" {...control} />}`.
  `useId()` works in Server Components; a context would not. Help and error sit between the label and
  the control. A required field takes `required` + `requiredLabel` (e.g. "(obligatoire)"), shown and read
  in the label. Groups (`Fieldset`, `RadioGroup`, `ChoiceCards`) put help and error on the `fieldset`
  (`aria-invalid` is not allowed on a group). Checkboxes and radios are native, tinted with
  `accent-primary`; a choice card is a `<label>` around its input (`has-checked:`, `has-focus-visible:`).
- `SubmitButton` goes inside a `<form action={…}>`. While the action runs it shows a spinner, uses
  `aria-disabled` (a `disabled` button would drop the keyboard focus), ignores clicks and Enter, and
  announces `pendingLabel` in a status region that is on the page from the start.
- `Alert` takes `role="alert"` or `role="status"` only when it appears after the page has loaded; a
  polite message is announced reliably when its `role="status"` container was already there.
- Tests (`react/*.test.tsx`, jsdom): roles, accessible names, keyboard, variants, and an axe-core check
  (color contrast is measured in the e2e test, in Chromium).

Tailwind in an application must scan this folder: `@source` in `apps/web/src/app/globals.css`.
`css/tailwind.css` is this package's own entry (lint now, Storybook in Task 2.3).

**Provisional values:** the brand colors were read from the logos (`docs/ai/04_DESIGN_SYSTEM.md` §2) and
must be confirmed with the vector source files (TR-01b); the role mapping and fonts wait for the PO's M2
design review. Fonts are system stacks until Task 2.4.

## Other files

- `src/contrast.ts` — WCAG contrast ratio.
- `src/color/` — OKLCH conversions and palette generation (no dependency).
- `assets/LICENSES.md` — origin and rights of every brand file used by the sites.

The package is consumed as TypeScript source (`apps/web` lists it in `transpilePackages`). Relative
imports carry the `.ts` extension so Node can run the generator directly (type stripping, Node 24).
