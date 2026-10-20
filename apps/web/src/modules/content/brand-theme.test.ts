import {
  BRANDS,
  contrastRatio,
  TEMPORARY_BRAND_COLORS,
  temporaryBrandCss,
  TEXT_COLOR_PAIRS,
} from "@upwilling/design-system";
import { describe, expect, it } from "vitest";

// Lives in apps/web until the design-system package gets its own test setup (Task 2.1, token pipeline).
const WCAG_AA_NORMAL_TEXT = 4.5;

describe("contrastRatio", () => {
  it("matches the WCAG reference values", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#FFFFFF", "#000000")).toBeCloseTo(21, 5);
    expect(contrastRatio("#389840", "#389840")).toBe(1);
  });

  it("confirms the raw brand green and orange are too light for text on white (04 §2)", () => {
    expect(contrastRatio("#389840", "#FFFFFF")).toBeLessThan(WCAG_AA_NORMAL_TEXT);
    expect(contrastRatio("#F89808", "#FFFFFF")).toBeLessThan(3);
  });

  it("refuses anything but #RRGGBB", () => {
    expect(() => contrastRatio("#FFF", "#000000")).toThrow("#RRGGBB");
    expect(() => contrastRatio("green", "#000000")).toThrow("#RRGGBB");
  });
});

describe("temporary brand theme", () => {
  for (const brand of BRANDS) {
    for (const [foreground, background] of TEXT_COLOR_PAIRS) {
      it(`${brand}: ${foreground} on ${background} reaches WCAG AA (4.5:1)`, () => {
        const colors = TEMPORARY_BRAND_COLORS[brand];
        expect(contrastRatio(colors[foreground], colors[background])).toBeGreaterThanOrEqual(
          WCAG_AA_NORMAL_TEXT,
        );
      });
    }
  }

  it("gives each brand its own primary color (green academy, blue association)", () => {
    expect(TEMPORARY_BRAND_COLORS.upwilling.primary).not.toBe(
      TEMPORARY_BRAND_COLORS.careerboost.primary,
    );
  });

  it("renders every role as a --uw- CSS variable in one :root rule", () => {
    const css = temporaryBrandCss("careerboost");
    expect(css.startsWith(":root{")).toBe(true);
    expect(css).toContain(`--uw-color-primary:${TEMPORARY_BRAND_COLORS.careerboost.primary}`);
    expect(css).toContain("--uw-color-text-muted:");
    expect(css).toContain("--uw-space-4:");
    // The value is injected in a <style> element: it must not be able to close it.
    expect(css).not.toContain("<");
  });
});
