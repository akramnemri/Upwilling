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

## React components (Tasks 2.2a–2.2c)

`react/`, imported as `@upwilling/design-system/react`. Server Components (no `"use client"`) except
`SubmitButton` and `Dialog`, styled with token classes only; every visible or announced text comes from
props (French copy lives in the application). Preview: `/dev/components` on any site host, locally and
on recette.

| Group      | Components                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------------- |
| Layout     | `Container` (token width + page gutter), `Section` (rhythm, background + matching text color), `Stack`, `Grid` |
| Typography | `Heading` (level ≠ size), `Text`, `Eyebrow`                                                                    |
| Actions    | `Button` (primary, secondary, ghost, link; sm/md/lg; icon; loading), `ButtonLink`, `Link`                      |
| Content    | `Icon` (Lucide), `Badge`, `Chip`, `AnnouncementPill`, `Card` + `CardMedia/Header/Body/Footer`                  |
| Forms      | `Field` (+ `Input`, `Textarea`, `Select`, `FileInput`), `Checkbox`, `Fieldset`, `RadioGroup`, `ChoiceCards`    |
| Submission | `SubmitButton` (Client Component: pending state of the enclosing `<form action={…}>`)                          |
| Feedback   | `Spinner` (labelled status or decorative), `Skeleton`, `Alert`, `EmptyState`                                   |
| Disclosure | `Accordion` (native `<details>`), `Tabs` (Radix), `Dialog` (Client Component: native modal `<dialog>`)         |
| Navigation | `Breadcrumbs`                                                                                                  |

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
- Native first, Radix only where HTML has nothing (Task 2.2c). `Accordion` is `<details>`/`<summary>`:
  the browser handles Tab, Enter, Space and the expanded state, with no JavaScript; `exclusive` groups
  the panels with a shared `name` (one open at a time); titles are plain text (a heading inside
  `<summary>` is not announced the same way everywhere). `Tabs` renders `@radix-ui/react-tabs` parts
  (the WAI-ARIA tabs pattern: one Tab stop, arrows/Home/End select, Tab enters the panel); Radix ships
  `"use client"`, so the wrapper stays a Server Component and the panels render on the server. Tab
  `value`s are id-like (Radix builds element ids from them); only the selected panel is in the page.
- `Dialog` uses `showModal()`: top layer, the rest of the page inert, Escape closes, focus goes to the
  close button and back to the trigger. It needs `closeLabel` (the close button is an icon). A button
  that only closes it goes in `<form method="dialog">`. Clicking the backdrop does not close it. While
  it is open the page does not scroll (`css/base.css`).
- `Breadcrumbs` takes the pages above (`items`) and the `current` page's title, which is text with
  `aria-current="page"`; the separators are hidden from assistive technology.
- No `Toast`: nothing needs a message that disappears on its own. Results stay on the page (`Alert`
  in a status region); a vanishing message is easy to miss with a screen reader and leaves no time to
  read it (WCAG 2.2.1). Add one when a flow needs feedback without a page change.
- Tests (`react/*.test.tsx`, jsdom): roles, accessible names, keyboard, variants, and an axe-core check
  (color contrast is measured in the e2e test, in Chromium). jsdom has no `showModal()` and does not
  group `<details name>`: the dialog and the accordion's behavior are tested in Chromium
  (`apps/web/tests/e2e/interactive.spec.ts`).

Tailwind in an application must scan this folder: `@source` in `apps/web/src/app/globals.css`.
`css/tailwind.css` is this package's own entry (class lint and Storybook).

## Storybook (Task 2.3a)

```bash
pnpm --filter @upwilling/design-system storybook        # http://localhost:6006
pnpm --filter @upwilling/design-system storybook:build  # static site in storybook-static/ (git-ignored)
```

- `.storybook/main.ts`: framework `@storybook/nextjs-vite` (so `next/link` works as in the App
  Router), Tailwind through `@tailwindcss/vite`, addons docs and a11y, telemetry off.
- `.storybook/preview.tsx`: imports `css/tailwind.css`; the **Marque** toolbar menu (UpWilling /
  Career Boost) sets `data-brand` on `<html>` before the story renders, as the application does from
  the host. Every component gets a docs page (`autodocs`).
- Accessibility panel: axe-core with the e2e rule set (WCAG 2.2 AA tags), in `todo` mode: results
  show in the panel, nothing fails yet. Contrast is measured there in a real browser.
- Stories: `react/stories/<component>.stories.tsx`, one file per component, one story per variant
  and state, synthetic French copy passed as props. They are in the design-token lint scope.
- Browser-only states have a story with a play function: `Forms/SubmitButton` → `Pending`
  (submits a form whose action only waits three seconds) and `Disclosure/Dialog` → `Open` (not on the
  docs page: open it from its own canvas).
- CI builds Storybook in the `checks` job (`pnpm storybook:build`).

## Visual regression (Task 2.3b)

Every story is screenshotted in both brands (Playwright projects `upwilling` and `careerboost`,
1280 × 800, reduced motion, full page) and compared with its baseline in
`visual/__screenshots__/<brand>/<story-id>.png`. The list of stories comes from the built Storybook's
`index.json`: a new story gets a test by itself. A story whose look depends on timing carries the
`skip-visual` tag (today only `Forms/SubmitButton → Pending`).

- **Only in the pinned container.** Fonts and antialiasing differ between systems, so screenshots
  are taken only in `mcr.microsoft.com/playwright:v1.64.1-noble` (pinned by digest, ADR-018), in
  CI's `visual` job. `playwright.config.ts` refuses to run without `UPWILLING_VISUAL=container`,
  which that job sets. `publish` waits for it.
- **When a story changes on purpose** (or a new story has no baseline), the `visual` job fails and
  uploads two artifacts: `visual-report` (Playwright report with expected / actual / diff) and
  `visual-baselines` (the screenshots that differ or were missing, at their baseline paths).
  To approve: check the report, then download the baselines into the branch and commit them:

  ```bash
  gh run download <run-id> --name visual-baselines --dir packages/design-system/visual/__screenshots__
  ```

  The PR then shows each changed picture; review them like code. CI never commits by itself.

- **When it was not on purpose:** fix the code; the baselines stay.
- Locally: run Storybook and look (no Docker needed). `node visual/serve.mjs` serves the built
  Storybook on port 6106 for the tests (no dependency).

**Provisional values:** the brand colors were read from the logos (`docs/ai/04_DESIGN_SYSTEM.md` §2) and
must be confirmed with the vector source files (TR-01b); the role mapping and fonts wait for the PO's M2
design review. Fonts are system stacks until Task 2.4.

## Other files

- `src/contrast.ts` — WCAG contrast ratio.
- `src/color/` — OKLCH conversions and palette generation (no dependency).
- `assets/LICENSES.md` — origin and rights of every brand file used by the sites.

The package is consumed as TypeScript source (`apps/web` lists it in `transpilePackages`). Relative
imports carry the `.ts` extension so Node can run the generator directly (type stripping, Node 24).
