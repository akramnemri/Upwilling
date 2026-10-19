import type { Brand } from "./index";

/**
 * TEMPORARY theme for the "under construction" pages (Task 1.2), replaced by the token pipeline of
 * Task 2.1. Values are provisional (04_DESIGN_SYSTEM.md §2): they match the Career Boost logo sent on
 * 2026-10-19 within ±8 per channel, and must be confirmed with the vector source files (TR-01b).
 *
 * Sites never use these hex values directly: they read the `--uw-*` CSS variables by role.
 */
const PALETTE = {
  // Brand colors as read from the logos.
  green: "#389840",
  orange: "#F89808",
  blue: "#0070D8",
  // Darker green for text and white-on-green buttons: #389840 is below 4.5:1 on white.
  greenText: "#2E7D34",
  ink: "#16233A",
  inkMuted: "#4B5563",
  white: "#FFFFFF",
  mist: "#F4F7FA",
} as const;

/** Color roles a page may use. Components reference roles, never "green" or "blue". */
export interface BrandColorRoles {
  /** Links, main buttons, key highlights. Readable as text on `surface`. */
  primary: string;
  /** Text on a `primary` background. */
  primaryContrast: string;
  /** Decoration only (lines, shapes): never text, never behind white text. */
  accent: string;
  /** Second decorative color. */
  support: string;
  text: string;
  textMuted: string;
  surface: string;
  surfaceMuted: string;
}

export const TEMPORARY_BRAND_COLORS: Readonly<Record<Brand, BrandColorRoles>> = {
  upwilling: {
    primary: PALETTE.greenText,
    primaryContrast: PALETTE.white,
    accent: PALETTE.orange,
    support: PALETTE.green,
    text: PALETTE.ink,
    textMuted: PALETTE.inkMuted,
    surface: PALETTE.white,
    surfaceMuted: PALETTE.mist,
  },
  careerboost: {
    primary: PALETTE.blue,
    primaryContrast: PALETTE.white,
    accent: PALETTE.orange,
    support: PALETTE.green,
    text: PALETTE.ink,
    textMuted: PALETTE.inkMuted,
    surface: PALETTE.white,
    surfaceMuted: PALETTE.mist,
  },
};

/** Text/background pairs that must reach WCAG AA (4.5:1) in every brand. */
export const TEXT_COLOR_PAIRS = [
  ["text", "surface"],
  ["text", "surfaceMuted"],
  ["textMuted", "surface"],
  ["textMuted", "surfaceMuted"],
  ["primary", "surface"],
  ["primary", "surfaceMuted"],
  ["primaryContrast", "primary"],
] as const satisfies readonly (readonly [keyof BrandColorRoles, keyof BrandColorRoles])[];

// Brand-independent scale, so page styles never hard-code sizes either (04 §3 golden rule).
const SCALE = {
  "--uw-font-family-body":
    'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  "--uw-font-size-sm": "0.875rem",
  "--uw-font-size-md": "1rem",
  "--uw-font-size-lg": "1.25rem",
  "--uw-font-size-display": "clamp(1.75rem, 1.2rem + 2.5vw, 3rem)",
  "--uw-line-height-tight": "1.2",
  "--uw-line-height-body": "1.6",
  "--uw-space-2": "0.5rem",
  "--uw-space-4": "1rem",
  "--uw-space-6": "1.5rem",
  "--uw-space-8": "2rem",
  "--uw-space-12": "3rem",
  "--uw-radius-lg": "1rem",
  "--uw-width-content": "40rem",
  "--uw-border-width-accent": "0.25rem",
} as const;

const ROLE_VARIABLES: readonly (readonly [keyof BrandColorRoles, string])[] = [
  ["primary", "--uw-color-primary"],
  ["primaryContrast", "--uw-color-primary-contrast"],
  ["accent", "--uw-color-accent"],
  ["support", "--uw-color-support"],
  ["text", "--uw-color-text"],
  ["textMuted", "--uw-color-text-muted"],
  ["surface", "--uw-color-surface"],
  ["surfaceMuted", "--uw-color-surface-muted"],
];

/** CSS custom properties for one brand, to set on the root element (`style` of `<html>`). */
export function temporaryBrandCssVariables(brand: Brand): Record<string, string> {
  const colors = TEMPORARY_BRAND_COLORS[brand];
  const variables: Record<string, string> = { ...SCALE };
  for (const [role, variable] of ROLE_VARIABLES) {
    variables[variable] = colors[role];
  }
  return variables;
}

/** The same variables as a `:root` rule, for a `<style>` element in the root layout. */
export function temporaryBrandCss(brand: Brand): string {
  const declarations = Object.entries(temporaryBrandCssVariables(brand))
    .map(([name, value]) => `${name}:${value}`)
    .join(";");
  return `:root{${declarations}}`;
}
