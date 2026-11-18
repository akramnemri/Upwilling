import localFont from "next/font/local";

// Self-hosted brand fonts (Task 2.4a), loaded by the application (root layout) and by Storybook
// (preview), so both render the same text. Provisional choice from docs/ai/04_DESIGN_SYSTEM.md §3,
// to be confirmed by the PO at the M2 design review. Files and licenses: assets/fonts/ and
// assets/LICENSES.md (Fontsource 5.3.0, OFL-1.1). Latin subset only: it covers French (é, à, ç, œ,
// €, ’).
//
// One variable file per family covers every weight the tokens use (400, 600, 700, 800). Each font
// only sets a CSS variable; the `--uw-font-family-*` tokens read it first and keep the system stack
// after it, so a page without these classes still has a font. next/font adds a size-adjusted local
// fallback to the variable's value, so swapping to the web font does not move the layout.
//
// next/font requires literal options in module-scope `const` declarations.

export const displayFont = localFont({
  src: "../assets/fonts/rubik-latin-wght-normal.woff2",
  weight: "300 900",
  style: "normal",
  display: "swap",
  variable: "--uw-font-face-display",
  adjustFontFallback: "Arial",
});

export const bodyFont = localFont({
  src: "../assets/fonts/nunito-latin-wght-normal.woff2",
  weight: "200 1000",
  style: "normal",
  display: "swap",
  variable: "--uw-font-face-body",
  adjustFontFallback: "Arial",
});

/** Class names that define both font variables; put them on `<html>`. */
export const fontVariables = `${displayFont.variable} ${bodyFont.variable}`;
