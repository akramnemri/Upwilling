"use client";

// Client Component on purpose: `useFormStatus` (react-dom) exists only in the browser build of React.
// It is the only one in the design system so far.

import type { MouseEvent } from "react";
import { useFormStatus } from "react-dom";

import { Button, type ButtonProps } from "./actions.tsx";
import { Spinner } from "./feedback.tsx";

export type SubmitButtonProps = Omit<
  ButtonProps,
  "type" | "loading" | "loadingLabel" | "aria-disabled" | "aria-busy"
> & {
  /** Announced politely while the form is being sent, e.g. "Envoi en cours". */
  readonly pendingLabel: string;
};

/**
 * The submit button of a `<form action={…}>`. While the action runs it shows a spinner, refuses
 * further clicks (no double submit) and announces `pendingLabel` through a status region that is on
 * the page from the start, so screen readers read the change. It stays focusable: a `disabled`
 * button would lose the keyboard focus to the page (HTML focus fixup), so it uses `aria-disabled`.
 * Must be rendered inside the form.
 */
export function SubmitButton({
  pendingLabel,
  size = "md",
  icon,
  onClick,
  children,
  ...rest
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (pending) {
      // Also stops Enter in a text field: implicit submission clicks the submit button.
      event.preventDefault();
      return;
    }
    onClick?.(event);
  }

  return (
    <>
      <Button
        {...rest}
        type="submit"
        size={size}
        {...(!pending && icon !== undefined && { icon })}
        aria-disabled={pending || undefined}
        aria-busy={pending || undefined}
        onClick={handleClick}
      >
        {pending ? (
          <>
            <Spinner decorative size={size === "lg" ? "md" : "sm"} />
            {children}
          </>
        ) : (
          children
        )}
      </Button>
      <span role="status" className="sr-only">
        {pending ? pendingLabel : ""}
      </span>
    </>
  );
}
