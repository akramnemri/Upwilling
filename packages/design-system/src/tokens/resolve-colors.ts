import type { Brand } from "../brands.ts";
import { buildPalette, type Palette } from "../color/scale.ts";
import { contrastRatio } from "../contrast.ts";
import type { ColorRule, TokenSources } from "./sources.ts";

export interface ResolvedColor {
  hex: string;
  /** Where the value comes from, for people: "primary 600", "accent source", "white". */
  origin: string;
}

export interface BrandColors {
  /** Brand palettes first (primary, accent, support), then the shared ones, in source order. */
  palettes: Readonly<Record<string, Palette>>;
  /** Every role, in source order. */
  roles: Readonly<Record<string, ResolvedColor>>;
}

export class TokenResolutionError extends Error {
  constructor(brand: Brand, problem: string) {
    super(`${brand}: ${problem}`);
    this.name = "TokenResolutionError";
  }
}

// A role resolved from a palette remembers its position, so `darkerThan` can move along that palette.
interface RoleValue extends ResolvedColor {
  position: { palette: string; index: number } | null;
}

/**
 * Resolves every color role of one brand and checks every declared contrast pair. Throws instead of
 * returning a theme that fails WCAG AA: a failing brand never reaches the stylesheet.
 */
export function resolveBrandColors(brand: Brand, sources: TokenSources): BrandColors {
  const paletteSources = { ...sources.brandPalettes[brand], ...sources.semantic.palettes };
  const palettes: Record<string, Palette> = {};
  for (const [name, sourceName] of Object.entries(paletteSources)) {
    const sourceHex = sources.colors.sourceColors[sourceName];
    if (sourceHex === undefined) {
      throw new TokenResolutionError(brand, `palette "${name}": unknown source "${sourceName}"`);
    }
    palettes[name] = buildPalette(sourceHex, sources.colors.scale);
  }

  const roles = new Map<string, RoleValue>();
  for (const [role, rule] of sources.semantic.roles) {
    roles.set(role, resolveRule(rule, { brand, role, palettes, roles, sources }));
  }

  assertContrastPairs(brand, roles, sources);

  return {
    palettes,
    roles: Object.fromEntries(
      [...roles].map(([role, { hex, origin }]) => [role, { hex, origin }] as const),
    ),
  };
}

interface RuleContext {
  brand: Brand;
  role: string;
  palettes: Readonly<Record<string, Palette>>;
  roles: ReadonlyMap<string, RoleValue>;
  sources: TokenSources;
}

function resolveRule(rule: ColorRule, context: RuleContext): RoleValue {
  const { brand, role, roles } = context;
  const fail = (problem: string) => new TokenResolutionError(brand, `role "${role}": ${problem}`);

  switch (rule.kind) {
    case "constant": {
      const hex = context.sources.colors.constants[rule.constant];
      if (hex === undefined) {
        throw fail(`unknown constant "${rule.constant}"`);
      }
      return { hex, origin: rule.constant, position: null };
    }
    case "step": {
      const palette = paletteOrFail(rule.palette, context, fail);
      if (rule.step === "source") {
        return { hex: palette.source, origin: `${rule.palette} source`, position: null };
      }
      const index = palette.steps.findIndex(({ step }) => step === rule.step);
      return stepValue(rule.palette, palette, index);
    }
    case "lightest-step-with-contrast": {
      const palette = paletteOrFail(rule.palette, context, fail);
      const backgrounds = rule.against.map((other) => {
        const value = roles.get(other);
        if (value === undefined) {
          throw fail(`refers to "${other}", which is not defined above it`);
        }
        return value.hex;
      });
      const index = palette.steps.findIndex(({ hex }) =>
        backgrounds.every((background) => contrastRatio(hex, background) >= rule.min),
      );
      if (index === -1) {
        throw fail(
          `no step of palette "${rule.palette}" reaches ${rule.min}:1 against ${rule.against.join(", ")}`,
        );
      }
      return stepValue(rule.palette, palette, index);
    }
    case "darker-than": {
      const base = roles.get(rule.role);
      if (base === undefined) {
        throw fail(`refers to "${rule.role}", which is not defined above it`);
      }
      if (base.position === null) {
        throw fail(`"${rule.role}" is not a palette step, so it has no darker step`);
      }
      const palette = paletteOrFail(base.position.palette, context, fail);
      const index = base.position.index + rule.steps;
      if (index >= palette.steps.length) {
        throw fail(`"${rule.role}" has no step ${rule.steps} darker in its palette`);
      }
      return stepValue(base.position.palette, palette, index);
    }
  }
}

function paletteOrFail(
  name: string,
  context: RuleContext,
  fail: (problem: string) => Error,
): Palette {
  const palette = context.palettes[name];
  if (palette === undefined) {
    throw fail(`unknown palette "${name}"`);
  }
  return palette;
}

function stepValue(paletteName: string, palette: Palette, index: number): RoleValue {
  const entry = palette.steps[index];
  if (entry === undefined) {
    // Only reachable through a bug here: steps are validated before resolution.
    throw new Error(`Palette "${paletteName}" has no step at index ${index}`);
  }
  return {
    hex: entry.hex,
    origin: `${paletteName} ${entry.step}`,
    position: { palette: paletteName, index },
  };
}

function assertContrastPairs(
  brand: Brand,
  roles: ReadonlyMap<string, RoleValue>,
  sources: TokenSources,
): void {
  const failures: string[] = [];
  for (const { foreground, background, min } of sources.semantic.contrastPairs) {
    const front = roles.get(foreground);
    const back = roles.get(background);
    if (front === undefined || back === undefined) {
      failures.push(`contrast pair ${foreground} / ${background} names an unknown role`);
      continue;
    }
    const ratio = contrastRatio(front.hex, back.hex);
    if (ratio < min) {
      failures.push(`${foreground} on ${background} is ${ratio.toFixed(2)}:1, below ${min}:1`);
    }
  }
  if (failures.length > 0) {
    throw new TokenResolutionError(brand, failures.join("; "));
  }
}
