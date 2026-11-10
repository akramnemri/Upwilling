import {
  CircleAlert,
  CircleCheck,
  Info,
  LoaderCircle,
  type LucideIcon,
  TriangleAlert,
} from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cx } from "./cx.ts";
import { Icon, type IconSize } from "./icon.tsx";
import { Heading, Text } from "./typography.tsx";

// Feedback: loading indicators (Task 2.2a), alerts and empty states (Task 2.2b). Animations stop
// under prefers-reduced-motion (css/base.css), and the spinner's label is what assistive technology
// announces, so nothing depends on the motion.

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

// Status colors: text on a `*-surface` background and `*-text` titles both pass 4.5:1 (token pairs).
const ALERT_TONES = {
  info: { box: "border-info bg-info-surface", accent: "text-info-text", icon: Info },
  success: {
    box: "border-success bg-success-surface",
    accent: "text-success-text",
    icon: CircleCheck,
  },
  warning: {
    box: "border-warning bg-warning-surface",
    accent: "text-warning-text",
    icon: TriangleAlert,
  },
  danger: { box: "border-danger bg-danger-surface", accent: "text-danger-text", icon: CircleAlert },
} as const;

export type AlertTone = keyof typeof ALERT_TONES;

export interface AlertProps extends Omit<ComponentPropsWithoutRef<"div">, "role" | "title"> {
  /** Default `info`. The icon follows the tone; the title says it in words. */
  readonly tone?: AlertTone;
  readonly title?: ReactNode;
  /** Renders the title as a heading of this level (e.g. an error summary); a paragraph otherwise. */
  readonly titleLevel?: 2 | 3 | 4 | 5 | 6;
  /**
   * Only for an alert that appears after the page has loaded: `alert` interrupts the screen reader
   * (an error), `status` waits for a pause (a confirmation). A `status` region is announced
   * reliably only when it is already on the page and its content changes. None for an alert that is
   * part of the page from the start: it is read in order.
   */
  readonly role?: "alert" | "status";
}

/** A message about the page or a form: information, success, warning or error. */
export function Alert({
  tone = "info",
  title,
  titleLevel,
  className,
  children,
  ...rest
}: AlertProps) {
  const look = ALERT_TONES[tone];
  const TitleElement = titleLevel === undefined ? "p" : (`h${titleLevel}` as const);
  return (
    <div
      className={cx(
        "flex items-start gap-3 rounded-md border-thin p-4 text-text",
        look.box,
        className,
      )}
      {...rest}
    >
      <Icon icon={look.icon} className={cx("mt-1", look.accent)} />
      <div className="flex min-w-0 flex-col gap-1 text-md leading-body">
        {title !== undefined && (
          <TitleElement className={cx("text-md leading-body font-semibold", look.accent)}>
            {title}
          </TitleElement>
        )}
        {children}
      </div>
    </div>
  );
}

export interface EmptyStateProps {
  /** A decorative Lucide icon. */
  readonly icon?: LucideIcon;
  readonly title: ReactNode;
  /** The title's heading level, from the page structure. */
  readonly titleLevel: 2 | 3 | 4 | 5 | 6;
  readonly description?: ReactNode;
  /** What to do next, e.g. a `ButtonLink`. */
  readonly action?: ReactNode;
  readonly className?: string;
}

/** Shown where a list has nothing yet (no session, no result): says why and what to do next. */
export function EmptyState({
  icon,
  title,
  titleLevel,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cx(
        "flex flex-col items-center gap-3 rounded-lg border-thin border-dashed border-border-strong px-6 py-12 text-center",
        className,
      )}
    >
      {icon !== undefined && (
        <span className="rounded-full bg-surface-muted p-3 text-text-muted">
          <Icon icon={icon} size="lg" />
        </span>
      )}
      <Heading level={titleLevel} size="lg">
        {title}
      </Heading>
      {description !== undefined && (
        <Text tone="muted" className="max-w-prose">
          {description}
        </Text>
      )}
      {action !== undefined && <div className="mt-2">{action}</div>}
    </div>
  );
}
