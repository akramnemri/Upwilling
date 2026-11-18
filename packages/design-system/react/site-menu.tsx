"use client";

// Client Component on purpose: the mobile menu is a disclosure (WAI-ARIA "disclosure navigation"):
// a button with `aria-expanded` shows and hides the links. That state, Escape and closing after a
// link is chosen need JavaScript. The links themselves are rendered on the server (`children`).

import { Menu, X } from "lucide-react";
import { type MouseEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";

import { cx } from "./cx.ts";
import { Icon } from "./icon.tsx";

export interface SiteMenuProps {
  /** Names the navigation landmark, e.g. "Navigation principale". */
  readonly label: string;
  /** Visible text of the menu button on small screens, e.g. "Menu". */
  readonly menuLabel: string;
  /** The list of links (and anything shown with them in the open menu). */
  readonly children: ReactNode;
}

/**
 * Below the `md` breakpoint, the links hide behind a "Menu" button and open in a panel under the
 * header; from `md` up they are always shown in the header row and the button is gone. Escape
 * closes the panel and puts focus back on the button; choosing a link closes it (anchor links stay
 * on the same page, so nothing else would).
 */
export function SiteMenu({ label, menuLabel, children }: SiteMenuProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function closeOnLinkClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target instanceof Element && event.target.closest("a") !== null) {
      setOpen(false);
    }
  }

  return (
    <nav aria-label={label} className="ml-auto md:ml-0 md:flex-1">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-md font-semibold text-text hover:bg-surface-muted focus-visible:focus-ring md:hidden"
      >
        <Icon icon={open ? X : Menu} size="md" />
        {menuLabel}
      </button>
      {/* The click handler only notices a link being followed (Enter on a link fires a click too); */}
      {/* the container is not a control. */}
      <div
        id={panelId}
        onClick={closeOnLinkClick}
        className={cx(
          "max-md:absolute max-md:inset-x-0 max-md:top-full max-md:border-b-thin max-md:border-border max-md:bg-surface max-md:px-gutter-page max-md:py-4 max-md:shadow-md",
          !open && "max-md:hidden",
        )}
      >
        {children}
      </div>
    </nav>
  );
}
