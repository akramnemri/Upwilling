import { ChevronRight } from "lucide-react";

import { Link } from "./actions.tsx";
import { Icon } from "./icon.tsx";

// Navigation aids (Task 2.2c). `SiteHeader` and `SiteFooter` come in Task 2.4.

export interface BreadcrumbLink {
  readonly label: string;
  /** A path of the same site, e.g. `/formations`. */
  readonly href: string;
}

export interface BreadcrumbsProps {
  /** Names the navigation landmark, e.g. "Fil d’Ariane". */
  readonly label: string;
  /** The pages above the current one, from the home page down. */
  readonly items: readonly BreadcrumbLink[];
  /** The current page's title: plain text marked `aria-current="page"`, never a link to itself. */
  readonly current: string;
  readonly className?: string;
}

/**
 * Where the page sits in the site: a labelled `nav` landmark around an ordered list (screen readers
 * say how many levels there are). The separators are decorative and hidden from assistive technology.
 * For surface backgrounds (the links use the primary color).
 */
export function Breadcrumbs({ label, items, current, className }: BreadcrumbsProps) {
  return (
    <nav aria-label={label} className={className}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-body">
        {items.map((item) => (
          <li key={item.href} className="flex items-center gap-2">
            <Link href={item.href}>{item.label}</Link>
            <Icon icon={ChevronRight} size="sm" className="text-text-muted" />
          </li>
        ))}
        <li>
          <span aria-current="page" className="font-semibold">
            {current}
          </span>
        </li>
      </ol>
    </nav>
  );
}
