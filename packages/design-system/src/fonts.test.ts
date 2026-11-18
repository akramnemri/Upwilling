import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

import { describe, expect, it } from "vitest";

import { BASE_TOKENS } from "./generated/tokens.ts";

// The font module (fonts/index.ts) only compiles through next/font (Next.js, Storybook), so it is
// checked as text here: what it declares must match the tokens that read it, the files it loads
// must exist, and each file must have its license listed (docs/ai/04_DESIGN_SYSTEM.md §7).

const PACKAGE_ROOT = join(import.meta.dirname, "..");
const fontModule = readFileSync(join(PACKAGE_ROOT, "fonts/index.ts"), "utf8");
const licenses = readFileSync(join(PACKAGE_ROOT, "assets/LICENSES.md"), "utf8");

const declaredVariables = [...fontModule.matchAll(/variable: "(--uw-font-face-[a-z]+)"/g)].map(
  (match) => match[1],
);
const declaredFiles = [...fontModule.matchAll(/src: "(\.\.\/assets\/fonts\/[^"]+)"/g)].map(
  (match) => match[1] ?? "",
);

describe("self-hosted fonts", () => {
  it("declares one variable per font family token that uses a web font", () => {
    expect(declaredVariables).toEqual(["--uw-font-face-display", "--uw-font-face-body"]);
  });

  it.each(["display", "body"])("the %s token reads its font variable first", (family) => {
    const value = BASE_TOKENS["font-family"]?.[`--uw-font-family-${family}`];
    expect(value).toMatch(new RegExp(`^var\\(--uw-font-face-${family}, system-ui\\), `));
  });

  it("loads existing files whose licenses are listed", () => {
    expect(declaredFiles).toHaveLength(2);
    for (const file of declaredFiles) {
      expect(existsSync(join(PACKAGE_ROOT, "fonts", file))).toBe(true);
      expect(licenses).toContain(basename(file));
    }
  });
});
