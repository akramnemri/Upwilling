import { type Brand, BRANDS, mapBrands } from "../brands.ts";
import { baseTokenVariable, colorRoleVariable, paletteStepVariable } from "../css-variables.ts";
import { type BrandColors, resolveBrandColors } from "./resolve-colors.ts";
import type { BaseValue, TokenSources } from "./sources.ts";

/** Generated files, by path relative to the package root. Never edited by hand. */
export const GENERATED_CSS_PATH = "css/tokens.css";
export const GENERATED_TS_PATH = "src/generated/tokens.ts";

const REGENERATE_COMMAND = "pnpm --filter @upwilling/design-system tokens";

// Fluid sizes grow linearly between a 360 px and a 1280 px wide viewport (in rem at 16 px).
const FLUID_VIEWPORT_MIN_REM = 22.5;
const FLUID_VIEWPORT_MAX_REM = 80;

export interface GeneratedFile {
  path: string;
  content: string;
}

/** Resolves both brands and renders the stylesheet and the TypeScript module. Throws on any error. */
export function buildTokenFiles(sources: TokenSources): GeneratedFile[] {
  const brandColors = mapBrands((brand) => resolveBrandColors(brand, sources));
  const baseVariables = sources.baseGroups.map((group) => ({
    group: group.name,
    declarations: group.values.map(
      ([name, value]) => [baseTokenVariable(group.name, name), formatBaseValue(value)] as const,
    ),
  }));

  return [
    { path: GENERATED_CSS_PATH, content: renderCss(baseVariables, brandColors) },
    { path: GENERATED_TS_PATH, content: renderTypeScript(baseVariables, brandColors, sources) },
  ];
}

type BaseVariables = readonly {
  group: string;
  declarations: readonly (readonly [string, string])[];
}[];

function renderCss(
  baseVariables: BaseVariables,
  brandColors: Readonly<Record<Brand, BrandColors>>,
): string {
  const lines = [
    `/* GENERATED from packages/design-system/tokens/ by \`${REGENERATE_COMMAND}\`. Do not edit. */`,
    "",
    ":root {",
    ...baseVariables.flatMap(({ declarations }) => declarations.map(declaration)),
    "}",
    "",
    "@media (prefers-reduced-motion: reduce) {",
    "  :root {",
    ...baseVariables
      .filter(({ group }) => group === "duration")
      .flatMap(({ declarations }) => declarations.map(([name]) => `    ${name}: 0ms;`)),
    "  }",
    "}",
  ];

  for (const brand of BRANDS) {
    const colors = brandColors[brand];
    lines.push(
      "",
      `[data-brand="${brand}"] {`,
      // Light theme only at launch (04 §3): tells the browser to draw form controls and scrollbars light.
      "  color-scheme: light;",
      "  /* Palettes: previews and tints. Text and components use the roles below. */",
      ...Object.entries(colors.palettes).flatMap(([palette, { steps }]) =>
        steps.map(({ step, hex }) => declaration([paletteStepVariable(palette, step), hex])),
      ),
      "  /* Roles */",
      ...Object.entries(colors.roles).map(([role, { hex }]) =>
        declaration([colorRoleVariable(role), hex]),
      ),
      "}",
    );
  }
  return `${lines.join("\n")}\n`;
}

function renderTypeScript(
  baseVariables: BaseVariables,
  brandColors: Readonly<Record<Brand, BrandColors>>,
  sources: TokenSources,
): string {
  const roles = sources.semantic.roles.map(([role]) => role);
  // Every brand has the same palette names: brands/*.json must map exactly primary, accent, support.
  const palettes = Object.keys(brandColors[BRANDS[0]].palettes);

  const brandTokens = Object.fromEntries(
    Object.entries(brandColors).map(([brand, colors]) => [
      brand,
      {
        colors: Object.fromEntries(Object.entries(colors.roles).map(([r, { hex }]) => [r, hex])),
        colorOrigins: Object.fromEntries(
          Object.entries(colors.roles).map(([r, { origin }]) => [r, origin]),
        ),
        palettes: Object.fromEntries(
          Object.entries(colors.palettes).map(([name, { source, steps }]) => [
            name,
            { source, steps: Object.fromEntries(steps.map(({ step, hex }) => [step, hex])) },
          ]),
        ),
      },
    ]),
  );
  const baseTokens = Object.fromEntries(
    baseVariables.map(({ group, declarations }) => [group, Object.fromEntries(declarations)]),
  );

  return `// GENERATED from packages/design-system/tokens/ by \`${REGENERATE_COMMAND}\`. Do not edit.
import type { Brand } from "../brands.ts";

/** Semantic color roles, as \`--uw-color-<role>\`. */
export const COLOR_ROLES = ${json(roles)} as const;
export type ColorRole = (typeof COLOR_ROLES)[number];

/** Palettes, as \`--uw-palette-<palette>-<step>\`. */
export const PALETTES = ${json(palettes)} as const;
export type PaletteName = (typeof PALETTES)[number];

export interface BrandTokens {
  readonly colors: Readonly<Record<ColorRole, string>>;
  /** Where each role's value comes from ("primary 600", "white"), for the preview page. */
  readonly colorOrigins: Readonly<Record<ColorRole, string>>;
  readonly palettes: Readonly<
    Record<PaletteName, { readonly source: string; readonly steps: Readonly<Record<string, string>> }>
  >;
}

export const BRAND_TOKENS: Readonly<Record<Brand, BrandTokens>> = ${json(brandTokens)};

/** Pairs that must reach \`min\`:1 in every brand (WCAG AA: 4.5 for text, 3 for UI components). */
export const CONTRAST_PAIRS: readonly {
  readonly foreground: ColorRole;
  readonly background: ColorRole;
  readonly min: number;
}[] = ${json(sources.semantic.contrastPairs)};

/** Non-color tokens: group → CSS variable → value (same in every brand). */
export const BASE_TOKENS: Readonly<Record<string, Readonly<Record<string, string>>>> = ${json(baseTokens)};
`;
}

function declaration([name, value]: readonly [string, string]): string {
  return `  ${name}: ${value};`;
}

function formatBaseValue(value: BaseValue): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return formatNumber(value);
  }
  const [min, max] = value;
  if (min === max) {
    return `${formatNumber(min)}rem`;
  }
  const slope = (max - min) / (FLUID_VIEWPORT_MAX_REM - FLUID_VIEWPORT_MIN_REM);
  const intercept = min - slope * FLUID_VIEWPORT_MIN_REM;
  const sign = intercept < 0 ? "-" : "+";
  return `clamp(${formatNumber(min)}rem, ${formatNumber(slope * 100)}vw ${sign} ${formatNumber(Math.abs(intercept))}rem, ${formatNumber(max)}rem)`;
}

function formatNumber(value: number): string {
  return String(Number(value.toFixed(4)));
}

function json(value: unknown): string {
  return JSON.stringify(value, null, 2);
}
