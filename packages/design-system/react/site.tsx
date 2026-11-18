import { type ReactNode, useId } from "react";

import { Anchor } from "./actions.tsx";
import { cx } from "./cx.ts";
import { Container } from "./layout.tsx";
import { SiteMenu } from "./site-menu.tsx";

// The frame of every public page (Task 2.4b): `SiteHeader` and `SiteFooter`. Server Components; only
// the header's mobile menu (`SiteMenu`) runs in the browser. All text comes from props.

export interface SiteLink {
  readonly label: string;
  /** A path or an anchor of the same site (`/formations`, `#formations`), or an external URL. */
  readonly href: string;
}

// Navigation links: no underline (a list in a `nav` landmark says "link" by itself), underlined on
// hover; padding gives touch targets of at least 24 × 24 px (WCAG 2.5.8).
const NAV_LINK =
  "block rounded-sm py-3 font-semibold text-text hover:text-primary hover:underline hover:underline-offset-4 focus-visible:focus-ring md:py-2";

export interface SiteHeaderProps {
  /** The logo, usually a link to the home page whose accessible name says so. */
  readonly logo: ReactNode;
  /** Names the navigation landmark, e.g. "Navigation principale". */
  readonly navLabel: string;
  /** Visible text of the menu button on small screens, e.g. "Menu". */
  readonly menuLabel: string;
  /** The page's sections (anchors) or the site's main pages. */
  readonly items: readonly SiteLink[];
  /**
   * The one primary action (e.g. a `ButtonLink`). Shown in the header row from the `sm`
   * breakpoint, and at the bottom of the open menu below it.
   */
  readonly cta?: ReactNode;
  readonly className?: string;
}

/**
 * Sticky header: logo, navigation, one call to action. Below `md` the navigation sits behind a
 * "Menu" button (disclosure). The page keeps anchors clear of it (`scroll-padding-top`, css/base.css,
 * applies while a `[data-site-header]` is on the page).
 */
export function SiteHeader({ logo, navLabel, menuLabel, items, cta, className }: SiteHeaderProps) {
  return (
    <header
      data-site-header=""
      className={cx(
        "sticky top-0 z-sticky border-b-thin border-border bg-surface text-text",
        className,
      )}
    >
      <Container className="flex h-16 items-center gap-4">
        <div className="flex shrink-0 items-center">{logo}</div>
        <SiteMenu label={navLabel} menuLabel={menuLabel}>
          <ul className="flex flex-col gap-1 md:flex-row md:justify-center md:gap-6">
            {items.map((item) => (
              <li key={item.href}>
                <Anchor href={item.href} className={NAV_LINK}>
                  {item.label}
                </Anchor>
              </li>
            ))}
          </ul>
          {cta === undefined ? null : <div className="mt-4 sm:hidden">{cta}</div>}
        </SiteMenu>
        {cta === undefined ? null : <div className="hidden shrink-0 sm:flex">{cta}</div>}
      </Container>
    </header>
  );
}

export interface SiteFooterColumn {
  /** Title of the column (a level-2 heading) and the name of its navigation landmark. */
  readonly title: string;
  readonly links: readonly SiteLink[];
}

export interface SiteFooterProps {
  /** Link columns (site map, contact, social networks…). Optional. */
  readonly columns?: readonly SiteFooterColumn[];
  /** Names the legal links' navigation landmark, e.g. "Informations légales". */
  readonly legalNavLabel: string;
  /** Legal notice, privacy policy, cookies… */
  readonly legalLinks: readonly SiteLink[];
  /**
   * Who publishes the site: company or association name, legal form, address, registration
   * number. Comes from the tenant's settings; never written in the design system.
   */
  readonly legalEntity: ReactNode;
  /** A short line under the legal entity (e.g. copyright). Optional. */
  readonly note?: ReactNode;
  readonly className?: string;
}

const FOOTER_LINK =
  "rounded-sm text-text hover:text-primary hover:underline hover:underline-offset-4 focus-visible:focus-ring";

/**
 * Page footer (`contentinfo` landmark): optional link columns, then the legal entity line and the
 * legal links. On `surface-muted`.
 */
export function SiteFooter({
  columns = [],
  legalNavLabel,
  legalLinks,
  legalEntity,
  note,
  className,
}: SiteFooterProps) {
  return (
    <footer className={cx("border-t-thin border-border bg-surface-muted text-text", className)}>
      <Container className="py-section-sm">
        {columns.length === 0 ? null : (
          <div className="mb-8 grid gap-gap-lg sm:grid-cols-2 lg:grid-cols-4">
            {columns.map((column) => (
              <FooterColumn key={column.title} column={column} />
            ))}
          </div>
        )}
        <div
          className={cx(
            "flex flex-col gap-4 text-sm leading-body lg:flex-row lg:items-start lg:justify-between",
            columns.length > 0 && "border-t-thin border-border pt-6",
          )}
        >
          <div className="flex flex-col gap-1">
            <p className="text-text-muted">{legalEntity}</p>
            {note === undefined ? null : <p className="text-text-muted">{note}</p>}
          </div>
          <nav aria-label={legalNavLabel}>
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Anchor href={link.href} className={FOOTER_LINK}>
                    {link.label}
                  </Anchor>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({ column }: { readonly column: SiteFooterColumn }) {
  const titleId = useId();
  return (
    <nav aria-labelledby={titleId}>
      <h2 id={titleId} className="mb-3 text-sm font-semibold uppercase tracking-wide">
        {column.title}
      </h2>
      <ul className="flex flex-col gap-2 text-sm leading-body">
        {column.links.map((link) => (
          <li key={link.href}>
            <Anchor href={link.href} className={FOOTER_LINK}>
              {link.label}
            </Anchor>
          </li>
        ))}
      </ul>
    </nav>
  );
}
