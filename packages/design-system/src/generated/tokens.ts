// GENERATED from packages/design-system/tokens/ by `pnpm --filter @upwilling/design-system tokens`. Do not edit.
import type { Brand } from "../brands.ts";

/** Semantic color roles, as `--uw-color-<role>`. */
export const COLOR_ROLES = [
  "surface",
  "surface-raised",
  "surface-muted",
  "text",
  "text-muted",
  "text-inverse",
  "border",
  "border-strong",
  "primary-contrast",
  "primary",
  "primary-hover",
  "accent",
  "accent-contrast",
  "support",
  "focus-ring",
  "success",
  "success-surface",
  "success-text",
  "warning",
  "warning-surface",
  "warning-text",
  "danger",
  "danger-surface",
  "danger-text",
  "info",
  "info-surface",
  "info-text"
] as const;
export type ColorRole = (typeof COLOR_ROLES)[number];

/** Palettes, as `--uw-palette-<palette>-<step>`. */
export const PALETTES = [
  "primary",
  "accent",
  "support",
  "neutral",
  "success",
  "warning",
  "danger",
  "info"
] as const;
export type PaletteName = (typeof PALETTES)[number];

export interface BrandTokens {
  readonly colors: Readonly<Record<ColorRole, string>>;
  /** Where each role's value comes from ("primary 600", "white"), for the preview page. */
  readonly colorOrigins: Readonly<Record<ColorRole, string>>;
  readonly palettes: Readonly<
    Record<PaletteName, { readonly source: string; readonly steps: Readonly<Record<string, string>> }>
  >;
}

export const BRAND_TOKENS: Readonly<Record<Brand, BrandTokens>> = {
  "upwilling": {
    "colors": {
      "surface": "#FFFFFF",
      "surface-raised": "#FFFFFF",
      "surface-muted": "#F5F7F9",
      "text": "#1C2128",
      "text-muted": "#636E7F",
      "text-inverse": "#FFFFFF",
      "border": "#D6DBE3",
      "border-strong": "#818D9F",
      "primary-contrast": "#FFFFFF",
      "primary": "#1E832B",
      "primary-hover": "#076B1A",
      "accent": "#F89808",
      "accent-contrast": "#1C2128",
      "support": "#389840",
      "focus-ring": "#1E832B",
      "success": "#00842B",
      "success-surface": "#F0FAF0",
      "success-text": "#00842B",
      "warning": "#B98000",
      "warning-surface": "#FDF6EC",
      "warning-text": "#916300",
      "danger": "#EE4A3E",
      "danger-surface": "#FFF4F2",
      "danger-text": "#C81F1A",
      "info": "#3B90E2",
      "info-surface": "#F1F8FF",
      "info-text": "#116FBE"
    },
    "colorOrigins": {
      "surface": "white",
      "surface-raised": "white",
      "surface-muted": "neutral 50",
      "text": "neutral 950",
      "text-muted": "neutral 600",
      "text-inverse": "white",
      "border": "neutral 200",
      "border-strong": "neutral 500",
      "primary-contrast": "white",
      "primary": "primary 600",
      "primary-hover": "primary 700",
      "accent": "accent source",
      "accent-contrast": "neutral 950",
      "support": "support source",
      "focus-ring": "primary 600",
      "success": "success 600",
      "success-surface": "success 50",
      "success-text": "success 600",
      "warning": "warning 500",
      "warning-surface": "warning 50",
      "warning-text": "warning 600",
      "danger": "danger 500",
      "danger-surface": "danger 50",
      "danger-text": "danger 600",
      "info": "info 500",
      "info-surface": "info 50",
      "info-text": "info 600"
    },
    "palettes": {
      "primary": {
        "source": "#389840",
        "steps": {
          "50": "#F1FAF0",
          "100": "#E0F3DF",
          "200": "#C1E7C1",
          "300": "#9BD69C",
          "400": "#71BF74",
          "500": "#45A44B",
          "600": "#1E832B",
          "700": "#076B1A",
          "800": "#005511",
          "900": "#003F0A",
          "950": "#002905"
        }
      },
      "accent": {
        "source": "#F89808",
        "steps": {
          "50": "#FFF5EB",
          "100": "#FFE9D3",
          "200": "#FCD2AA",
          "300": "#F5B675",
          "400": "#E59536",
          "500": "#C57700",
          "600": "#9B5D00",
          "700": "#7E4A00",
          "800": "#643A00",
          "900": "#4B2A00",
          "950": "#321A00"
        }
      },
      "support": {
        "source": "#389840",
        "steps": {
          "50": "#F1FAF0",
          "100": "#E0F3DF",
          "200": "#C1E7C1",
          "300": "#9BD69C",
          "400": "#71BF74",
          "500": "#45A44B",
          "600": "#1E832B",
          "700": "#076B1A",
          "800": "#005511",
          "900": "#003F0A",
          "950": "#002905"
        }
      },
      "neutral": {
        "source": "#4B5666",
        "steps": {
          "50": "#F5F7F9",
          "100": "#EAEDF1",
          "200": "#D6DBE3",
          "300": "#BCC5D1",
          "400": "#A0AABA",
          "500": "#818D9F",
          "600": "#636E7F",
          "700": "#4F5968",
          "800": "#3D4652",
          "900": "#2D333D",
          "950": "#1C2128"
        }
      },
      "success": {
        "source": "#2F9E44",
        "steps": {
          "50": "#F0FAF0",
          "100": "#DEF4DF",
          "200": "#BEE8C1",
          "300": "#96D79B",
          "400": "#6AC073",
          "500": "#38A54B",
          "600": "#00842B",
          "700": "#006B21",
          "800": "#005518",
          "900": "#003F10",
          "950": "#002908"
        }
      },
      "warning": {
        "source": "#E8A317",
        "steps": {
          "50": "#FDF6EC",
          "100": "#FAEBD4",
          "200": "#F3D6AB",
          "300": "#E9BC77",
          "400": "#D79D39",
          "500": "#B98000",
          "600": "#916300",
          "700": "#755000",
          "800": "#5D3E00",
          "900": "#462E00",
          "950": "#2E1D00"
        }
      },
      "danger": {
        "source": "#D9342B",
        "steps": {
          "50": "#FFF4F2",
          "100": "#FFE6E3",
          "200": "#FFCDC5",
          "300": "#FFAB9F",
          "400": "#FF7C6D",
          "500": "#EE4A3E",
          "600": "#C81F1A",
          "700": "#A80408",
          "800": "#860004",
          "900": "#660002",
          "950": "#450001"
        }
      },
      "info": {
        "source": "#1F78C8",
        "steps": {
          "50": "#F1F8FF",
          "100": "#E0EFFF",
          "200": "#C0DEFF",
          "300": "#96C9FF",
          "400": "#6AAEF5",
          "500": "#3B90E2",
          "600": "#116FBE",
          "700": "#00599E",
          "800": "#00467E",
          "900": "#003460",
          "950": "#002140"
        }
      }
    }
  },
  "careerboost": {
    "colors": {
      "surface": "#FFFFFF",
      "surface-raised": "#FFFFFF",
      "surface-muted": "#F5F7F9",
      "text": "#1C2128",
      "text-muted": "#636E7F",
      "text-inverse": "#FFFFFF",
      "border": "#D6DBE3",
      "border-strong": "#818D9F",
      "primary-contrast": "#FFFFFF",
      "primary": "#006BCF",
      "primary-hover": "#0056A9",
      "accent": "#F89808",
      "accent-contrast": "#1C2128",
      "support": "#389840",
      "focus-ring": "#2E8CF6",
      "success": "#00842B",
      "success-surface": "#F0FAF0",
      "success-text": "#00842B",
      "warning": "#B98000",
      "warning-surface": "#FDF6EC",
      "warning-text": "#916300",
      "danger": "#EE4A3E",
      "danger-surface": "#FFF4F2",
      "danger-text": "#C81F1A",
      "info": "#3B90E2",
      "info-surface": "#F1F8FF",
      "info-text": "#116FBE"
    },
    "colorOrigins": {
      "surface": "white",
      "surface-raised": "white",
      "surface-muted": "neutral 50",
      "text": "neutral 950",
      "text-muted": "neutral 600",
      "text-inverse": "white",
      "border": "neutral 200",
      "border-strong": "neutral 500",
      "primary-contrast": "white",
      "primary": "primary 600",
      "primary-hover": "primary 700",
      "accent": "accent source",
      "accent-contrast": "neutral 950",
      "support": "support source",
      "focus-ring": "primary 500",
      "success": "success 600",
      "success-surface": "success 50",
      "success-text": "success 600",
      "warning": "warning 500",
      "warning-surface": "warning 50",
      "warning-text": "warning 600",
      "danger": "danger 500",
      "danger-surface": "danger 50",
      "danger-text": "danger 600",
      "info": "info 500",
      "info-surface": "info 50",
      "info-text": "info 600"
    },
    "palettes": {
      "primary": {
        "source": "#0070D8",
        "steps": {
          "50": "#F1F7FF",
          "100": "#E1EEFF",
          "200": "#C3DDFF",
          "300": "#9CC7FF",
          "400": "#69ACFF",
          "500": "#2E8CF6",
          "600": "#006BCF",
          "700": "#0056A9",
          "800": "#004387",
          "900": "#003266",
          "950": "#002045"
        }
      },
      "accent": {
        "source": "#F89808",
        "steps": {
          "50": "#FFF5EB",
          "100": "#FFE9D3",
          "200": "#FCD2AA",
          "300": "#F5B675",
          "400": "#E59536",
          "500": "#C57700",
          "600": "#9B5D00",
          "700": "#7E4A00",
          "800": "#643A00",
          "900": "#4B2A00",
          "950": "#321A00"
        }
      },
      "support": {
        "source": "#389840",
        "steps": {
          "50": "#F1FAF0",
          "100": "#E0F3DF",
          "200": "#C1E7C1",
          "300": "#9BD69C",
          "400": "#71BF74",
          "500": "#45A44B",
          "600": "#1E832B",
          "700": "#076B1A",
          "800": "#005511",
          "900": "#003F0A",
          "950": "#002905"
        }
      },
      "neutral": {
        "source": "#4B5666",
        "steps": {
          "50": "#F5F7F9",
          "100": "#EAEDF1",
          "200": "#D6DBE3",
          "300": "#BCC5D1",
          "400": "#A0AABA",
          "500": "#818D9F",
          "600": "#636E7F",
          "700": "#4F5968",
          "800": "#3D4652",
          "900": "#2D333D",
          "950": "#1C2128"
        }
      },
      "success": {
        "source": "#2F9E44",
        "steps": {
          "50": "#F0FAF0",
          "100": "#DEF4DF",
          "200": "#BEE8C1",
          "300": "#96D79B",
          "400": "#6AC073",
          "500": "#38A54B",
          "600": "#00842B",
          "700": "#006B21",
          "800": "#005518",
          "900": "#003F10",
          "950": "#002908"
        }
      },
      "warning": {
        "source": "#E8A317",
        "steps": {
          "50": "#FDF6EC",
          "100": "#FAEBD4",
          "200": "#F3D6AB",
          "300": "#E9BC77",
          "400": "#D79D39",
          "500": "#B98000",
          "600": "#916300",
          "700": "#755000",
          "800": "#5D3E00",
          "900": "#462E00",
          "950": "#2E1D00"
        }
      },
      "danger": {
        "source": "#D9342B",
        "steps": {
          "50": "#FFF4F2",
          "100": "#FFE6E3",
          "200": "#FFCDC5",
          "300": "#FFAB9F",
          "400": "#FF7C6D",
          "500": "#EE4A3E",
          "600": "#C81F1A",
          "700": "#A80408",
          "800": "#860004",
          "900": "#660002",
          "950": "#450001"
        }
      },
      "info": {
        "source": "#1F78C8",
        "steps": {
          "50": "#F1F8FF",
          "100": "#E0EFFF",
          "200": "#C0DEFF",
          "300": "#96C9FF",
          "400": "#6AAEF5",
          "500": "#3B90E2",
          "600": "#116FBE",
          "700": "#00599E",
          "800": "#00467E",
          "900": "#003460",
          "950": "#002140"
        }
      }
    }
  }
};

/** Pairs that must reach `min`:1 in every brand (WCAG AA: 4.5 for text, 3 for UI components). */
export const CONTRAST_PAIRS: readonly {
  readonly foreground: ColorRole;
  readonly background: ColorRole;
  readonly min: number;
}[] = [
  {
    "foreground": "text",
    "background": "surface",
    "min": 4.5
  },
  {
    "foreground": "text",
    "background": "surface-raised",
    "min": 4.5
  },
  {
    "foreground": "text",
    "background": "surface-muted",
    "min": 4.5
  },
  {
    "foreground": "text-muted",
    "background": "surface",
    "min": 4.5
  },
  {
    "foreground": "text-muted",
    "background": "surface-raised",
    "min": 4.5
  },
  {
    "foreground": "text-muted",
    "background": "surface-muted",
    "min": 4.5
  },
  {
    "foreground": "primary",
    "background": "surface",
    "min": 4.5
  },
  {
    "foreground": "primary",
    "background": "surface-raised",
    "min": 4.5
  },
  {
    "foreground": "primary",
    "background": "surface-muted",
    "min": 4.5
  },
  {
    "foreground": "primary-hover",
    "background": "surface",
    "min": 4.5
  },
  {
    "foreground": "primary-hover",
    "background": "surface-raised",
    "min": 4.5
  },
  {
    "foreground": "primary-hover",
    "background": "surface-muted",
    "min": 4.5
  },
  {
    "foreground": "primary-contrast",
    "background": "primary",
    "min": 4.5
  },
  {
    "foreground": "primary-contrast",
    "background": "primary-hover",
    "min": 4.5
  },
  {
    "foreground": "text-inverse",
    "background": "primary",
    "min": 4.5
  },
  {
    "foreground": "text-inverse",
    "background": "primary-hover",
    "min": 4.5
  },
  {
    "foreground": "accent-contrast",
    "background": "accent",
    "min": 4.5
  },
  {
    "foreground": "text",
    "background": "success-surface",
    "min": 4.5
  },
  {
    "foreground": "text",
    "background": "warning-surface",
    "min": 4.5
  },
  {
    "foreground": "text",
    "background": "danger-surface",
    "min": 4.5
  },
  {
    "foreground": "text",
    "background": "info-surface",
    "min": 4.5
  },
  {
    "foreground": "success-text",
    "background": "surface",
    "min": 4.5
  },
  {
    "foreground": "success-text",
    "background": "success-surface",
    "min": 4.5
  },
  {
    "foreground": "warning-text",
    "background": "surface",
    "min": 4.5
  },
  {
    "foreground": "warning-text",
    "background": "warning-surface",
    "min": 4.5
  },
  {
    "foreground": "danger-text",
    "background": "surface",
    "min": 4.5
  },
  {
    "foreground": "danger-text",
    "background": "danger-surface",
    "min": 4.5
  },
  {
    "foreground": "info-text",
    "background": "surface",
    "min": 4.5
  },
  {
    "foreground": "info-text",
    "background": "info-surface",
    "min": 4.5
  },
  {
    "foreground": "border-strong",
    "background": "surface",
    "min": 3
  },
  {
    "foreground": "border-strong",
    "background": "surface-muted",
    "min": 3
  },
  {
    "foreground": "focus-ring",
    "background": "surface",
    "min": 3
  },
  {
    "foreground": "focus-ring",
    "background": "surface-raised",
    "min": 3
  },
  {
    "foreground": "focus-ring",
    "background": "surface-muted",
    "min": 3
  },
  {
    "foreground": "success",
    "background": "surface",
    "min": 3
  },
  {
    "foreground": "success",
    "background": "surface-muted",
    "min": 3
  },
  {
    "foreground": "warning",
    "background": "surface",
    "min": 3
  },
  {
    "foreground": "warning",
    "background": "surface-muted",
    "min": 3
  },
  {
    "foreground": "danger",
    "background": "surface",
    "min": 3
  },
  {
    "foreground": "danger",
    "background": "surface-muted",
    "min": 3
  },
  {
    "foreground": "info",
    "background": "surface",
    "min": 3
  },
  {
    "foreground": "info",
    "background": "surface-muted",
    "min": 3
  }
];

/** Non-color tokens: group → CSS variable → value (same in every brand). */
export const BASE_TOKENS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  "breakpoint": {
    "--uw-breakpoint-sm": "40rem",
    "--uw-breakpoint-md": "48rem",
    "--uw-breakpoint-lg": "64rem",
    "--uw-breakpoint-xl": "80rem"
  },
  "container": {
    "--uw-container-prose": "40rem",
    "--uw-container-md": "48rem",
    "--uw-container-lg": "64rem",
    "--uw-container-xl": "80rem"
  },
  "gutter": {
    "--uw-gutter-page": "clamp(1rem, 1.7391vw + 0.6087rem, 2rem)"
  },
  "gap": {
    "--uw-gap-sm": "clamp(0.75rem, 0.4348vw + 0.6522rem, 1rem)",
    "--uw-gap-md": "clamp(1rem, 0.8696vw + 0.8043rem, 1.5rem)",
    "--uw-gap-lg": "clamp(1.5rem, 1.7391vw + 1.1087rem, 2.5rem)"
  },
  "z-index": {
    "--uw-z-index-base": "0",
    "--uw-z-index-raised": "10",
    "--uw-z-index-dropdown": "100",
    "--uw-z-index-sticky": "200",
    "--uw-z-index-overlay": "300",
    "--uw-z-index-modal": "400",
    "--uw-z-index-toast": "500"
  },
  "duration": {
    "--uw-duration-fast": "120ms",
    "--uw-duration-base": "200ms",
    "--uw-duration-slow": "320ms"
  },
  "easing": {
    "--uw-easing-standard": "cubic-bezier(0.2, 0, 0, 1)",
    "--uw-easing-enter": "cubic-bezier(0, 0, 0.2, 1)",
    "--uw-easing-exit": "cubic-bezier(0.4, 0, 1, 1)"
  },
  "radius": {
    "--uw-radius-sm": "0.375rem",
    "--uw-radius-md": "0.75rem",
    "--uw-radius-lg": "1rem",
    "--uw-radius-xl": "1.5rem",
    "--uw-radius-full": "9999px"
  },
  "border-width": {
    "--uw-border-width-thin": "1px",
    "--uw-border-width-medium": "2px",
    "--uw-border-width-thick": "0.25rem"
  },
  "shadow": {
    "--uw-shadow-sm": "0 1px 2px rgb(28 33 40 / 0.06), 0 1px 3px rgb(28 33 40 / 0.08)",
    "--uw-shadow-md": "0 4px 8px -2px rgb(28 33 40 / 0.08), 0 2px 4px -2px rgb(28 33 40 / 0.06)",
    "--uw-shadow-lg": "0 12px 24px -6px rgb(28 33 40 / 0.12), 0 4px 8px -4px rgb(28 33 40 / 0.06)"
  },
  "focus-ring": {
    "--uw-focus-ring-width": "3px",
    "--uw-focus-ring-offset": "2px"
  },
  "space": {
    "--uw-space-0": "0",
    "--uw-space-1": "0.25rem",
    "--uw-space-2": "0.5rem",
    "--uw-space-3": "0.75rem",
    "--uw-space-4": "1rem",
    "--uw-space-5": "1.25rem",
    "--uw-space-6": "1.5rem",
    "--uw-space-8": "2rem",
    "--uw-space-10": "2.5rem",
    "--uw-space-12": "3rem",
    "--uw-space-16": "4rem",
    "--uw-space-20": "5rem",
    "--uw-space-24": "6rem"
  },
  "section-space": {
    "--uw-section-space-sm": "clamp(2rem, 1.7391vw + 1.6087rem, 3rem)",
    "--uw-section-space-md": "clamp(3rem, 3.4783vw + 2.2174rem, 5rem)",
    "--uw-section-space-lg": "clamp(4rem, 5.2174vw + 2.8261rem, 7rem)"
  },
  "font-family": {
    "--uw-font-family-display": "system-ui, -apple-system, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
    "--uw-font-family-body": "system-ui, -apple-system, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
    "--uw-font-family-mono": "ui-monospace, SFMono-Regular, Menlo, Consolas, \"Liberation Mono\", monospace"
  },
  "font-size": {
    "--uw-font-size-xs": "0.75rem",
    "--uw-font-size-sm": "0.875rem",
    "--uw-font-size-md": "clamp(1rem, 0.1087vw + 0.9755rem, 1.0625rem)",
    "--uw-font-size-lg": "clamp(1.125rem, 0.2174vw + 1.0761rem, 1.25rem)",
    "--uw-font-size-xl": "clamp(1.25rem, 0.4348vw + 1.1522rem, 1.5rem)",
    "--uw-font-size-2xl": "clamp(1.5rem, 0.6522vw + 1.3533rem, 1.875rem)",
    "--uw-font-size-3xl": "clamp(1.75rem, 1.087vw + 1.5054rem, 2.375rem)",
    "--uw-font-size-4xl": "clamp(2rem, 1.7391vw + 1.6087rem, 3rem)",
    "--uw-font-size-5xl": "clamp(2.375rem, 2.3913vw + 1.837rem, 3.75rem)"
  },
  "font-weight": {
    "--uw-font-weight-regular": "400",
    "--uw-font-weight-semibold": "600",
    "--uw-font-weight-bold": "700",
    "--uw-font-weight-extrabold": "800"
  },
  "line-height": {
    "--uw-line-height-tight": "1.2",
    "--uw-line-height-snug": "1.35",
    "--uw-line-height-body": "1.6"
  },
  "letter-spacing": {
    "--uw-letter-spacing-tight": "-0.01em",
    "--uw-letter-spacing-normal": "0",
    "--uw-letter-spacing-wide": "0.05em"
  }
};
