"use client";

// Client Component on purpose: a modal `<dialog>` opens only through its `showModal()` method. The
// declarative way (`command`/`commandfor` on a button) is not in React 19.2's types and is too recent
// for phones that cannot update their browser. Everything else is the browser's own behavior.

import { X } from "lucide-react";
import { type ReactNode, useId, useRef } from "react";

import { Button, type ButtonVariant } from "./actions.tsx";
import { Icon } from "./icon.tsx";
import { Heading, Text } from "./typography.tsx";

export interface DialogProps {
  /** Text of the button that opens the dialog. */
  readonly triggerLabel: string;
  /** Default `secondary`. */
  readonly triggerVariant?: ButtonVariant;
  /** The dialog's title (a level-2 heading) and its accessible name. */
  readonly title: string;
  /** A short sentence under the title, read when the dialog opens. */
  readonly description?: ReactNode;
  /** Accessible name of the close button (an icon), e.g. "Fermer". */
  readonly closeLabel: string;
  readonly children?: ReactNode;
  /**
   * Actions at the bottom. A button that only closes the dialog goes in `<form method="dialog">`
   * (no JavaScript needed); a server action form works as usual.
   */
  readonly footer?: ReactNode;
}

/**
 * A modal dialog (native `<dialog>`, `showModal()`): it opens above everything, the rest of the page
 * becomes inert (Tab and the screen-reader cursor stay inside), focus moves to the close button,
 * Escape closes it, and focus returns to the button that opened it. Clicking outside does not close
 * it, so typed input is not lost by accident. Its content is rendered with the page, closed.
 */
export function Dialog({
  triggerLabel,
  triggerVariant = "secondary",
  title,
  description,
  closeLabel,
  children,
  footer,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <>
      <Button variant={triggerVariant} onClick={() => dialogRef.current?.showModal()}>
        {triggerLabel}
      </Button>
      {/* Width: the page gutter on each side, at most `prose`, centered by the auto margins. */}
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={description === undefined ? undefined : descriptionId}
        className="inset-x-gutter-page m-auto w-auto max-w-prose overflow-y-auto rounded-lg border-thin border-border bg-surface-raised p-0 text-text shadow-lg backdrop:bg-text/50"
      >
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <Heading level={2} size="xl" id={titleId}>
              {title}
            </Heading>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="shrink-0 cursor-pointer rounded-md p-2 text-text-muted transition-colors duration-fast hover:bg-surface-muted hover:text-text focus-visible:focus-ring"
            >
              <Icon icon={X} />
              <span className="sr-only">{closeLabel}</span>
            </button>
          </div>
          {description !== undefined && (
            <Text id={descriptionId} tone="muted">
              {description}
            </Text>
          )}
          {children}
          {footer !== undefined && (
            <div className="flex flex-wrap justify-end gap-3 pt-2">{footer}</div>
          )}
        </div>
      </dialog>
    </>
  );
}
