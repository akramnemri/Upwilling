import { describe, expect, it } from "vitest";

import { contrastRatio } from "./contrast.ts";

describe("contrastRatio", () => {
  it("matches the WCAG reference values", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#FFFFFF", "#000000")).toBeCloseTo(21, 5);
    expect(contrastRatio("#389840", "#389840")).toBe(1);
  });

  it("confirms the raw brand green and orange are too light for text on white (04 §2)", () => {
    expect(contrastRatio("#389840", "#FFFFFF")).toBeLessThan(4.5);
    expect(contrastRatio("#F89808", "#FFFFFF")).toBeLessThan(3);
  });

  it("refuses anything but #RRGGBB", () => {
    expect(() => contrastRatio("#FFF", "#000000")).toThrow("#RRGGBB");
    expect(() => contrastRatio("green", "#000000")).toThrow("#RRGGBB");
  });
});
