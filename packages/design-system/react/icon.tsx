import type { LucideIcon } from "lucide-react";

import { cx } from "./cx.ts";

// Icons come from Lucide (lucide-react, ISC license): import each icon by name where it is used, so
// the bundle only contains those (`import { ArrowRight } from "lucide-react"`).

const ICON_SIZES = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
} as const;

export type IconSize = keyof typeof ICON_SIZES;

interface IconBaseProps {
  /** A Lucide icon component, e.g. `ArrowRight`. */
  readonly icon: LucideIcon;
  /** Default `md`. */
  readonly size?: IconSize;
  readonly className?: string;
}

/**
 * Decorative by default (hidden from assistive technology, because the text next to it says the
 * same). Give a `label` when the icon is the only thing that carries the meaning.
 */
export type IconProps = IconBaseProps &
  ({ readonly label?: undefined } | { readonly label: string });

export function Icon({ icon: LucideComponent, size = "md", label, className }: IconProps) {
  const classes = cx("shrink-0", ICON_SIZES[size], className);
  if (label === undefined) {
    return <LucideComponent className={classes} aria-hidden="true" focusable="false" />;
  }
  return <LucideComponent className={classes} role="img" aria-label={label} focusable="false" />;
}
