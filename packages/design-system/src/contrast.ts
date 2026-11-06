/**
 * WCAG 2.x contrast ratio between two `#RRGGBB` colors (1 to 21). AA requires 4.5 for normal text
 * and 3 for large text (04_DESIGN_SYSTEM.md §2: role shades are picked by measured contrast, not by eye).
 */
export function contrastRatio(foreground: string, background: string): number {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(hex: string): number {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) {
    throw new Error(`Expected a #RRGGBB color, got "${hex}"`);
  }
  const channel = (offset: number) =>
    linearize(Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function linearize(value: number): number {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}
