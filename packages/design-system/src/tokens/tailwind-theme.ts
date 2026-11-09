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

/** Base token group → Tailwind namespace. Every group must be here or in `CSS_ONLY_GROUPS`. */
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

/**
 * Groups with no Tailwind namespace: CSS uses their `--uw-*` variables directly. Tailwind's numeric
 * utilities that need no theme (`z-10`, `duration-200`, `border-2`) stay available.
 */
export const CSS_ONLY_GROUPS: readonly string[] = [
  "duration",
  "z-index",
  "border-width",
  "focus-ring",
];

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
 * `[data-brand]` block of tokens.css decides the brand's value.
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
    "  /* Fonts used by Tailwind's Preflight on html and code */",
    "  --default-font-family: var(--uw-font-family-body);",
    "  --default-mono-font-family: var(--uw-font-family-mono);",
    "",
    "  /* Color roles. Palettes are not mapped: only roles are contrast-checked. */",
    ...colorRoles.map((role) => `  --color-${role}: var(${colorRoleVariable(role)});`),
  ];

  for (const { group, tokens } of baseGroups) {
    const namespace = THEME_NAMESPACES.get(group);
    if (namespace === undefined) {
      if (CSS_ONLY_GROUPS.includes(group)) {
        continue;
      }
      throw new TailwindThemeError(
        `base group "${group}" has no Tailwind namespace: map it in THEME_NAMESPACES or list it in CSS_ONLY_GROUPS (src/tokens/tailwind-theme.ts)`,
      );
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

  lines.push("}");
  return `${lines.join("\n")}\n`;
}
