import type { LadderStep, ScaleStep } from "../tokens/sources.ts";
import { hexToOklch, oklchToHex } from "./oklch.ts";

export interface PaletteStep {
  step: ScaleStep;
  hex: string;
}

export interface Palette {
  /** The color the palette was built from, unchanged (e.g. the exact logo orange). */
  source: string;
  /** From the lightest (50) to the darkest (950). */
  steps: readonly PaletteStep[];
}

/**
 * Builds an 11-step palette from one color: every step has the ladder's lightness, the source's hue,
 * and the source's chroma times the step's factor (pale and dark ends are less saturated), reduced
 * further only where sRGB cannot show it.
 */
export function buildPalette(sourceHex: string, ladder: readonly LadderStep[]): Palette {
  const source = hexToOklch(sourceHex);
  // Below this chroma the hue is noise (greys): keep it at 0 so the greys stay neutral.
  const hue = source.c < 1e-4 ? 0 : source.h;
  return {
    source: sourceHex.toUpperCase(),
    steps: ladder.map(({ step, lightness, chroma }) => ({
      step,
      hex: oklchToHex({ l: lightness, c: source.c * chroma, h: hue }),
    })),
  };
}
