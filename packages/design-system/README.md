# @upwilling/design-system

Single source of truth for the visual identity of both sites (Stratégie §4, `docs/ai/04_DESIGN_SYSTEM.md`).

Status: tokens and themes arrive in Task 2.1, components in Task 2.2. Until then:

- `src/temporary-brand-theme.ts` — TEMPORARY color roles per brand (Task 1.2), exposed as `--uw-*` CSS variables.
  The hex values are **provisional** (`docs/ai/04_DESIGN_SYSTEM.md` §2): confirm them with the vector logo files (TR-01b).
- `src/contrast.ts` — WCAG contrast ratio; every text/background pair is tested at 4.5:1 (test in `apps/web`).
- `assets/LICENSES.md` — origin and rights of every brand file used by the sites.

The package is consumed as TypeScript source: `apps/web` lists it in `transpilePackages`.
