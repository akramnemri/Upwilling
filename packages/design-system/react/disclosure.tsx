import { Tabs as TabsRoot, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { ChevronDown } from "lucide-react";
import { type ReactNode, useId } from "react";

import { cx } from "./cx.ts";
import { Icon } from "./icon.tsx";

// Disclosure widgets (Task 2.2c). Both are Server Components:
// - Accordion is native `<details>`/`<summary>`: the browser handles the keyboard (Tab, Enter, Space)
//   and tells screen readers whether a panel is expanded, with no JavaScript at all.
// - Tabs renders Radix's parts (HTML has no tabs element). Radix ships `"use client"` itself, so
//   only its parts run in the browser; the panels' content is rendered here, on the server.

export interface AccordionItem {
  /** Stable key, also used by `defaultOpen`. */
  readonly value: string;
  /**
   * The always-visible label that opens the panel. Plain text: a heading inside `<summary>` is not
   * announced as a heading by every browser and screen reader.
   */
  readonly title: ReactNode;
  readonly content: ReactNode;
}

export interface AccordionProps {
  readonly items: readonly AccordionItem[];
  /**
   * Opening a panel closes the others (native `name` grouping). Browsers without it let several
   * panels open, which still works. Default false.
   */
  readonly exclusive?: boolean;
  /** Values of the panels open at first. With `exclusive`, only the first one counts. */
  readonly defaultOpen?: readonly string[];
  readonly className?: string;
}

/**
 * Panels that open and close under their title (questions and answers, programme details). Every
 * panel's content is in the HTML, closed or not: search engines see it, and Chromium's find-in-page
 * opens the panel that holds a match.
 */
export function Accordion({
  items,
  exclusive = false,
  defaultOpen = [],
  className,
}: AccordionProps) {
  const groupName = useId();
  const openAtFirst = exclusive ? defaultOpen.slice(0, 1) : defaultOpen;
  return (
    <div className={cx("flex flex-col gap-3", className)}>
      {items.map((item) => (
        <details
          key={item.value}
          name={exclusive ? groupName : undefined}
          open={openAtFirst.includes(item.value)}
          className="group rounded-md border-thin border-border bg-surface-raised text-text"
        >
          {/* `list-none` hides the marker; Safari needs its own pseudo-element hidden too. */}
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md px-5 py-4 text-md leading-snug font-semibold hover:bg-surface-muted focus-visible:focus-ring [&::-webkit-details-marker]:hidden">
            <span>{item.title}</span>
            <Icon
              icon={ChevronDown}
              className="text-primary transition-transform duration-fast group-open:rotate-180"
            />
          </summary>
          <div className="px-5 pt-2 pb-5 text-md leading-body">{item.content}</div>
        </details>
      ))}
    </div>
  );
}

export interface TabItem {
  /** Short id-like key (letters, digits, hyphens): Radix builds the element ids from it. */
  readonly value: string;
  readonly label: ReactNode;
  readonly content: ReactNode;
}

export interface TabsProps {
  /** Names the tab list for assistive technology, e.g. "Domaines de formation". */
  readonly label: string;
  readonly items: readonly TabItem[];
  /** The tab selected at first. Default: the first item. */
  readonly defaultValue?: string;
  readonly className?: string;
}

/**
 * Tabs (WAI-ARIA tabs pattern, by Radix): the list is one Tab stop, the arrow keys (and Home, End)
 * move between tabs and show their panel at once, and Tab then moves into the panel. The selected
 * tab is filled with the primary color, so its state does not rely on a subtle color change. Only
 * the selected panel is in the page; without JavaScript, the first one shows.
 */
export function Tabs({ label, items, defaultValue, className }: TabsProps) {
  return (
    <TabsRoot defaultValue={defaultValue ?? items[0]?.value} className={className}>
      <TabsList aria-label={label} className="flex flex-wrap gap-2">
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            className="cursor-pointer rounded-full border-thin border-border-strong bg-surface px-4 py-2 text-sm leading-tight font-semibold text-text transition-colors duration-fast hover:bg-surface-muted focus-visible:focus-ring aria-selected:border-primary aria-selected:bg-primary aria-selected:text-primary-contrast aria-selected:hover:bg-primary-hover"
          >
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map((item) => (
        <TabsContent
          key={item.value}
          value={item.value}
          className="mt-6 rounded-md focus-visible:focus-ring"
        >
          {item.content}
        </TabsContent>
      ))}
    </TabsRoot>
  );
}
