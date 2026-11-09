import type { HTMLAttributes, ReactNode } from "react";

import { cx } from "./cx.ts";

// Layout primitives: page width, vertical rhythm, stacks and responsive grids. Every class below is a
// token utility from the generated theme (css/theme.css).

type BlockElement = "div" | "section" | "header" | "footer" | "main" | "nav" | "aside" | "article";

const CONTAINER_WIDTHS = {
  prose: "max-w-prose",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
} as const;

export interface ContainerProps extends HTMLAttributes<HTMLElement> {
  readonly as?: BlockElement;
  /** Maximum width, from the container tokens. Default `xl`. */
  readonly width?: keyof typeof CONTAINER_WIDTHS;
}

/** Centers its content at a token width, with the page gutter on both sides. */
export function Container({
  as: Element = "div",
  width = "xl",
  className,
  ...rest
}: ContainerProps) {
  return (
    <Element
      className={cx("mx-auto w-full px-gutter-page", CONTAINER_WIDTHS[width], className)}
      {...rest}
    />
  );
}

const SECTION_SPACING = {
  sm: "py-section-sm",
  md: "py-section-md",
  lg: "py-section-lg",
} as const;

// Each background sets the text color that passes contrast on it (see tokens/semantic/color.json).
const SECTION_BACKGROUNDS = {
  surface: "bg-surface text-text",
  muted: "bg-surface-muted text-text",
  primary: "bg-primary text-primary-contrast",
} as const;

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  readonly as?: "section" | "div" | "header" | "footer" | "aside";
  /** Vertical padding, from the section rhythm tokens. Default `md`. */
  readonly spacing?: keyof typeof SECTION_SPACING;
  /** Default `surface`. Text inside `primary` uses the primary-contrast color. */
  readonly background?: keyof typeof SECTION_BACKGROUNDS;
}

/** A full-width band of the page. Put a `Container` inside to center its content. */
export function Section({
  as: Element = "section",
  spacing = "md",
  background = "surface",
  className,
  ...rest
}: SectionProps) {
  return (
    <Element
      className={cx(SECTION_SPACING[spacing], SECTION_BACKGROUNDS[background], className)}
      {...rest}
    />
  );
}

const GAPS = {
  "1": "gap-1",
  "2": "gap-2",
  "3": "gap-3",
  "4": "gap-4",
  "6": "gap-6",
  "8": "gap-8",
  sm: "gap-gap-sm",
  md: "gap-gap-md",
  lg: "gap-gap-lg",
} as const;

/** A spacing token: a step of the 4 px scale, or a fluid gap (`sm`, `md`, `lg`). */
export type Gap = keyof typeof GAPS;

const ALIGN = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
} as const;

const JUSTIFY = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
} as const;

export interface StackProps extends HTMLAttributes<HTMLElement> {
  readonly as?: BlockElement | "ul" | "ol";
  /** Default `column`. */
  readonly direction?: "column" | "row";
  /** Default `4`. */
  readonly gap?: Gap;
  readonly align?: keyof typeof ALIGN;
  readonly justify?: keyof typeof JUSTIFY;
  /** Lets a row wrap onto several lines. */
  readonly wrap?: boolean;
  readonly children?: ReactNode;
}

/** Lays its children out in a column or a row, with a token gap between them. */
export function Stack({
  as: Element = "div",
  direction = "column",
  gap = "4",
  align,
  justify,
  wrap = false,
  className,
  ...rest
}: StackProps) {
  return (
    <Element
      className={cx(
        "flex",
        direction === "column" ? "flex-col" : "flex-row",
        GAPS[gap],
        align !== undefined && ALIGN[align],
        justify !== undefined && JUSTIFY[justify],
        wrap && "flex-wrap",
        className,
      )}
      {...rest}
    />
  );
}

// One column on phones, at most two from the md breakpoint, the full count from lg.
const GRID_COLUMNS = {
  "1": "grid-cols-1",
  "2": "grid-cols-1 md:grid-cols-2",
  "3": "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  "4": "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
} as const;

export interface GridProps extends HTMLAttributes<HTMLElement> {
  readonly as?: BlockElement | "ul" | "ol";
  /** Columns on wide screens. Default `3`. */
  readonly columns?: 1 | 2 | 3 | 4;
  /** Default `md` (fluid). */
  readonly gap?: Gap;
}

/** A responsive grid: one column on phones, `columns` on wide screens. */
export function Grid({
  as: Element = "div",
  columns = 3,
  gap = "md",
  className,
  ...rest
}: GridProps) {
  return (
    <Element className={cx("grid", GRID_COLUMNS[`${columns}`], GAPS[gap], className)} {...rest} />
  );
}
