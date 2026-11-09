import type { ComponentPropsWithoutRef } from "react";

import { cx } from "./cx.ts";

// Text primitives. Their color is inherited by default, so the same heading works on a light section
// and on a primary one (Section sets the text color that passes contrast on its background).

const HEADING_SIZES = {
  "5xl": "text-5xl",
  "4xl": "text-4xl",
  "3xl": "text-3xl",
  "2xl": "text-2xl",
  xl: "text-xl",
  lg: "text-lg",
  md: "text-md",
} as const;

export type HeadingSize = keyof typeof HEADING_SIZES;

/** The visual size each level gets unless `size` says otherwise. */
const DEFAULT_HEADING_SIZE = {
  1: "4xl",
  2: "3xl",
  3: "2xl",
  4: "xl",
  5: "lg",
  6: "md",
} as const satisfies Record<number, HeadingSize>;

const HEADING_TONES = {
  inherit: "",
  primary: "text-primary",
} as const;

export interface HeadingProps extends ComponentPropsWithoutRef<"h2"> {
  /** The document outline level (h1–h6). Pick it from the page structure, not from the look. */
  readonly level: 1 | 2 | 3 | 4 | 5 | 6;
  /** Visual size, independent of the level. Defaults to the level's usual size. */
  readonly size?: HeadingSize;
  /** Default `inherit`. `primary` passes contrast on surface backgrounds only. */
  readonly tone?: keyof typeof HEADING_TONES;
}

export function Heading({ level, size, tone = "inherit", className, ...rest }: HeadingProps) {
  const Element = `h${level}` as const;
  return (
    <Element
      className={cx(
        "font-display font-bold leading-tight text-balance",
        HEADING_SIZES[size ?? DEFAULT_HEADING_SIZE[level]],
        HEADING_TONES[tone],
        className,
      )}
      {...rest}
    />
  );
}

const TEXT_SIZES = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-md",
  lg: "text-lg",
  xl: "text-xl",
} as const;

const TEXT_TONES = {
  inherit: "",
  muted: "text-text-muted",
  primary: "text-primary",
} as const;

const TEXT_WEIGHTS = {
  regular: "font-regular",
  semibold: "font-semibold",
  bold: "font-bold",
} as const;

export interface TextProps extends ComponentPropsWithoutRef<"p"> {
  readonly as?: "p" | "span" | "div" | "strong" | "em" | "small";
  /** Default `md`. */
  readonly size?: keyof typeof TEXT_SIZES;
  /** Default `inherit`. `muted` and `primary` pass contrast on surface backgrounds only. */
  readonly tone?: keyof typeof TEXT_TONES;
  /** Default `regular`. */
  readonly weight?: keyof typeof TEXT_WEIGHTS;
}

export function Text({
  as: Element = "p",
  size = "md",
  tone = "inherit",
  weight = "regular",
  className,
  ...rest
}: TextProps) {
  return (
    <Element
      className={cx(
        "leading-body",
        TEXT_SIZES[size],
        TEXT_TONES[tone],
        TEXT_WEIGHTS[weight],
        className,
      )}
      {...rest}
    />
  );
}

const EYEBROW_TONES = {
  primary: "text-primary",
  inherit: "",
} as const;

export interface EyebrowProps extends ComponentPropsWithoutRef<"p"> {
  readonly as?: "p" | "span";
  /** Default `primary` (on surface backgrounds); use `inherit` on a primary section. */
  readonly tone?: keyof typeof EYEBROW_TONES;
}

/** The small uppercase label above a title. Put it before the heading in the source order. */
export function Eyebrow({ as: Element = "p", tone = "primary", className, ...rest }: EyebrowProps) {
  return (
    <Element
      className={cx(
        "text-sm font-semibold uppercase tracking-wide",
        EYEBROW_TONES[tone],
        className,
      )}
      {...rest}
    />
  );
}
