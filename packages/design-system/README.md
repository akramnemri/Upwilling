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

`duration`, `z-index`, `border-width` and `focus-ring` have no Tailwind namespace: CSS reads their
variables. A new token group must be mapped in `src/tokens/tailwind-theme.ts` (or listed there as
CSS-only), or the generator stops.

In `apps/web`, lint refuses what bypasses the tokens: raw colors in code (ESLint), arbitrary Tailwind
values such as `p-[13px]` or `bg-(--x)` and classes the theme does not define (ESLint,
`eslint.design-tokens.mjs`), and raw colors, font sizes and spacing in CSS (Stylelint,
`stylelint.config.mjs`). An exception needs a disable comment that says why (`-- <reason>`).

**Provisional values:** the brand colors were read from the logos (`docs/ai/04_DESIGN_SYSTEM.md` §2) and
must be confirmed with the vector source files (TR-01b); the role mapping and fonts wait for the PO's M2
design review. Fonts are system stacks until Task 2.4.

## Other files

- `src/contrast.ts` — WCAG contrast ratio.
- `src/color/` — OKLCH conversions and palette generation (no dependency).
- `assets/LICENSES.md` — origin and rights of every brand file used by the sites.

The package is consumed as TypeScript source (`apps/web` lists it in `transpilePackages`). Relative
imports carry the `.ts` extension so Node can run the generator directly (type stripping, Node 24).
