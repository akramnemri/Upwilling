import { LoaderCircle } from "lucide-react";

import { cx } from "./cx.ts";
import { Icon, type IconSize } from "./icon.tsx";

// Loading indicators. Their animations stop under prefers-reduced-motion (css/base.css), and the
// spinner's label is what assistive technology announces, so nothing depends on the motion.

interface SpinnerBaseProps {
  /** Default `md`. */
  readonly size?: IconSize;
  readonly className?: string;
}

export type SpinnerProps = SpinnerBaseProps &
  (
    | {
        /** Announced politely while the spinner is shown, e.g. "Chargement des formations". */
        readonly label: string;
        readonly decorative?: false;
      }
    | {
        /** Inside a control that already says it is busy (e.g. a loading Button). */
        readonly decorative: true;
        readonly label?: undefined;
      }
  );

/** A rotating ring in the current text color. */
export function Spinner(props: SpinnerProps) {
  const { size = "md", className } = props;
  const ring = (
    <Icon icon={LoaderCircle} size={size} className={cx("motion-safe:animate-spin", className)} />
  );
  if (props.decorative === true) {
    return ring;
  }
  return (
    <span role="status" className="inline-flex items-center">
      {ring}
      <span className="sr-only">{props.label}</span>
    </span>
  );
}

// `line` has no width here: each line gets its own (the last of several is shorter).
const SKELETON_SHAPES = {
  line: "h-4 rounded-sm",
  title: "h-6 w-2/3 rounded-sm",
  avatar: "size-12 rounded-full",
  block: "h-24 w-full rounded-md",
} as const;

export interface SkeletonProps {
  /** Default `line`. */
  readonly shape?: keyof typeof SKELETON_SHAPES;
  /** For `line`: how many lines (the last one is shorter). Default 1. */
  readonly lines?: number;
  readonly className?: string;
}

/**
 * A placeholder shape while content loads. Hidden from assistive technology: the region that loads
 * says so itself (e.g. `aria-busy="true"` on it, or a `Spinner` with a label).
 */
export function Skeleton({ shape = "line", lines = 1, className }: SkeletonProps) {
  const count = shape === "line" ? Math.max(1, Math.floor(lines)) : 1;
  return (
    <span aria-hidden="true" className={cx("flex w-full flex-col gap-2", className)}>
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className={cx(
            "block bg-border motion-safe:animate-pulse",
            SKELETON_SHAPES[shape],
            shape === "line" && (count > 1 && index === count - 1 ? "w-2/3" : "w-full"),
          )}
        />
      ))}
    </span>
  );
}
