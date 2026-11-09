// The brand identifiers. `data-brand` on <html>, the token files in `tokens/brands/` and the tenant map
// all use these names.

export const BRANDS = ["upwilling", "careerboost"] as const;

export type Brand = (typeof BRANDS)[number];

export function isBrand(value: string): value is Brand {
  return (BRANDS as readonly string[]).includes(value);
}

/** Builds one value per brand; the compiler flags this function when a brand is added. */
export function mapBrands<T>(build: (brand: Brand) => T): Record<Brand, T> {
  return { upwilling: build("upwilling"), careerboost: build("careerboost") };
}
