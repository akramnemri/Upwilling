import { describe, expect, it } from "vitest";

import { clampChromaToGamut, hexToOklch, oklchToHex } from "./oklch.ts";

// Reference values: the sRGB primaries in OKLCH, as given by CSS Color 4 and the OKLab reference code.
const REFERENCES = [
  { hex: "#FF0000", l: 0.62796, c: 0.25768, h: 29.2339 },
  { hex: "#00FF00", l: 0.86644, c: 0.29483, h: 142.4953 },
  { hex: "#0000FF", l: 0.45201, c: 0.31321, h: 264.052 },
] as const;

describe("hexToOklch", () => {
  for (const { hex, l, c, h } of REFERENCES) {
    it(`converts ${hex} like the reference`, () => {
      const color = hexToOklch(hex);
      expect(color.l).toBeCloseTo(l, 4);
      expect(color.c).toBeCloseTo(c, 4);
      expect(color.h).toBeCloseTo(h, 2);
    });
  }

  it("puts white at lightness 1 and black at 0, both without chroma", () => {
    expect(hexToOklch("#FFFFFF").l).toBeCloseTo(1, 4);
    expect(hexToOklch("#FFFFFF").c).toBeLessThan(1e-4);
    expect(hexToOklch("#000000").l).toBeCloseTo(0, 6);
  });

  it("refuses anything but #RRGGBB", () => {
    expect(() => hexToOklch("#FFF")).toThrow("#RRGGBB");
    expect(() => hexToOklch("rgb(0 0 0)")).toThrow("#RRGGBB");
  });
});

describe("oklchToHex", () => {
  it("round-trips the brand colors exactly", () => {
    for (const hex of ["#389840", "#F89808", "#0070D8", "#4B5666"]) {
      expect(oklchToHex(hexToOklch(hex))).toBe(hex);
    }
  });

  it("brings an out-of-gamut color into sRGB by lowering chroma only", () => {
    const tooVivid = { l: 0.9, c: 0.3, h: 145 };
    const clamped = clampChromaToGamut(tooVivid);
    expect(clamped.c).toBeLessThan(tooVivid.c);
    expect(clamped.c).toBeGreaterThan(0);
    expect(clamped.l).toBe(tooVivid.l);
    expect(clamped.h).toBe(tooVivid.h);

    const result = hexToOklch(oklchToHex(tooVivid));
    expect(result.l).toBeCloseTo(0.9, 2);
    expect(result.h).toBeCloseTo(145, 0);
  });

  it("leaves an in-gamut color untouched", () => {
    const color = { l: 0.6, c: 0.05, h: 250 };
    expect(clampChromaToGamut(color)).toBe(color);
  });
});
