import { BRANDS, type Brand, mapBrands } from "../brands.ts";
import { isHexColor } from "../color/oklch.ts";

/**
 * Reads the token source files (`tokens/**.json`) into typed values. The files are edited by hand,
 * so every mistake must fail the generator with the file and the key, never produce a broken theme.
 */

export const SCALE_STEPS = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
] as const;
export type ScaleStep = (typeof SCALE_STEPS)[number];

/** Palettes every brand file must map to a source color (04_DESIGN_SYSTEM.md §2). */
export const BRAND_PALETTES = ["primary", "accent", "support"] as const;

export function isScaleStep(value: string): value is ScaleStep {
  return (SCALE_STEPS as readonly string[]).includes(value);
}

export interface LadderStep {
  step: ScaleStep;
  /** OKLCH lightness of this step, 0–1. */
  lightness: number;
  /** Factor applied to the source color's chroma. */
  chroma: number;
}

export interface ColorSources {
  constants: Readonly<Record<string, string>>;
  sourceColors: Readonly<Record<string, string>>;
  /** One entry per step, from 50 (lightest) to 950. */
  scale: readonly LadderStep[];
}

export type ColorRule =
  | { kind: "constant"; constant: string }
  | { kind: "step"; palette: string; step: ScaleStep | "source" }
  | {
      kind: "lightest-step-with-contrast";
      palette: string;
      min: number;
      against: readonly string[];
    }
  | { kind: "darker-than"; role: string; steps: number };

export interface ContrastPair {
  foreground: string;
  background: string;
  min: number;
}

export interface SemanticColorSources {
  /** Palettes shared by every brand: palette name → source color name. */
  palettes: Readonly<Record<string, string>>;
  /** In file order: a rule may only refer to roles defined above it. */
  roles: readonly (readonly [string, ColorRule])[];
  contrastPairs: readonly ContrastPair[];
}

/** A [min, max] pair is a fluid size in rem. */
export type BaseValue = string | number | readonly [number, number];

export interface BaseGroup {
  name: string;
  values: readonly (readonly [string, BaseValue])[];
}

export interface TokenSources {
  colors: ColorSources;
  baseGroups: readonly BaseGroup[];
  brandPalettes: Readonly<Record<Brand, Readonly<Record<string, string>>>>;
  semantic: SemanticColorSources;
}

const COLOR_FILE = "base/color.json";
const SEMANTIC_FILE = "semantic/color.json";
const IDENTIFIER = /^[a-z][a-z0-9-]*$/;
const TOKEN_NAME = /^[a-z0-9][a-z0-9-]*$/;
// Values are written into a stylesheet: refuse anything that could end a declaration or a rule.
const UNSAFE_CSS_VALUE = /[;{}<>\\]/;

export class TokenSourceError extends Error {
  constructor(where: string, problem: string) {
    super(`${where}: ${problem}`);
    this.name = "TokenSourceError";
  }
}

/**
 * @param files parsed JSON by path relative to `tokens/`, with forward slashes (`base/color.json`).
 */
export function parseTokenSources(files: ReadonlyMap<string, unknown>): TokenSources {
  const expectedBrandFiles = new Set(BRANDS.map((brand) => `brands/${brand}.json`));
  const baseGroupFiles: string[] = [];
  for (const path of files.keys()) {
    if (path === COLOR_FILE || path === SEMANTIC_FILE || expectedBrandFiles.has(path)) {
      continue;
    }
    if (/^base\/[a-z0-9-]+\.json$/.test(path)) {
      baseGroupFiles.push(path);
      continue;
    }
    throw new TokenSourceError(
      path,
      `unexpected file (brands are ${BRANDS.join(", ")}; semantic roles live in ${SEMANTIC_FILE})`,
    );
  }

  const colors = parseColorSources(requireFile(files, COLOR_FILE), COLOR_FILE);
  const baseGroups = baseGroupFiles
    .sort()
    .flatMap((path) => parseBaseGroups(files.get(path), path));
  assertUniqueBaseGroups(baseGroups);

  const brandPalettes = mapBrands((brand) => {
    const path = `brands/${brand}.json`;
    return parseBrandPalettes(requireFile(files, path), path, colors);
  });

  const semantic = parseSemanticColors(requireFile(files, SEMANTIC_FILE), SEMANTIC_FILE, colors);
  return { colors, baseGroups, brandPalettes, semantic };
}

function parseColorSources(raw: unknown, path: string): ColorSources {
  const file = readObject(raw, path);
  const constants = readHexMap(file.constants, `${path} constants`);
  const sourceColors = readHexMap(file.sourceColors, `${path} sourceColors`);

  const rawScale = readObject(file.scale, `${path} scale`);
  assertExactKeys(rawScale, SCALE_STEPS, `${path} scale`);
  const scale: LadderStep[] = [];
  let previousLightness = Number.POSITIVE_INFINITY;
  for (const step of SCALE_STEPS) {
    const where = `${path} scale.${step}`;
    const entry = readObject(rawScale[step], where);
    const lightness = readNumber(entry.lightness, `${where}.lightness`, 0, 1);
    const chroma = readNumber(entry.chroma, `${where}.chroma`, 0, 2);
    if (lightness >= previousLightness) {
      throw new TokenSourceError(where, "lightness must decrease from 50 to 950");
    }
    previousLightness = lightness;
    scale.push({ step, lightness, chroma });
  }
  return { constants, sourceColors, scale };
}

function parseBaseGroups(raw: unknown, path: string): BaseGroup[] {
  const file = readObject(raw, path);
  return Object.entries(file)
    .filter(([key]) => !key.startsWith("$"))
    .map(([group, rawValues]) => {
      const where = `${path} ${group}`;
      assertIdentifier(group, where);
      const values = Object.entries(readObject(rawValues, where)).map(
        ([name, value]) => [name, readBaseValue(name, value, `${where}.${name}`)] as const,
      );
      return { name: group, values };
    });
}

function readBaseValue(name: string, value: unknown, where: string): BaseValue {
  if (!TOKEN_NAME.test(name)) {
    throw new TokenSourceError(where, "token names use lowercase letters, digits and dashes");
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    if (UNSAFE_CSS_VALUE.test(value)) {
      throw new TokenSourceError(where, "a value may not contain ; { } < > or \\");
    }
    return value;
  }
  if (Array.isArray(value) && value.length === 2) {
    const min = readNumber(value[0], `${where}[0]`, 0, 100);
    const max = readNumber(value[1], `${where}[1]`, 0, 100);
    if (min > max) {
      throw new TokenSourceError(where, "a fluid size is [min, max] with min ≤ max");
    }
    return [min, max];
  }
  throw new TokenSourceError(where, "expected a string, a number or a [min, max] pair in rem");
}

function assertUniqueBaseGroups(groups: readonly BaseGroup[]): void {
  const seen = new Set<string>();
  for (const group of groups) {
    if (seen.has(group.name)) {
      throw new TokenSourceError(`base/*.json ${group.name}`, "group defined twice");
    }
    seen.add(group.name);
  }
}

function parseBrandPalettes(
  raw: unknown,
  path: string,
  colors: ColorSources,
): Record<string, string> {
  const palettes = readObject(readObject(raw, path).palettes, `${path} palettes`);
  assertExactKeys(palettes, BRAND_PALETTES, `${path} palettes`);
  return readSourceColorMap(palettes, `${path} palettes`, colors);
}

function parseSemanticColors(
  raw: unknown,
  path: string,
  colors: ColorSources,
): SemanticColorSources {
  const file = readObject(raw, path);
  const palettes = readSourceColorMap(
    readObject(file.palettes, `${path} palettes`),
    `${path} palettes`,
    colors,
  );
  for (const name of BRAND_PALETTES) {
    if (name in palettes) {
      throw new TokenSourceError(
        `${path} palettes.${name}`,
        "brand palettes belong in brands/*.json",
      );
    }
  }

  const roles = Object.entries(readObject(file.roles, `${path} roles`)).map(([role, rawRule]) => {
    const where = `${path} roles.${role}`;
    assertIdentifier(role, where);
    return [role, readColorRule(rawRule, where)] as const;
  });

  const rawPairs = file.contrastPairs;
  if (!Array.isArray(rawPairs)) {
    throw new TokenSourceError(`${path} contrastPairs`, "expected an array");
  }
  const contrastPairs = rawPairs.flatMap((rawPair: unknown, index) => {
    const where = `${path} contrastPairs[${index}]`;
    const pair = readObject(rawPair, where);
    const foreground = readString(pair.foreground, `${where}.foreground`);
    const min = readNumber(pair.min, `${where}.min`, 1, 21);
    return readStringArray(pair.backgrounds, `${where}.backgrounds`).map((background) => ({
      foreground,
      background,
      min,
    }));
  });

  return { palettes, roles, contrastPairs };
}

function readColorRule(raw: unknown, where: string): ColorRule {
  const rule = readObject(raw, where);
  if ("constant" in rule) {
    return { kind: "constant", constant: readString(rule.constant, `${where}.constant`) };
  }
  if ("darkerThan" in rule) {
    return {
      kind: "darker-than",
      role: readString(rule.darkerThan, `${where}.darkerThan`),
      steps: readNumber(rule.steps, `${where}.steps`, 1, SCALE_STEPS.length - 1),
    };
  }
  const palette = readString(rule.palette, `${where}.palette`);
  if ("lightestStepWithContrast" in rule) {
    const pick = readObject(rule.lightestStepWithContrast, `${where}.lightestStepWithContrast`);
    return {
      kind: "lightest-step-with-contrast",
      palette,
      min: readNumber(pick.min, `${where}.lightestStepWithContrast.min`, 1, 21),
      against: readStringArray(pick.against, `${where}.lightestStepWithContrast.against`),
    };
  }
  const step = readString(rule.step, `${where}.step`);
  if (step !== "source" && !isScaleStep(step)) {
    throw new TokenSourceError(
      `${where}.step`,
      `expected "source" or one of ${SCALE_STEPS.join(", ")}`,
    );
  }
  return { kind: "step", palette, step };
}

function readSourceColorMap(
  map: Record<string, unknown>,
  where: string,
  colors: ColorSources,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(map).map(([palette, value]) => {
      assertIdentifier(palette, `${where}.${palette}`);
      const source = readString(value, `${where}.${palette}`);
      if (!(source in colors.sourceColors)) {
        throw new TokenSourceError(`${where}.${palette}`, `unknown source color "${source}"`);
      }
      return [palette, source];
    }),
  );
}

function readHexMap(raw: unknown, where: string): Record<string, string> {
  return Object.fromEntries(
    Object.entries(readObject(raw, where)).map(([name, value]) => {
      assertIdentifier(name, `${where}.${name}`);
      const hex = readString(value, `${where}.${name}`);
      if (!isHexColor(hex)) {
        throw new TokenSourceError(`${where}.${name}`, `expected #RRGGBB, got "${hex}"`);
      }
      return [name, hex.toUpperCase()];
    }),
  );
}

function requireFile(files: ReadonlyMap<string, unknown>, path: string): unknown {
  if (!files.has(path)) {
    throw new TokenSourceError(path, "missing file");
  }
  return files.get(path);
}

function readObject(value: unknown, where: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TokenSourceError(where, "expected an object");
  }
  return value as Record<string, unknown>;
}

function readString(value: unknown, where: string): string {
  if (typeof value !== "string" || value === "") {
    throw new TokenSourceError(where, "expected a non-empty string");
  }
  return value;
}

function readStringArray(value: unknown, where: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new TokenSourceError(where, "expected a non-empty array of strings");
  }
  return value.map((item: unknown, index) => readString(item, `${where}[${index}]`));
}

function readNumber(value: unknown, where: string, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    throw new TokenSourceError(where, `expected a number from ${min} to ${max}`);
  }
  return value;
}

function assertIdentifier(name: string, where: string): void {
  if (!IDENTIFIER.test(name)) {
    throw new TokenSourceError(where, "names use lowercase letters, digits and dashes");
  }
}

function assertExactKeys(
  object: Record<string, unknown>,
  expected: readonly string[],
  where: string,
): void {
  const keys = Object.keys(object).filter((key) => !key.startsWith("$"));
  const missing = expected.filter((key) => !keys.includes(key));
  const unknown = keys.filter((key) => !expected.includes(key));
  if (missing.length > 0 || unknown.length > 0) {
    throw new TokenSourceError(
      where,
      `expected exactly ${expected.join(", ")} (missing: ${missing.join(", ") || "none"}; unknown: ${unknown.join(", ") || "none"})`,
    );
  }
}
