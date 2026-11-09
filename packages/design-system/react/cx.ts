/**
 * Joins class names and skips empty values. There is no conflict resolution on purpose: each variant
 * owns its classes, and a caller's `className` is for placement (margins, grid position), not for
 * restyling a component.
 */
export function cx(...classes: readonly (string | false | null | undefined)[]): string {
  return classes.filter((value) => typeof value === "string" && value !== "").join(" ");
}
