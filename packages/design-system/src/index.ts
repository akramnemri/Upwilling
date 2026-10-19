// Placeholder until Milestone 2 (tokens, themes, components). It already defines the brand
// identifiers, because the `data-brand` attribute and the tenant map will both depend on them.

export const BRANDS = ["upwilling", "careerboost"] as const;

export type Brand = (typeof BRANDS)[number];

export function isBrand(value: string): value is Brand {
  return (BRANDS as readonly string[]).includes(value);
}

export { contrastRatio } from "./contrast";
export {
  TEMPORARY_BRAND_COLORS,
  TEXT_COLOR_PAIRS,
  temporaryBrandCss,
  temporaryBrandCssVariables,
  type BrandColorRoles,
} from "./temporary-brand-theme";
