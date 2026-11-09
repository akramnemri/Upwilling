/**
 * sRGB <-> OKLCH conversions (Björn Ottosson's OKLab, https://bottosson.github.io/posts/oklab/).
 *
 * Scales are generated in OKLCH because equal lightness steps there look like equal steps to the eye,
 * unlike HSL. The output stays `#RRGGBB`, so what the contrast test measures is exactly what a browser
 * paints (04_DESIGN_SYSTEM.md §2).
 */

/** Lightness 0–1, chroma ≥ 0 (about 0.37 at most inside sRGB), hue in degrees 0–360. */
export interface Oklch {
  l: number;
  c: number;
  h: number;
}

type LinearRgb = readonly [number, number, number];

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

// A converted color counts as inside sRGB within this tolerance: the matrices are rounded to 10 digits.
const GAMUT_EPSILON = 1e-6;

export function isHexColor(value: string): boolean {
  return HEX_COLOR.test(value);
}

export function hexToOklch(hex: string): Oklch {
  const [r, g, b] = hexToLinearRgb(hex);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bAxis = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const chroma = Math.hypot(a, bAxis);
  const hue = (Math.atan2(bAxis, a) * 180) / Math.PI;
  return { l: lightness, c: chroma, h: hue < 0 ? hue + 360 : hue };
}

/**
 * Converts to `#RRGGBB`. A color outside sRGB keeps its lightness and hue and loses chroma until it
 * fits (the usual way to bring a palette color into gamut without shifting it to another hue).
 */
export function oklchToHex(color: Oklch): string {
  return linearRgbToHex(oklchToLinearRgb(clampChromaToGamut(color)));
}

/** Largest chroma that still fits sRGB at this lightness and hue (binary search, 1e-5 precision). */
export function clampChromaToGamut(color: Oklch): Oklch {
  if (isInGamut(oklchToLinearRgb(color))) {
    return color;
  }
  let inside = 0;
  let outside = color.c;
  while (outside - inside > 1e-5) {
    const middle = (inside + outside) / 2;
    if (isInGamut(oklchToLinearRgb({ ...color, c: middle }))) {
      inside = middle;
    } else {
      outside = middle;
    }
  }
  return { ...color, c: inside };
}

function oklchToLinearRgb({ l: lightness, c, h }: Oklch): LinearRgb {
  const hueRadians = (h * Math.PI) / 180;
  const a = c * Math.cos(hueRadians);
  const b = c * Math.sin(hueRadians);

  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function isInGamut(rgb: LinearRgb): boolean {
  return rgb.every((channel) => channel >= -GAMUT_EPSILON && channel <= 1 + GAMUT_EPSILON);
}

function hexToLinearRgb(hex: string): LinearRgb {
  if (!isHexColor(hex)) {
    throw new Error(`Expected a #RRGGBB color, got "${hex}"`);
  }
  const channel = (offset: number) =>
    decodeGamma(Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
  return [channel(1), channel(3), channel(5)];
}

function linearRgbToHex(rgb: LinearRgb): string {
  const bytes = rgb.map((channel) => {
    const encoded = encodeGamma(Math.min(1, Math.max(0, channel)));
    return Math.round(encoded * 255)
      .toString(16)
      .padStart(2, "0");
  });
  return `#${bytes.join("")}`.toUpperCase();
}

function decodeGamma(value: number): number {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function encodeGamma(value: number): number {
  return value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055;
}
