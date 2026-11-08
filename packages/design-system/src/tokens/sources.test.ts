import { describe, expect, it } from "vitest";

import { parseTokenSources, SCALE_STEPS } from "./sources.ts";
import { realTokenFiles, setInFile } from "./token-files.fixture.ts";

describe("parseTokenSources — the real token files", () => {
  const sources = parseTokenSources(realTokenFiles());

  it("reads the ladder, both brands and the roles in file order", () => {
    expect(sources.colors.scale.map(({ step }) => step)).toEqual([...SCALE_STEPS]);
    expect(sources.brandPalettes.upwilling).toEqual({
      primary: "green",
      accent: "orange",
      support: "green",
    });
    expect(sources.brandPalettes.careerboost.primary).toBe("blue");
    expect(sources.semantic.roles[0]?.[0]).toBe("surface");
  });

  it("expands every contrast pair to one foreground and one background", () => {
    expect(sources.semantic.contrastPairs).toContainEqual({
      foreground: "primary",
      background: "surface",
      min: 4.5,
    });
  });
});

describe("parseTokenSources — mistakes in the files", () => {
  const parseWith = (change: (files: Map<string, unknown>) => void) => () => {
    const files = realTokenFiles();
    change(files);
    return parseTokenSources(files);
  };

  it("refuses a missing file", () => {
    expect(parseWith((files) => files.delete("semantic/color.json"))).toThrow(
      "semantic/color.json: missing file",
    );
  });

  it("refuses a brand file that is not a known brand (VLAB is out of scope)", () => {
    expect(parseWith((files) => files.set("brands/vlab.json", {}))).toThrow(
      "brands/vlab.json: unexpected file",
    );
  });

  it("refuses a color that is not #RRGGBB", () => {
    expect(
      parseWith((files) => setInFile(files, "base/color.json", ["sourceColors", "green"], "#383")),
    ).toThrow('base/color.json sourceColors.green: expected #RRGGBB, got "#383"');
  });

  it("refuses a brand palette pointing to an unknown source color", () => {
    expect(
      parseWith((files) =>
        setInFile(files, "brands/careerboost.json", ["palettes", "primary"], "purple"),
      ),
    ).toThrow('unknown source color "purple"');
  });

  it("refuses a brand file without exactly primary, accent and support", () => {
    expect(
      parseWith((files) =>
        setInFile(files, "brands/upwilling.json", ["palettes"], { primary: "green" }),
      ),
    ).toThrow("expected exactly primary, accent, support (missing: accent, support");
  });

  it("refuses a value that could break out of its CSS declaration", () => {
    expect(
      parseWith((files) =>
        setInFile(files, "base/spacing.json", ["space", "4"], "1rem; } body { display: none"),
      ),
    ).toThrow("may not contain");
  });

  it("refuses a ladder whose lightness does not decrease", () => {
    expect(
      parseWith((files) =>
        setInFile(files, "base/color.json", ["scale", "600"], { lightness: 0.9, chroma: 1 }),
      ),
    ).toThrow("base/color.json scale.600: lightness must decrease");
  });

  it("refuses an unknown palette step", () => {
    expect(
      parseWith((files) =>
        setInFile(files, "semantic/color.json", ["roles", "border"], {
          palette: "neutral",
          step: "250",
        }),
      ),
    ).toThrow('semantic/color.json roles.border.step: expected "source" or one of');
  });

  it("refuses a fluid size whose minimum is larger than its maximum", () => {
    expect(
      parseWith((files) => setInFile(files, "base/typography.json", ["font-size", "lg"], [2, 1])),
    ).toThrow("min ≤ max");
  });
});
