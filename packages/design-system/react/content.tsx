import { ArrowRight, type LucideIcon } from "lucide-react";
import NextLink from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { isInternalHref } from "./actions.tsx";
import { cx } from "./cx.ts";
import { Icon } from "./icon.tsx";

// Small content pieces: badges, chips, the announcement pill and cards. Each foreground/background
// pair below is one of the contrast pairs checked for both brands (tokens/semantic/color.json).

const BADGE_TONES = {
  neutral: "bg-surface-muted text-text",
  primary: "bg-primary text-primary-contrast",
  success: "bg-success-surface text-success-text",
  warning: "bg-warning-surface text-warning-text",
  danger: "bg-danger-surface text-danger-text",
  info: "bg-info-surface text-info-text",
} as const;

export interface BadgeProps extends ComponentPropsWithoutRef<"span"> {
  /** Default `neutral`. The text must say the status too: color alone is not enough. */
  readonly tone?: keyof typeof BADGE_TONES;
}

/** A short status or level label ("Débutant", "Complet"). Not interactive. */
export function Badge({ tone = "neutral", className, ...rest }: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold leading-tight",
        BADGE_TONES[tone],
        className,
      )}
      {...rest}
    />
  );
}

export interface ChipProps extends ComponentPropsWithoutRef<"span"> {
  /** A decorative Lucide icon before the text. */
  readonly icon?: LucideIcon;
}

/** An outlined tag for a technology or a topic ("React", "Cybersécurité"). Not interactive. */
export function Chip({ icon, className, children, ...rest }: ChipProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border-thin border-border-strong bg-surface px-3 py-1 text-sm leading-tight text-text",
        className,
      )}
      {...rest}
    >
      {icon !== undefined && <Icon icon={icon} size="sm" />}
      {children}
    </span>
  );
}

export interface AnnouncementPillProps {
  /** The short tag at the start, e.g. "Nouveau". */
  readonly tag?: string;
  /** Makes the whole pill a link (an arrow shows it). */
  readonly href?: string;
  readonly className?: string;
  readonly children: ReactNode;
}

/** The pill above a hero title: "Nouveau · Les inscriptions de mars sont ouvertes →". */
export function AnnouncementPill({ tag, href, className, children }: AnnouncementPillProps) {
  const classes = cx(
    "inline-flex items-center gap-2 rounded-full bg-surface-muted py-1 pe-4 text-sm leading-tight text-text",
    // With a tag, the tag's own pill sits close to the edge.
    tag === undefined ? "ps-4" : "ps-1",
    href !== undefined && "hover:underline focus-visible:focus-ring",
    className,
  );
  const content = (
    <>
      {tag !== undefined && (
        <span className="rounded-full bg-primary px-2 py-1 text-xs font-semibold text-primary-contrast">
          {tag}
        </span>
      )}
      {/* Keeps "Nouveau" and the text apart in the accessible name ("Nouveau Sessions…"). */}{" "}
      <span>{children}</span>
      {href !== undefined && <Icon icon={ArrowRight} size="sm" />}
    </>
  );
  if (href === undefined) {
    return <p className={classes}>{content}</p>;
  }
  return isInternalHref(href) ? (
    <NextLink href={href} className={classes}>
      {content}
    </NextLink>
  ) : (
    <a href={href} className={classes}>
      {content}
    </a>
  );
}

export interface CardProps extends ComponentPropsWithoutRef<"article"> {
  /** `article` for a self-contained item (a course, a news item), `li` inside a list. Default `article`. */
  readonly as?: "article" | "div" | "li";
}

/** A bordered panel. Compose it with CardMedia, CardHeader, CardBody and CardFooter. */
export function Card({ as: Element = "article", className, ...rest }: CardProps) {
  return (
    <Element
      className={cx(
        "flex flex-col overflow-hidden rounded-lg border-thin border-border bg-surface-raised text-text shadow-sm",
        className,
      )}
      {...rest}
    />
  );
}

/** Full-bleed media at the top of a card (an image with its own width, height and alt text). */
export function CardMedia({ className, ...rest }: ComponentPropsWithoutRef<"div">) {
  return <div className={cx("overflow-hidden", className)} {...rest} />;
}

export function CardHeader({ className, ...rest }: ComponentPropsWithoutRef<"div">) {
  // `items-start`: a badge or chip in the header keeps its own width instead of stretching.
  return <div className={cx("flex flex-col items-start gap-2 px-6 pt-6", className)} {...rest} />;
}

export function CardBody({ className, ...rest }: ComponentPropsWithoutRef<"div">) {
  return <div className={cx("flex-1 px-6 py-4", className)} {...rest} />;
}

export function CardFooter({ className, ...rest }: ComponentPropsWithoutRef<"div">) {
  return <div className={cx("flex flex-wrap items-center gap-3 px-6 pb-6", className)} {...rest} />;
}
