import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { colorRoleVariable } from "../css-variables.ts";
import { BASE_TOKENS, COLOR_ROLES } from "../generated/tokens.ts";
import { parseTokenSources } from "./sources.ts";
import {
  CSS_ONLY_GROUPS,
  GENERATED_THEME_PATH,
  renderTailwindTheme,
  TailwindThemeError,
} from "./tailwind-theme.ts";
import { PACKAGE_ROOT, realTokenFiles } from "./token-files.fixture.ts";

const theme = readFileSync(join(PACKAGE_ROOT, GENERATED_THEME_PATH), "utf8").replaceAll(
  "\r\n",
  "\n",
);
const themeBody = theme.slice(theme.indexOf("@theme inline {"));

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

  it("maps every base token outside the CSS-only groups, and nothing from those groups", () => {
    for (const [group, variables] of Object.entries(BASE_TOKENS)) {
      for (const variable of Object.keys(variables)) {
        if (CSS_ONLY_GROUPS.includes(group)) {
          expect(themeBody).not.toContain(variable);
        } else if (group !== "breakpoint" && group !== "container") {
          expect(themeBody).toContain(`: var(${variable});`);
        }
      }
    }
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

  it("refuses a base group with no Tailwind namespace and no CSS-only decision", () => {
    expect(() =>
      renderTailwindTheme([...groups, { group: "opacity", tokens: [] }], [], "/* header */"),
    ).toThrow(TailwindThemeError);
    expect(() =>
      renderTailwindTheme([...groups, { group: "opacity", tokens: [] }], [], "/* header */"),
    ).toThrow('base group "opacity" has no Tailwind namespace');
  });
});
