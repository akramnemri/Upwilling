import { describe, expect, it } from "vitest";

import { contrastRatio } from "../contrast.ts";
import type { LadderStep } from "../tokens/sources.ts";
import { SCALE_STEPS } from "../tokens/sources.ts";
import { hexToOklch } from "./oklch.ts";
import { buildPalette } from "./scale.ts";

const LADDER: LadderStep[] = SCALE_STEPS.map((step, index) => ({
  step,
  lightness: 0.97 - index * 0.07,
  chroma: 1,
}));

describe("buildPalette", () => {
  const palette = buildPalette("#0070d8", LADDER);

  it("keeps the source color unchanged and uppercase", () => {
    expect(palette.source).toBe("#0070D8");
  });

  it("returns the 11 steps in order, each darker than the one before", () => {
    expect(palette.steps.map(({ step }) => step)).toEqual([...SCALE_STEPS]);
    for (let index = 1; index < palette.steps.length; index += 1) {
      const lighter = palette.steps[index - 1]?.hex ?? "";
      const darker = palette.steps[index]?.hex ?? "";
      expect(contrastRatio(darker, "#FFFFFF")).toBeGreaterThan(contrastRatio(lighter, "#FFFFFF"));
    }
  });

  it("keeps the source hue on every step that has visible color", () => {
    const sourceHue = hexToOklch("#0070D8").h;
    for (const { hex } of palette.steps) {
      const { c, h } = hexToOklch(hex);
      if (c > 0.03) {
        expect(Math.abs(h - sourceHue)).toBeLessThan(3);
      }
    }
  });

  it("builds a grey palette without any tint from a grey source", () => {
    for (const { hex } of buildPalette("#808080", LADDER).steps) {
      expect(hexToOklch(hex).c).toBeLessThan(0.002);
    }
  });
});
