import { baseTokenVariable, colorRoleVariable } from "../css-variables.ts";

/** The generated Tailwind v4 theme, relative to the package root. Never edited by hand. */
export const GENERATED_THEME_PATH = "css/theme.css";

interface ThemeNamespace {
  /** Tailwind theme variable prefix (https://tailwindcss.com/docs/theme, "Theme variable namespaces"). */
  readonly prefix: string;
  /**
   * `variable`: the utility reads the `--uw-*` token, so the value follows the token at run time.
   * `value`: the token's value is copied, because media and container queries cannot read `var()`.
   */
  readonly output: "variable" | "value";
}

/** Base token group → Tailwind namespace. Every group must be here or in `UTILITY_GROUPS`. */
const THEME_NAMESPACES: ReadonlyMap<string, ThemeNamespace> = new Map<string, ThemeNamespace>([
  ["font-family", { prefix: "--font-", output: "variable" }],
  ["font-size", { prefix: "--text-", output: "variable" }],
  ["font-weight", { prefix: "--font-weight-", output: "variable" }],
  ["line-height", { prefix: "--leading-", output: "variable" }],
  ["letter-spacing", { prefix: "--tracking-", output: "variable" }],
  ["space", { prefix: "--spacing-", output: "variable" }],
  ["section-space", { prefix: "--spacing-section-", output: "variable" }],
  ["gutter", { prefix: "--spacing-gutter-", output: "variable" }],
  ["gap", { prefix: "--spacing-gap-", output: "variable" }],
  ["radius", { prefix: "--radius-", output: "variable" }],
  ["shadow", { prefix: "--shadow-", output: "variable" }],
  ["easing", { prefix: "--ease-", output: "variable" }],
  ["breakpoint", { prefix: "--breakpoint-", output: "value" }],
  ["container", { prefix: "--container-", output: "value" }],
]);

type TokenList = ThemeBaseGroup["tokens"];

/**
 * Groups with no Tailwind theme namespace: each becomes `@utility` classes that read the token
 * (`duration-base`, `z-dropdown`, `border-thick`, `focus-ring`), so components never need an
 * arbitrary value. Tailwind's numeric utilities (`z-10`, `duration-200`, `border-2`) still exist.
 */
const UTILITY_GROUPS: ReadonlyMap<string, (tokens: TokenList) => string[]> = new Map<
  string,
  (tokens: TokenList) => string[]
>([
  [
    "duration",
    (tokens) =>
      tokens.map(({ name }) => {
        const variable = baseTokenVariable("duration", name);
        // Same shape as Tailwind's own duration-*: `transition-*` utilities read --tw-duration.
        return utility(`duration-${name}`, [
          `--tw-duration: var(${variable})`,
          `transition-duration: var(${variable})`,
        ]);
      }),
  ],
  [
    "z-index",
    (tokens) =>
      tokens.map(({ name }) =>
        utility(`z-${name}`, [`z-index: var(${baseTokenVariable("z-index", name)})`]),
      ),
  ],
  [
    "border-width",
    (tokens) =>
      tokens.map(({ name }) =>
        utility(`border-${name}`, [
          "border-style: var(--tw-border-style, solid)",
          `border-width: var(${baseTokenVariable("border-width", name)})`,
        ]),
      ),
  ],
  [
    "focus-ring",
    (tokens) => {
      const names = new Set(tokens.map(({ name }) => name));
      if (!names.has("width") || !names.has("offset")) {
        throw new TailwindThemeError(
          `base group "focus-ring" needs the tokens "width" and "offset"`,
        );
      }
      // Used as `focus-visible:focus-ring`: an outline survives forced-colors mode, a box-shadow does not.
      return [
        utility("focus-ring", [
          `outline: var(${baseTokenVariable("focus-ring", "width")}) solid var(${colorRoleVariable("focus-ring")})`,
          `outline-offset: var(${baseTokenVariable("focus-ring", "offset")})`,
        ]),
      ];
    },
  ],
]);

/** The base groups rendered as `@utility` classes (no Tailwind theme namespace). */
export const UTILITY_GROUP_NAMES: readonly string[] = [...UTILITY_GROUPS.keys()];

export interface ThemeBaseGroup {
  readonly group: string;
  /** Token name and its rendered CSS value (the one written to `:root`). */
  readonly tokens: readonly { readonly name: string; readonly value: string }[];
}

export class TailwindThemeError extends Error {
  constructor(problem: string) {
    super(problem);
    this.name = "TailwindThemeError";
  }
}

/**
 * Renders `css/theme.css`: a Tailwind v4 `@theme inline` block that removes Tailwind's default theme
 * and maps each token to its namespace, so `bg-primary` reads `var(--uw-color-primary)` and the
 * `[data-brand]` block of tokens.css decides the brand's value; then `@utility` classes for the
 * groups that have no namespace.
 */
export function renderTailwindTheme(
  baseGroups: readonly ThemeBaseGroup[],
  colorRoles: readonly string[],
  header: string,
): string {
  const lines = [
    header,
    "/* Tailwind v4 theme: import it after `tailwindcss` and tokens.css. The default theme is removed, so",
    "   utilities exist only for these tokens (no `bg-red-500`), and each reads its --uw-* variable. */",
    "",
    "@theme inline {",
    "  --*: initial;",
    "",
    "  /* Defaults used by Tailwind's Preflight (html, code) and by `transition-*` utilities */",
    "  --default-font-family: var(--uw-font-family-body);",
    "  --default-mono-font-family: var(--uw-font-family-mono);",
    "  --default-transition-duration: var(--uw-duration-base);",
    "  --default-transition-timing-function: var(--uw-easing-standard);",
    "",
    "  /* Color roles. Palettes are not mapped: only roles are contrast-checked. */",
    ...colorRoles.map((role) => `  --color-${role}: var(${colorRoleVariable(role)});`),
  ];
  const utilities: string[] = [];

  for (const { group, tokens } of baseGroups) {
    const namespace = THEME_NAMESPACES.get(group);
    if (namespace === undefined) {
      const renderUtilities = UTILITY_GROUPS.get(group);
      if (renderUtilities === undefined) {
        throw new TailwindThemeError(
          `base group "${group}" has no Tailwind namespace: map it in THEME_NAMESPACES or UTILITY_GROUPS (src/tokens/tailwind-theme.ts)`,
        );
      }
      utilities.push("", `/* ${group} */`, ...renderUtilities(tokens));
      continue;
    }
    lines.push(
      "",
      namespace.output === "value"
        ? `  /* ${group}: values, because media and container queries cannot read var() */`
        : `  /* ${group} */`,
      ...tokens.map(({ name, value }) => {
        const themeValue =
          namespace.output === "value" ? value : `var(${baseTokenVariable(group, name)})`;
        return `  ${namespace.prefix}${name}: ${themeValue};`;
      }),
    );
  }

  lines.push("}", ...utilities);
  return `${lines.join("\n")}\n`;
}

function utility(name: string, declarations: readonly string[]): string {
  return [`@utility ${name} {`, ...declarations.map((d) => `  ${d};`), "}"].join("\n");
}
