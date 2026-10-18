# 04 — Design System & Visual Direction

Act as a senior front-end engineer with a strong eye for design systems and accessibility.

The design system is "the heart of the solution" (Stratégie §4): one package, one identity,
declined per brand, so a change made once propagates everywhere.

---

## 1. Design reference — Masar (inspiration, not a copy)

Reference site: `https://www.massar-academy.com/en` (a Next.js education platform).

Use it as inspiration for **information architecture, section rhythm, component types and interaction patterns**.

Do NOT copy: text, illustrations, images, logos, icons drawn by them, their exact layouts or their purple brand color.
Everything we ship must be original and in UpWilling's brand. When in doubt, describe the pattern, then design our own version.

What we take from it:

| Pattern on the reference | Why it works | Our version |
|---|---|---|
| Sticky header: logo, anchor navigation to page sections, language switcher, one primary CTA | Short path to action on long one-page homepages | Same structure; language switcher hidden until `en` content exists (TR-10) |
| Small "New" announcement pill above the hero | Highlights one current item without a banner | Editable announcement from the CMS (e.g. next inter-company session) |
| Hero: big two-line promise, one paragraph, two CTAs (primary + secondary), three short trust bullets, product mock-up with floating status cards | Explains value and shows the product in one screen | Academy: promise around embedded systems & Linux careers; visual = original terminal/board illustration with floating cards ("Session inter · 8 places", "Module 3 terminé") |
| Infinite technology logo strip | Credibility at a glance | Technologies taught (Linux, C, Yocto, RTOS…) with properly licensed logos or text chips |
| "Sound familiar?" four pain-point cards | Empathy before selling | Learner / company pain points (content from Khawla) |
| Two audience tracks side by side, each with a mini UI card and bullet list | Self-identification | Academy: e-learning vs live sessions (inter/intra) — sized by the PO's answer to Phase 0 Q2 |
| Catalogue with category tabs and cards (level badge, duration, number of projects, tech chips) | Scannable catalogue | AC-01 / AC-02 cards: theme, level, format, duration, price or "sur devis" |
| "Why us" bento grid of features, each with a small illustrative UI | Concrete benefits instead of adjectives | Trainers from the field, hands-on labs (VLAB teaser later), certification, support |
| Numbered process stepper with deliverable per step | Reduces anxiety, shows method | How a training / intra request works, step by step |
| Three pricing tiers with one highlighted | Simple choice | Academy formats; Career Boost membership categories (CB-02 amounts from PO) |
| FAQ accordion | Removes objections | Per site, managed in the CMS |
| Contact section: 3 "what happens next" steps + short form with choice cards | Low-friction lead capture | Contact / intra request (AC-07, AC-17); Career Boost volunteer & contact (CB-07) |
| Mobile-first, light pages, works on slow connections | Audience on phones | Our performance budgets (`01_ARCHITECTURE.md` §11) |

Not taken for now: the in-browser code playground ("Try it") — the equivalent for UpWilling is VLAB, which is out of scope.
Reserve a homepage slot for a future "Essayez un lab" section.

---

## 2. Brands and colors

Source: Stratégie §4. Values were read from the logos and **must be confirmed with the source files** (TR-01b).
Until confirmed, use them as provisional values and note it in the design system README.

| Brand | Palette | Logo |
|---|---|---|
| Shared base | Green ≈ `#389840`, orange ≈ `#F89808`, neutrals, typography, spacing | — |
| UpWilling (academy) | Green + orange | UpWilling logo (orange sun, green mountains) |
| UpWilling Career Boost (association) | Green + orange + **blue** ≈ `#0070D8` | Career Boost logo |
| VLAB | Out of scope | Out of scope |

Provisional role mapping (PO to validate on the M2 design review):

| Role | UpWilling | Career Boost |
|---|---|---|
| `primary` (main buttons, links, key highlights) | green | blue |
| `accent` (secondary highlights, badges, decorative) | orange | orange |
| `support` (tertiary, illustrations) | — | green |

Components **never** reference "green" or "blue". They reference roles: `--uw-color-primary`, `--uw-color-accent`, etc.
Each brand maps its colors to these roles.

### Accessibility constraint on these colors

- Orange `#F89808` on white is far below 4.5:1 → never use it for text or as a background behind white text.
  Use it for decoration, large shapes, or with dark text on top.
- Green `#389840` on white is below 4.5:1 for normal text → buttons with white text and text links use a **darker shade**
  from the generated scale (e.g. 600–700) that passes AA.
- Generate an 11-step scale (50–950) for each brand color in OKLCH; pick role shades by measured contrast, not by eye.
- A unit test computes the contrast of every text/background role pair in every brand and fails below the threshold.

---

## 3. Tokens

Structure in `packages/design-system/tokens/`:

```text
tokens/
  base/        color scales, neutrals, typography, spacing, radii, shadows, motion, z-index, breakpoints
  brands/
    upwilling.json
    careerboost.json
  semantic/    role definitions (primary, accent, surface, text, border, focus, success, warning, danger, info)
```

Output (generated, never hand-edited):

- `css/tokens.css` — CSS custom properties with the `--uw-` prefix, one block per brand selected by `[data-brand="upwilling"]` / `[data-brand="careerboost"]`.
- A Tailwind theme mapping (Tailwind v4 `@theme` referencing the CSS variables; verify the installed Tailwind version).
- TypeScript token types for components that need values in JS (rare).

Token groups:

| Group | Content |
|---|---|
| Color | scales; semantic roles: `primary`, `primary-hover`, `primary-contrast`, `accent`, `accent-contrast`, `surface`, `surface-muted`, `surface-raised`, `text`, `text-muted`, `text-inverse`, `border`, `border-strong`, `focus-ring`, `success`, `warning`, `danger`, `info` (each with `-surface` and `-text` variants) |
| Typography | font families (`display`, `body`, `mono`), fluid size scale (`xs`…`5xl` with `clamp()`), weights, line heights, letter spacing |
| Spacing | 4 px base scale; section vertical rhythm tokens (`section-sm/md/lg`) |
| Radius | `sm`, `md`, `lg`, `xl`, `full` — friendly rounded style similar in spirit to the reference |
| Shadow | 2–3 subtle elevations only |
| Motion | durations and easings; all animations disabled under `prefers-reduced-motion` |
| Layout | container widths, breakpoints, grid gaps |

Typography (provisional, PO to confirm): a rounded geometric display font + a highly readable body font + a monospace
for code snippets (examples: Rubik / Nunito / JetBrains Mono, all open-license). Self-hosted with `next/font`.
Limit to 2 weights per family to protect performance.

Light theme only at launch. The token structure must allow a dark theme later without touching components.

**Golden rule (Stratégie §4):** no color, font size or spacing value is hard-coded in a site. Lint rules forbid raw hex colors
and arbitrary Tailwind values outside the design system package (allowlist exceptions with a comment).

---

## 4. Components

Built in `packages/design-system/react/`, accessible, documented in Storybook with a brand switcher.
Use native elements where possible; use a headless accessible primitive library (e.g. Radix) for complex widgets — verify and justify in the plan.

Primitives (M2):

- `Button` (primary, secondary, ghost, link; sizes; loading; icon), `ButtonLink`
- `Link` (internal/external handling)
- `Container`, `Section` (with vertical rhythm and background variants), `Stack`, `Grid`
- `Heading`, `Text`, `Eyebrow` (small uppercase label above titles)
- `Badge`, `Chip` (tech chips, level badges), `AnnouncementPill`
- `Card` (with media, header, body, footer slots)
- `Icon` (one open-license icon set, tree-shaken)
- Form: `Field` (label, help, error wiring), `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `ChoiceCards` (selectable cards), `FileInput`
- Feedback: `Alert`, `Toast` (if needed), `Spinner`, `Skeleton`, `EmptyState`
- Disclosure: `Accordion`, `Tabs`, `Dialog`
- Navigation: `SiteHeader` (logo slot, nav items, CTA slot, mobile menu, optional language switcher), `SiteFooter` (columns, legal links, legal entity line), `Breadcrumbs`

Section patterns (M2.5, static props; wired to CMS blocks in M5):

- `Hero`, `LogoStrip` (marquee, pauses on hover/focus, static under reduced motion), `PainPoints`, `AudienceTracks`,
  `CatalogueGrid` (tabs + cards), `FeatureBento`, `ProcessSteps`, `PricingTiers`, `Testimonials` (AC-16 later),
  `FaqAccordion`, `ContactCta`, `StatsBand`, `NewsGrid`, `DocumentList`, `RichTextSection`.

Rules:

- Components are brand-agnostic; they only use semantic tokens.
- No component fetches data. Sections receive typed props; CMS blocks map to these props in the app.
- Every component has: stories for each variant and state, an accessibility check in Storybook, and stable visual snapshots in both brands.
- Text inside components comes from props (French copy lives in the CMS or in app dictionaries, never in the design system).

---

## 5. Page inventory (first versions)

Career Boost (launch first — Stratégie §10):

- Home: hero (mission), stats band, actions/news, how to get involved (member / donor / volunteer), membership tiers, FAQ, contact CTA.
- About: mission, bureau (CB-01), official documents (CB-08).
- News list + detail (CB-05).
- Join (membership, CB-02/03), Donate (CB-04), Volunteer (CB-07), Contact.
- Legal pages: mentions légales, confidentialité, cookies/mesure d'audience.

UpWilling academy:

- Home: announcement, hero, tech strip, pain points, two tracks, catalogue preview, why us, process, formats/pricing, FAQ, contact CTA.
- Catalogue (AC-01) with filters; training detail (AC-02) with program, prerequisites, duration, price, trainer, upcoming sessions.
- Session detail (AC-05), intra request (AC-07), trainer profile (AC-22), blog (AC-14).
- Account: my trainings, progress, materials, invoices (AC-04, AC-13).
- Regulatory pages for a training organization (AC-15): content supplied by the PO.

---

## 6. Visual regression and review

- Storybook stories are screenshot-tested with Playwright in both brands; diffs fail CI until approved.
- Essai 2 proof: change one base token → both brands change; change Career Boost's blue → only Career Boost changes.
- Each design milestone ends with a **PO design review** on recette (screenshots in the PR, no real data).

---

## 7. Assets needed from the human / PO

- Logo source files (SVG) for UpWilling and Career Boost, light and dark variants, favicon sources.
- Confirmation of brand hex values and the role mapping in §2.
- Font choice confirmation.
- Photos/illustrations rights: only assets the organization owns or licensed ones, recorded in `packages/design-system/assets/LICENSES.md`.
