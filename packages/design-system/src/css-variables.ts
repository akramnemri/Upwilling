// CSS custom property names, shared by the generator and by code that needs a variable by name
// (style attributes, the token preview page). Every token uses the `--uw-` prefix (04_DESIGN_SYSTEM.md §3).

/** A semantic color role, e.g. `--uw-color-primary`. Components use these. */
export function colorRoleVariable(role: string): string {
  return `--uw-color-${role}`;
}

/** One step of a brand palette, e.g. `--uw-palette-primary-600`. For previews and tints, not for text. */
export function paletteStepVariable(palette: string, step: string): string {
  return `--uw-palette-${palette}-${step}`;
}

/** A non-color token, e.g. `--uw-space-4`, `--uw-font-size-lg`. */
export function baseTokenVariable(group: string, name: string): string {
  return `--uw-${group}-${name}`;
}
