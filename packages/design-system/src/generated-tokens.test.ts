import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { BRANDS } from "./brands.ts";
import { contrastRatio } from "./contrast.ts";
import { colorRoleVariable, paletteStepVariable } from "./css-variables.ts";
import {
  BRAND_TOKENS,
  COLOR_ROLES,
  type ColorRole,
  CONTRAST_PAIRS,
  PALETTES,
} from "./generated/tokens.ts";
import { buildTokenFiles, GENERATED_CSS_PATH } from "./tokens/render.ts";
import { parseTokenSources, SCALE_STEPS } from "./tokens/sources.ts";
import { PACKAGE_ROOT, realTokenFiles, setInFile } from "./tokens/token-files.fixture.ts";

// Roles that never carry text or a UI component on their own: backgrounds and decoration.
// Every other role must appear as the foreground of at least one contrast pair.
const ROLES_WITHOUT_CONTRAST_DUTY: readonly ColorRole[] = [
  "surface",
  "surface-raised",
  "surface-muted",
  "success-surface",
  "warning-surface",
  "danger-surface",
  "info-surface",
  "border",
  "accent",
  "support",
];

const committedCss = readFileSync(join(PACKAGE_ROOT, GENERATED_CSS_PATH), "utf8");

describe("generated token files", () => {
  it("are up to date with tokens/ (run `pnpm --filter @upwilling/design-system tokens`)", () => {
    for (const { path, content } of buildTokenFiles(parseTokenSources(realTokenFiles()))) {
      const committed = readFileSync(join(PACKAGE_ROOT, path), "utf8").replaceAll("\r\n", "\n");
      expect(committed, `${path} is out of date`).toBe(content);
    }
  });

  it("define every role and every palette step in each brand block", () => {
    for (const brand of BRANDS) {
      const block = brandBlock(committedCss, brand);
      for (const role of COLOR_ROLES) {
        expect(block).toContain(`${colorRoleVariable(role)}: ${BRAND_TOKENS[brand].colors[role]};`);
      }
      for (const palette of PALETTES) {
        for (const step of SCALE_STEPS) {
          expect(block).toContain(`${paletteStepVariable(palette, step)}: #`);
        }
      }
    }
  });

  it("switch every duration off under prefers-reduced-motion", () => {
    expect(committedCss).toMatch(
      /@media \(prefers-reduced-motion: reduce\) \{\s*:root \{\s*--uw-duration-fast: 0ms;\s*--uw-duration-base: 0ms;\s*--uw-duration-slow: 0ms;/,
    );
  });
});

describe("contrast of every role pair (WCAG AA)", () => {
  for (const brand of BRANDS) {
    for (const { foreground, background, min } of CONTRAST_PAIRS) {
      it(`${brand}: ${foreground} on ${background} reaches ${min}:1`, () => {
        const colors = BRAND_TOKENS[brand].colors;
        expect(contrastRatio(colors[foreground], colors[background])).toBeGreaterThanOrEqual(min);
      });
    }
  }

  it("covers every role that carries text or a UI component", () => {
    const checked = new Set(CONTRAST_PAIRS.map(({ foreground }) => foreground));
    const unchecked = COLOR_ROLES.filter(
      (role) => !checked.has(role) && !ROLES_WITHOUT_CONTRAST_DUTY.includes(role),
    );
    expect(unchecked).toEqual([]);
  });
});

// Essai 2 (05_ROADMAP.md M2): one base value changes both sites; Career Boost's blue stays specific.
describe("propagation from the token sources", () => {
  const build = (change?: (files: Map<string, unknown>) => void) => {
    const files = realTokenFiles();
    change?.(files);
    const css = buildTokenFiles(parseTokenSources(files)).find(
      ({ path }) => path === GENERATED_CSS_PATH,
    )?.content;
    if (css === undefined) {
      throw new Error("The stylesheet was not generated");
    }
    return css;
  };
  const role = (css: string, brand: string, name: string) =>
    new RegExp(`${colorRoleVariable(name)}: (#[0-9A-F]{6});`).exec(brandBlock(css, brand))?.[1];

  const before = build();

  it("a shared base color changes both brands", () => {
    const after = build((files) =>
      setInFile(files, "base/color.json", ["sourceColors", "orange"], "#F07800"),
    );
    for (const brand of BRANDS) {
      expect(role(after, brand, "accent")).toBe("#F07800");
      expect(role(before, brand, "accent")).toBe("#F89808");
    }
  });

  it("a shared base size changes both brands (one :root block)", () => {
    const after = build((files) =>
      setInFile(files, "base/spacing.json", ["space", "4"], "1.125rem"),
    );
    expect(after).toContain("--uw-space-4: 1.125rem;");
    expect(after.match(/--uw-space-4:/g)).toHaveLength(1);
  });

  it("the academy green does not touch Career Boost's blue primary", () => {
    const after = build((files) =>
      setInFile(files, "base/color.json", ["sourceColors", "green"], "#2A7A30"),
    );
    expect(role(after, "upwilling", "primary")).not.toBe(role(before, "upwilling", "primary"));
    expect(role(after, "careerboost", "primary")).toBe(role(before, "careerboost", "primary"));
  });
});

function brandBlock(css: string, brand: string): string {
  const start = css.indexOf(`[data-brand="${brand}"] {`);
  const end = css.indexOf("}", start);
  if (start === -1 || end === -1) {
    throw new Error(`No block for brand "${brand}" in the stylesheet`);
  }
  return css.slice(start, end);
}
