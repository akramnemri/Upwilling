import betterTailwindcss from "eslint-plugin-better-tailwindcss";

// A hex color or a CSS color function, anywhere in a string, template or JSX text.
const RAW_COLOR = "/#[0-9a-fA-F]{3,8}\\b|\\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\\(/";
const RAW_COLOR_MESSAGE =
  "Raw color: use a color role (Tailwind class such as `bg-primary`, or `var(--uw-color-*)`).";

/**
 * Design-token rules (04_DESIGN_SYSTEM.md §3, golden rule): no raw color, no arbitrary Tailwind value,
 * no Tailwind class that the generated theme does not define. Used by apps/web and by the design
 * system's React components. An exception needs a reason: `// eslint-disable-next-line <rule> -- <why>`.
 *
 * @param {object} options
 * @param {string[]} options.files Files to check (globs relative to the package's ESLint config).
 * @param {string[]} [options.ignores] Files to skip, such as tests that compare painted colors.
 * @param {string} options.cwd Absolute directory from which `tailwindcss` resolves.
 * @param {string} options.entryPoint Absolute path of the Tailwind CSS entry that loads the theme.
 */
export function designTokenRules({ files, ignores = [], cwd, entryPoint }) {
  return [
    {
      name: "upwilling/design-tokens",
      files,
      ignores,
      plugins: { "better-tailwindcss": betterTailwindcss },
      settings: { "better-tailwindcss": { cwd, entryPoint } },
      rules: {
        "no-restricted-syntax": [
          "error",
          { selector: `Literal[value=${RAW_COLOR}]`, message: RAW_COLOR_MESSAGE },
          { selector: `TemplateElement[value.raw=${RAW_COLOR}]`, message: RAW_COLOR_MESSAGE },
          { selector: `JSXText[value=${RAW_COLOR}]`, message: RAW_COLOR_MESSAGE },
        ],
        // Only classes from the generated theme exist (`bg-red-500` does not): an unknown class is a
        // typo or a value outside the design system.
        "better-tailwindcss/no-unknown-classes": "error",
        "better-tailwindcss/no-restricted-classes": [
          "error",
          {
            restrict: [
              {
                // A bracket or parenthesis in the utility itself (after the last variant):
                // `p-[13px]`, `bg-[#fff]`, `[mask-type:alpha]`, `bg-(--my-color)`.
                // Bracketed variants such as `data-[state=open]:` stay allowed.
                pattern: "^((?:.*:)?[^:]*[\\[\\]()][^:]*)$",
                message:
                  "Arbitrary Tailwind value in `$1`: use a token utility (`p-4`, `bg-primary`, `text-lg`) or add a token in packages/design-system/tokens.",
              },
              {
                // Arbitrary breakpoints and container sizes: `min-[600px]:`, `max-[40rem]:`, `@[30rem]:`.
                pattern: "^(.*(?:^|:)(?:@?(?:min|max)-|@)\\[.*)$",
                message:
                  "Arbitrary breakpoint in `$1`: use a breakpoint token (`md:`, `lg:`) or a container token (`@md:`).",
              },
            ],
          },
        ],
      },
    },
  ];
}

export default designTokenRules;
