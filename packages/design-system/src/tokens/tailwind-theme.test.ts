import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { colorRoleVariable } from "../css-variables.ts";
import { BASE_TOKENS, COLOR_ROLES } from "../generated/tokens.ts";
import { parseTokenSources } from "./sources.ts";
import {
  GENERATED_THEME_PATH,
  renderTailwindTheme,
  TailwindThemeError,
  UTILITY_GROUP_NAMES,
} from "./tailwind-theme.ts";
import { PACKAGE_ROOT, realTokenFiles } from "./token-files.fixture.ts";

const theme = readFileSync(join(PACKAGE_ROOT, GENERATED_THEME_PATH), "utf8").replaceAll(
  "\r\n",
  "\n",
);
const themeBody = theme.slice(theme.indexOf("@theme inline {"), theme.indexOf("\n}\n") + 3);
const utilities = theme.slice(theme.indexOf("\n}\n") + 3);

describe("css/theme.css (Tailwind v4 theme)", () => {
  it("removes Tailwind's default theme before mapping the tokens", () => {
    expect(themeBody).toMatch(/^@theme inline \{\n {2}--\*: initial;\n/);
  });

  it("maps every color role to its --uw-* variable", () => {
    for (const role of COLOR_ROLES) {
      expect(themeBody).toContain(`  --color-${role}: var(${colorRoleVariable(role)});\n`);
    }
  });

  it("maps no palette step: only contrast-checked roles become Tailwind colors", () => {
    expect(themeBody).not.toContain("--uw-palette-");
  });

  it("maps every base token: to a theme namespace, or to an @utility for groups without one", () => {
    for (const [group, variables] of Object.entries(BASE_TOKENS)) {
      for (const variable of Object.keys(variables)) {
        if (UTILITY_GROUP_NAMES.includes(group)) {
          expect(utilities).toContain(`var(${variable})`);
        } else if (group !== "breakpoint" && group !== "container") {
          expect(themeBody).toContain(`: var(${variable});`);
        }
      }
    }
  });

  it("gives components named utilities for durations, layers, border widths and the focus ring", () => {
    expect(utilities).toContain(
      "@utility duration-base {\n  --tw-duration: var(--uw-duration-base);\n  transition-duration: var(--uw-duration-base);\n}",
    );
    expect(utilities).toContain("@utility z-modal {\n  z-index: var(--uw-z-index-modal);\n}");
    expect(utilities).toContain(
      "@utility border-thick {\n  border-style: var(--tw-border-style, solid);\n  border-width: var(--uw-border-width-thick);\n}",
    );
    expect(utilities).toContain(
      "@utility focus-ring {\n  outline: var(--uw-focus-ring-width) solid var(--uw-color-focus-ring);\n  outline-offset: var(--uw-focus-ring-offset);\n}",
    );
  });

  it("takes transition defaults from the motion tokens", () => {
    expect(themeBody).toContain("  --default-transition-duration: var(--uw-duration-base);\n");
    expect(themeBody).toContain(
      "  --default-transition-timing-function: var(--uw-easing-standard);\n",
    );
  });

  it("copies breakpoint and container values, since media and container queries cannot read var()", () => {
    for (const group of ["breakpoint", "container"]) {
      for (const [variable, value] of Object.entries(BASE_TOKENS[group] ?? {})) {
        const name = variable.slice(`--uw-${group}-`.length);
        expect(themeBody).toContain(`  --${group}-${name}: ${value};\n`);
      }
    }
  });

  it("gives Tailwind's spacing utilities only the token scale (no free --spacing multiplier)", () => {
    expect(themeBody).toContain("  --spacing-4: var(--uw-space-4);\n");
    expect(themeBody).not.toMatch(/^ {2}--spacing:/m);
  });
});

describe("renderTailwindTheme", () => {
  const sources = parseTokenSources(realTokenFiles());
  const groups = sources.baseGroups.map((group) => ({
    group: group.name,
    tokens: group.values.map(([name]) => ({ name, value: "1rem" })),
  }));

  it("refuses a base group with no Tailwind namespace and no utility mapping", () => {
    expect(() =>
      renderTailwindTheme([...groups, { group: "opacity", tokens: [] }], [], "/* header */"),
    ).toThrow(TailwindThemeError);
    expect(() =>
      renderTailwindTheme([...groups, { group: "opacity", tokens: [] }], [], "/* header */"),
    ).toThrow('base group "opacity" has no Tailwind namespace');
  });

  it("refuses a focus-ring group without its width and offset", () => {
    const withoutOffset = groups.map((entry) =>
      entry.group === "focus-ring"
        ? { group: "focus-ring", tokens: [{ name: "width", value: "3px" }] }
        : entry,
    );
    expect(() => renderTailwindTheme(withoutOffset, [], "/* header */")).toThrow(
      'base group "focus-ring" needs the tokens "width" and "offset"',
    );
  });
});
