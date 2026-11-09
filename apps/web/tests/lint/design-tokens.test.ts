import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { ESLint } from "eslint";
import stylelint from "stylelint";
import { describe, expect, it } from "vitest";

// The design-token lint rules (Task 2.1b) on synthetic snippets: each forbidden case is reported, and
// the token-based version passes. `pnpm lint` applies the same rules to the real source files.

const WEB_ROOT = fileURLToPath(new URL("../..", import.meta.url));

// The design-token rules alone, without the type-aware rules (they need files in a tsconfig project).
// The snippets use no TypeScript syntax, so ESLint's default parser reads them, JSX included.
const eslint = new ESLint({
  cwd: WEB_ROOT,
  overrideConfigFile: "eslint.design-tokens.mjs",
  overrideConfig: { languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } },
});

async function eslintProblems(code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath: join(WEB_ROOT, "src/app/example.tsx") });
  return (result?.messages ?? []).map(({ ruleId, message }) => `${ruleId ?? "fatal"}: ${message}`);
}

async function stylelintProblems(code: string): Promise<string[]> {
  const { results } = await stylelint.lint({
    code,
    codeFilename: join(WEB_ROOT, "src/app/example.module.css"),
    configFile: join(WEB_ROOT, "stylelint.config.mjs"),
  });
  return (results[0]?.warnings ?? []).map(({ rule, text }) => `${rule}: ${text}`);
}

const component = (className: string) =>
  `export const Example = () => <p className="${className}">Bonjour</p>;`;

describe("ESLint: Tailwind classes in the application", () => {
  it("accepts the token utilities", async () => {
    expect(
      await eslintProblems(
        component(
          "bg-primary p-4 text-text-muted md:px-gutter-page rounded-lg shadow-md font-semibold hover:bg-primary-hover data-[state=open]:bg-surface-muted",
        ),
      ),
    ).toEqual([]);
  }, 30_000);

  it.each([
    ["p-[13px]", "arbitrary spacing"],
    ["text-[2.5rem]", "arbitrary font size"],
    ["[mask-type:alpha]", "arbitrary property"],
    ["bg-(--my-color)", "CSS variable shorthand"],
    ["md:w-[calc(100%-1rem)]", "arbitrary value after a variant"],
  ])("refuses %s (%s)", async (className) => {
    const problems = await eslintProblems(component(className));
    expect(problems).toContainEqual(
      expect.stringMatching(/^better-tailwindcss\/no-restricted-classes: Arbitrary Tailwind value/),
    );
  });

  it("refuses an arbitrary breakpoint", async () => {
    expect(await eslintProblems(component("min-[600px]:flex"))).toContainEqual(
      expect.stringMatching(/^better-tailwindcss\/no-restricted-classes: Arbitrary breakpoint/),
    );
  });

  it.each(["bg-red-500", "text-white", "p-13", "rounded-3xl", "font-sans"])(
    "refuses %s, which the generated theme does not define",
    async (className) => {
      expect(await eslintProblems(component(className))).toEqual([
        expect.stringMatching(/^better-tailwindcss\/no-unknown-classes: /),
      ]);
    },
  );
});

describe("ESLint: raw colors in the application's code", () => {
  it.each([
    ['const color = "#1E832B";', "hex in a string"],
    ['const color = "#fff";', "short hex"],
    ["const style = { color: `rgb(0 0 0 / ${0.5})` };", "color function in a template"],
    ['export const A = () => <p style={{ color: "oklch(0.6 0.1 140)" }} />;', "inline style"],
  ])("refuses %s (%s)", async (code) => {
    expect(await eslintProblems(code)).toEqual([
      expect.stringMatching(/^no-restricted-syntax: Raw color/),
    ]);
  });

  it("accepts anchors, token variables and an exception that gives its reason", async () => {
    expect(
      await eslintProblems(
        [
          'const anchor = "#formations";',
          'const style = { color: "var(--uw-color-primary)" };',
          "// eslint-disable-next-line no-restricted-syntax -- partner logo color, fixed by its brand guide",
          'const partner = "#123456";',
        ].join("\n"),
      ),
    ).toEqual([]);
  });
});

describe("Stylelint: CSS of the application", () => {
  it("accepts token variables and the keywords transparent and currentColor", async () => {
    expect(
      await stylelintProblems(
        ".a { color: var(--uw-color-text); margin: 0 auto var(--uw-space-4); font-size: var(--uw-font-size-lg); border: 1px solid transparent; outline-color: currentColor; }",
      ),
    ).toEqual([]);
  });

  it.each([
    [".a { color: #fff; }", "color-no-hex"],
    [".a { color: white; }", "color-named"],
    [".a { background: rgb(0 0 0 / 50%); }", "function-disallowed-list"],
    [".a { border-color: oklch(0.6 0.1 140); }", "function-disallowed-list"],
    [".a { font-size: 16px; }", "declaration-property-unit-disallowed-list"],
    [".a { padding-top: 1rem; }", "declaration-property-unit-disallowed-list"],
    [".a { gap: 2em; }", "declaration-property-unit-disallowed-list"],
  ])("refuses %s (%s)", async (code, rule) => {
    expect(await stylelintProblems(code)).toEqual([
      expect.stringMatching(new RegExp(`^${rule}: `)),
    ]);
  });

  it("requires a reason on every exception", async () => {
    const withoutReason = "/* stylelint-disable-next-line color-no-hex */\n.a { color: #fff; }";
    const withReason =
      "/* stylelint-disable-next-line color-no-hex -- partner logo color, fixed by its brand guide */\n.a { color: #fff; }";

    expect(await stylelintProblems(withoutReason)).toEqual([
      expect.stringMatching(/^--report-descriptionless-disables: /),
    ]);
    expect(await stylelintProblems(withReason)).toEqual([]);
  });
});
