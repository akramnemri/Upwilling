import { describe, expect, it } from "vitest";

import { BRANDS } from "../brands.ts";
import { contrastRatio } from "../contrast.ts";
import { resolveBrandColors } from "./resolve-colors.ts";
import { parseTokenSources } from "./sources.ts";
import { realTokenFiles, setInFile } from "./token-files.fixture.ts";

const PRIMARY_BACKGROUNDS = ["surface", "surface-raised", "surface-muted", "primary-contrast"];

describe("resolveBrandColors — the real tokens", () => {
  const sources = parseTokenSources(realTokenFiles());

  for (const brand of BRANDS) {
    const { palettes, roles } = resolveBrandColors(brand, sources);
    const role = (name: string) => {
      const value = roles[name];
      if (value === undefined) {
        throw new Error(`${brand} has no role "${name}"`);
      }
      return value;
    };

    it(`${brand}: primary is the lightest step of its palette that reaches 4.5:1`, () => {
      const steps = palettes.primary?.steps ?? [];
      const index = steps.findIndex(({ hex }) => hex === role("primary").hex);
      expect(index).toBeGreaterThan(0);
      const lighter = steps[index - 1]?.hex ?? "";
      const lighterPasses = PRIMARY_BACKGROUNDS.every(
        (background) => contrastRatio(lighter, role(background).hex) >= 4.5,
      );
      expect(lighterPasses).toBe(false);
    });

    it(`${brand}: primary-hover is the next darker step of the same palette`, () => {
      const [palette, step] = role("primary").origin.split(" ");
      const steps = palettes.primary?.steps.map((entry) => entry.step) ?? [];
      const nextStep = steps[steps.findIndex((entry) => entry === step) + 1];
      expect(role("primary-hover").origin).toBe(`${palette} ${nextStep}`);
    });

    it(`${brand}: accent is the exact logo orange (decoration, never text)`, () => {
      expect(role("accent")).toEqual({ hex: "#F89808", origin: "accent source" });
    });
  }
});

describe("resolveBrandColors — refusals", () => {
  const resolveWith = (change: (files: Map<string, unknown>) => void) => () => {
    const files = realTokenFiles();
    change(files);
    return resolveBrandColors("careerboost", parseTokenSources(files));
  };

  it("refuses a rule that refers to a role defined below it", () => {
    expect(
      resolveWith((files) =>
        setInFile(
          files,
          "semantic/color.json",
          ["roles", "text-muted", "lightestStepWithContrast", "against"],
          ["primary"],
        ),
      ),
    ).toThrow('careerboost: role "text-muted": refers to "primary", which is not defined above it');
  });

  it("refuses a contrast no step can reach", () => {
    expect(
      resolveWith((files) =>
        setInFile(
          files,
          "semantic/color.json",
          ["roles", "primary", "lightestStepWithContrast", "min"],
          21,
        ),
      ),
    ).toThrow('role "primary": no step of palette "primary" reaches 21:1');
  });

  it("refuses to emit a theme with a failing contrast pair", () => {
    expect(
      resolveWith((files) =>
        setInFile(
          files,
          "semantic/color.json",
          ["contrastPairs"],
          [{ foreground: "accent", min: 4.5, backgrounds: ["surface"] }],
        ),
      ),
    ).toThrow(/careerboost: accent on surface is 2\.\d\d:1, below 4\.5:1/);
  });

  it("refuses a darker step of a role that is not a palette step", () => {
    expect(
      resolveWith((files) =>
        setInFile(files, "semantic/color.json", ["roles", "primary-hover"], {
          darkerThan: "surface",
          steps: 1,
        }),
      ),
    ).toThrow('"surface" is not a palette step');
  });
});
