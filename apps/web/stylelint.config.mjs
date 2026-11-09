/**
 * CSS rules for the application (04_DESIGN_SYSTEM.md §3, golden rule): colors, font sizes and spacing
 * come from --uw-* tokens, never raw values. TypeScript files are checked by ESLint
 * (eslint.design-tokens.mjs). An exception needs a reason:
 * `/* stylelint-disable-next-line <rule> -- <why> *\/`.
 *
 * @type {import("stylelint").Config}
 */
const config = {
  reportDescriptionlessDisables: true,
  reportInvalidScopeDisables: true,
  reportNeedlessDisables: true,
  rules: {
    "color-no-hex": [true, { message: "Raw hex color: use a var(--uw-color-*) token." }],
    "color-named": ["never", { message: "Named color: use a var(--uw-color-*) token." }],
    "function-disallowed-list": [
      ["rgb", "rgba", "hsl", "hsla", "hwb", "lab", "lch", "oklab", "oklch", "color"],
      { message: "Raw color function: use a var(--uw-color-*) token." },
    ],
    "declaration-property-unit-disallowed-list": [
      { "/^(font-size|margin|padding|gap|row-gap|column-gap)/": ["px", "rem", "em", "pt"] },
      {
        message:
          "Raw font size or spacing: use a token (--uw-font-size-*, --uw-space-*, --uw-gap-*, --uw-section-space-*).",
      },
    ],
  },
};

export default config;
