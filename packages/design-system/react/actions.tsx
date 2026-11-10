import { ExternalLink, type LucideIcon } from "lucide-react";
import NextLink from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cx } from "./cx.ts";
import { Spinner } from "./feedback.tsx";
import { Icon } from "./icon.tsx";

// Links and buttons. None of them is a Client Component: they render on the server, and a Client
// Component may still use them with its own event handlers.

/** Same-site paths go through next/link (client navigation); everything else is a plain anchor. */
export function isInternalHref(href: string): boolean {
  return (
    (href.startsWith("/") && !href.startsWith("//")) || href.startsWith("#") || href.startsWith("?")
  );
}

/** Opening a new tab must be said to screen-reader users: the label is read after the link text. */
export type NewTabProps =
  | { readonly newTab?: false; readonly newTabLabel?: undefined }
  | {
      readonly newTab: true;
      /** E.g. "(nouvel onglet)". Visually hidden; an icon shows the same thing. */
      readonly newTabLabel: string;
    };

type AnchorProps = Omit<ComponentPropsWithoutRef<"a">, "href" | "target" | "rel"> &
  NewTabProps & { readonly href: string; readonly children: ReactNode };

function Anchor({
  href,
  newTab,
  newTabLabel,
  children,
  onClick,
  onMouseEnter,
  onTouchStart,
  ...rest
}: AnchorProps) {
  const target = newTab === true ? { target: "_blank", rel: "noopener noreferrer" } : {};
  // next/link declares these three itself and refuses an explicit `undefined` (exactOptionalPropertyTypes).
  const handlers = {
    ...(onClick !== undefined && { onClick }),
    ...(onMouseEnter !== undefined && { onMouseEnter }),
    ...(onTouchStart !== undefined && { onTouchStart }),
  };
  const content =
    newTab === true ? (
      <>
        {children}
        {/* A real space, so "(nouvel onglet)" is read as a separate word in the accessible name. */}{" "}
        <span className="sr-only">{newTabLabel}</span>
        <Icon icon={ExternalLink} size="sm" className="inline-block align-middle" />
      </>
    ) : (
      children
    );
  if (isInternalHref(href)) {
    return (
      <NextLink href={href} {...target} {...handlers} {...rest}>
        {content}
      </NextLink>
    );
  }
  return (
    <a href={href} {...target} {...handlers} {...rest}>
      {content}
    </a>
  );
}

const LINK_TONES = {
  primary: "text-primary hover:text-primary-hover",
  inherit: "",
} as const;

export type LinkProps = AnchorProps & {
  /** Default `primary` (on surface backgrounds); use `inherit` on a primary section. */
  readonly tone?: keyof typeof LINK_TONES;
};

/**
 * A text link, always underlined (color alone must not tell links apart, WCAG 1.4.1). Internal paths
 * use client navigation; external URLs, `mailto:` and `tel:` are plain anchors.
 */
export function Link({ tone = "primary", className, ...rest }: LinkProps) {
  return (
    <Anchor
      className={cx(
        "rounded-sm underline underline-offset-4 hover:decoration-2 focus-visible:focus-ring",
        LINK_TONES[tone],
        className,
      )}
      {...rest}
    />
  );
}

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold leading-tight whitespace-nowrap select-none transition-colors duration-fast focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:opacity-60";

const BUTTON_VARIANTS = {
  primary: "bg-primary text-primary-contrast hover:bg-primary-hover",
  secondary: "border-thin border-primary bg-surface text-primary hover:bg-surface-muted",
  ghost: "text-primary hover:bg-surface-muted",
  link: "text-primary underline underline-offset-4 hover:text-primary-hover",
} as const;

// Padding gives every size a target of at least 24 × 24 px (WCAG 2.5.8); `link` keeps text metrics.
const BUTTON_SIZES = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-3 text-md",
  lg: "px-6 py-4 text-lg",
} as const;

const LINK_VARIANT_SIZES = {
  sm: "text-sm",
  md: "text-md",
  lg: "text-lg",
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;
export type ButtonSize = keyof typeof BUTTON_SIZES;

function buttonClasses(variant: ButtonVariant, size: ButtonSize, className?: string): string {
  return cx(
    BUTTON_BASE,
    BUTTON_VARIANTS[variant],
    variant === "link" ? LINK_VARIANT_SIZES[size] : BUTTON_SIZES[size],
    className,
  );
}

interface ButtonLookProps {
  /** Default `primary`. */
  readonly variant?: ButtonVariant;
  /** Default `md`. */
  readonly size?: ButtonSize;
  /** A Lucide icon shown next to the label (decorative: the label says what the button does). */
  readonly icon?: LucideIcon;
  /** Default `start`. */
  readonly iconPosition?: "start" | "end";
  readonly children: ReactNode;
}

function withIcon(
  children: ReactNode,
  icon: LucideIcon | undefined,
  iconPosition: "start" | "end",
  size: ButtonSize,
): ReactNode {
  if (icon === undefined) {
    return children;
  }
  const glyph = <Icon icon={icon} size={size === "lg" ? "md" : "sm"} />;
  return iconPosition === "start" ? (
    <>
      {glyph}
      {children}
    </>
  ) : (
    <>
      {children}
      {glyph}
    </>
  );
}

type ButtonLoadingProps =
  | { readonly loading?: false; readonly loadingLabel?: undefined }
  | {
      /** Disables the button (no double submit) and shows a spinner. */
      readonly loading: true;
      /** Read after the button text while loading, e.g. "(envoi en cours)". */
      readonly loadingLabel: string;
    };

export type ButtonProps = Omit<ComponentPropsWithoutRef<"button">, "children"> &
  ButtonLookProps &
  ButtonLoadingProps;

/** A button. `type` defaults to `button`, so a button inside a form never submits it by accident. */
export function Button({
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "start",
  loading = false,
  loadingLabel,
  type = "button",
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled === true || loading}
      aria-busy={loading || undefined}
      className={buttonClasses(variant, size, className)}
      {...rest}
    >
      {loading ? (
        <>
          <Spinner decorative size={size === "lg" ? "md" : "sm"} />
          {children}
          {/* A real space: the label is read as separate words after the button text. */}{" "}
          <span className="sr-only">{loadingLabel}</span>
        </>
      ) : (
        withIcon(children, icon, iconPosition, size)
      )}
    </button>
  );
}

export type ButtonLinkProps = AnchorProps & ButtonLookProps;

/** A link that looks like a button: it navigates, it does not act. */
export function ButtonLink({
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "start",
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Anchor className={buttonClasses(variant, size, className)} {...rest}>
      {withIcon(children, icon, iconPosition, size)}
    </Anchor>
  );
}
