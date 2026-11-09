import { join } from "node:path";
import { fileURLToPath } from "node:url";

import betterTailwindcss from "eslint-plugin-better-tailwindcss";

/**
 * Design-token rules for the application's code (04_DESIGN_SYSTEM.md §3, golden rule): no raw color,
 * no arbitrary Tailwind value, no Tailwind class that the generated theme does not define.
 * An exception needs a reason: `// eslint-disable-next-line <rule> -- <why>`.
 * CSS files are checked by Stylelint (stylelint.config.mjs). Also loaded alone by tests/lint.
 */

const WEB_ROOT = fileURLToPath(new URL(".", import.meta.url));

// A hex color or a CSS color function, anywhere in a string, template or JSX text.
const RAW_COLOR = "/#[0-9a-fA-F]{3,8}\\b|\\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\\(/";
const RAW_COLOR_MESSAGE =
  "Raw color: use a color role (Tailwind class such as `bg-primary`, or `var(--uw-color-*)`).";

const designTokenRules = [
  {
    name: "upwilling/design-tokens",
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/**/*.test.{ts,tsx}"],
    plugins: { "better-tailwindcss": betterTailwindcss },
    settings: {
      "better-tailwindcss": {
        cwd: WEB_ROOT,
        entryPoint: join(WEB_ROOT, "src/app/globals.css"),
      },
    },
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: `Literal[value=${RAW_COLOR}]`, message: RAW_COLOR_MESSAGE },
        { selector: `TemplateElement[value.raw=${RAW_COLOR}]`, message: RAW_COLOR_MESSAGE },
        { selector: `JSXText[value=${RAW_COLOR}]`, message: RAW_COLOR_MESSAGE },
      ],
      // Only classes from the generated theme exist (`bg-red-500` does not): an unknown class is a typo
      // or a value outside the design system.
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

export default designTokenRules;
