// Public interface of the design system. The stylesheet is imported separately:
// `import "@upwilling/design-system/tokens.css"` (once, in the root layout).

export { BRANDS, type Brand, isBrand } from "./brands.ts";
export { contrastRatio } from "./contrast.ts";
export { baseTokenVariable, colorRoleVariable, paletteStepVariable } from "./css-variables.ts";
export {
  BASE_TOKENS,
  BRAND_TOKENS,
  type BrandTokens,
  COLOR_ROLES,
  type ColorRole,
  CONTRAST_PAIRS,
  type PaletteName,
  PALETTES,
} from "./generated/tokens.ts";
