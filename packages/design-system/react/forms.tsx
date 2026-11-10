import { ChevronDown, CircleAlert } from "lucide-react";
import { type ComponentPropsWithoutRef, type ReactNode, useId } from "react";

import { cx } from "./cx.ts";
import { Icon } from "./icon.tsx";

// Form fields (Task 2.2b). Server Components: ids come from `useId()`, which React provides on the
// server, and a field hands its wiring (id, descriptions, error state) to its control through a
// render prop. A context would have made every control a Client Component. Validation and copy belong
// to the application: these components show what they are given.

/** True for a message worth rendering (`false`, `null`, `undefined` and `""` are not). */
function isPresent(node: ReactNode): boolean {
  return node !== undefined && node !== null && node !== false && node !== "";
}

interface MessageIds {
  readonly helpId: string | undefined;
  readonly errorId: string | undefined;
  /** Help first, then the error: the order in which a screen reader reads them. */
  readonly describedBy: string | undefined;
}

function messageIds(baseId: string, help: ReactNode, error: ReactNode): MessageIds {
  const helpId = isPresent(help) ? `${baseId}-help` : undefined;
  const errorId = isPresent(error) ? `${baseId}-error` : undefined;
  const ids = [helpId, errorId].filter((value) => value !== undefined);
  return { helpId, errorId, describedBy: ids.length > 0 ? ids.join(" ") : undefined };
}

/** Help text and error message, each with the id that a control or a fieldset points to. */
function Messages({
  ids,
  help,
  error,
  className,
}: Readonly<{ ids: MessageIds; help: ReactNode; error: ReactNode; className?: string }>) {
  if (ids.helpId === undefined && ids.errorId === undefined) {
    return null;
  }
  return (
    <div className={cx("flex flex-col gap-1", className)}>
      {ids.helpId !== undefined && (
        <p id={ids.helpId} className="text-sm leading-body text-text-muted">
          {help}
        </p>
      )}
      {ids.errorId !== undefined && (
        // The icon repeats the meaning of the text: color is not the only cue (WCAG 1.4.1).
        <p
          id={ids.errorId}
          className="flex items-start gap-2 text-sm leading-body font-semibold text-danger-text"
        >
          <Icon icon={CircleAlert} size="sm" className="mt-1" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

/** A required field shows a visible marker in its label or legend, read as part of it. */
export type RequiredProps =
  | { readonly required?: false; readonly requiredLabel?: undefined }
  | {
      readonly required: true;
      /** Shown after the label, e.g. "(obligatoire)". */
      readonly requiredLabel: string;
    };

function RequiredMarker({ label }: Readonly<{ label: string | undefined }>) {
  if (label === undefined) {
    return null;
  }
  return (
    <>
      {/* A real space, so the marker is read as a separate word in the accessible name. */}{" "}
      <span className="font-regular text-text-muted">{label}</span>
    </>
  );
}

const LABEL_CLASSES = "text-md leading-snug font-semibold text-text";

/** What a `Field` gives its control: spread it on `Input`, `Textarea`, `Select` or `FileInput`. */
export interface FieldControlProps {
  readonly id: string;
  readonly "aria-describedby": string | undefined;
  readonly "aria-invalid": true | undefined;
  readonly required: true | undefined;
}

export type FieldProps = RequiredProps & {
  readonly label: ReactNode;
  /** Read after the label: expected format, constraints. */
  readonly help?: ReactNode;
  /** Present when the value is refused: marks the control invalid and describes why. */
  readonly error?: ReactNode;
  /** The control's id. Default: generated. */
  readonly id?: string;
  readonly className?: string;
  /** Renders the control with the wiring: `{(control) => <Input name="email" {...control} />}`. */
  readonly children: (control: FieldControlProps) => ReactNode;
};

/**
 * A labelled form field: label, then help and error (above the control, so they stay visible when
 * the control is zoomed or covered by an autocomplete list), then the control. The control gets
 * `aria-describedby` (help, error), `aria-invalid` while there is an error, and `required`.
 */
export function Field({
  label,
  help,
  error,
  id,
  required,
  requiredLabel,
  className,
  children,
}: FieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const ids = messageIds(controlId, help, error);
  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <label htmlFor={controlId} className={LABEL_CLASSES}>
        {label}
        <RequiredMarker label={requiredLabel} />
      </label>
      <Messages ids={ids} help={help} error={error} />
      {children({
        id: controlId,
        "aria-describedby": ids.describedBy,
        "aria-invalid": ids.errorId === undefined ? undefined : true,
        required: required === true ? true : undefined,
      })}
    </div>
  );
}

// Borders use `border-strong` (3:1 against the surface, WCAG 1.4.11); an invalid control turns red,
// next to its error message. Text inputs show the focus ring on every focus, as browsers do.
const CONTROL_CLASSES =
  "block w-full rounded-md border-thin border-border-strong bg-surface px-3 py-2 text-md leading-body text-text transition-colors duration-fast placeholder:text-text-muted focus-visible:focus-ring disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted aria-[invalid=true]:border-danger";

/** The text-like input types. Checkboxes, radios and files have their own components. */
export type InputType =
  | "text"
  | "email"
  | "tel"
  | "url"
  | "password"
  | "search"
  | "number"
  | "date"
  | "time"
  | "datetime-local";

export interface InputProps extends Omit<ComponentPropsWithoutRef<"input">, "type"> {
  /** Default `text`. */
  readonly type?: InputType;
}

/** A single-line text input. Use it inside a `Field`. */
export function Input({ type = "text", className, ...rest }: InputProps) {
  return <input type={type} className={cx(CONTROL_CLASSES, className)} {...rest} />;
}

export type TextareaProps = ComponentPropsWithoutRef<"textarea">;

/** A multi-line text input, resizable vertically. Use it inside a `Field`. */
export function Textarea({ rows = 4, className, ...rest }: TextareaProps) {
  return <textarea rows={rows} className={cx(CONTROL_CLASSES, "resize-y", className)} {...rest} />;
}

/** One choice only: several choices are clearer as checkboxes (`ChoiceCards` or a `Fieldset`). */
export type SelectProps = Omit<ComponentPropsWithoutRef<"select">, "multiple">;

/** A native drop-down list with the design system's chevron. Use it inside a `Field`. */
export function Select({ className, children, ...rest }: SelectProps) {
  return (
    <div className={cx("relative", className)}>
      <select className={cx(CONTROL_CLASSES, "cursor-pointer appearance-none pr-10")} {...rest}>
        {children}
      </select>
      <Icon
        icon={ChevronDown}
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-text-muted"
      />
    </div>
  );
}

export type FileInputProps = Omit<ComponentPropsWithoutRef<"input">, "type">;

/**
 * A native file input. The browser draws its button and the chosen file names, in the browser's
 * language. Say the accepted types and size in the field's help text.
 */
export function FileInput({ className, ...rest }: FileInputProps) {
  return (
    <input
      type="file"
      className={cx(
        "block w-full rounded-md text-md leading-body text-text focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-60",
        "file:mr-4 file:cursor-pointer file:rounded-md file:border-thin file:border-primary file:bg-surface file:px-4 file:py-2 file:font-semibold file:text-primary hover:file:bg-surface-muted",
        className,
      )}
      {...rest}
    />
  );
}

/**
 * Native checkbox and radio: the browser draws them (they stay visible in forced colors), tinted with
 * the primary color. `mt-1` centers the box on the first line of a `leading-body` label.
 */
export const CHECK_INPUT_CLASSES =
  "mt-1 size-5 shrink-0 cursor-pointer accent-primary disabled:cursor-not-allowed";

/** The label next to a native checkbox or radio, dimmed with its disabled input. */
export function checkLabelClasses(disabled: boolean | undefined): string {
  return cx(
    "text-md leading-body",
    disabled === true ? "cursor-not-allowed text-text-muted" : "cursor-pointer text-text",
  );
}

export type CheckboxProps = Omit<ComponentPropsWithoutRef<"input">, "type" | "children"> & {
  readonly label: ReactNode;
  readonly help?: ReactNode;
  readonly error?: ReactNode;
};

/**
 * A single checkbox with its label on the right (consent, opt-in, or one item of a `Fieldset`).
 * Help and error are wired like a `Field`'s.
 */
export function Checkbox({ label, help, error, id, disabled, className, ...rest }: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const ids = messageIds(inputId, help, error);
  return (
    <div className={cx("flex flex-col gap-1", className)}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id={inputId}
          disabled={disabled}
          aria-describedby={ids.describedBy}
          aria-invalid={ids.errorId === undefined ? undefined : true}
          className={cx(CHECK_INPUT_CLASSES, "focus-visible:focus-ring")}
          {...rest}
        />
        <label htmlFor={inputId} className={checkLabelClasses(disabled)}>
          {label}
        </label>
      </div>
      {/* Aligned with the label: checkbox width (size-5) + gap-3 = spacing 8. */}
      <Messages ids={ids} help={help} error={error} className="pl-8" />
    </div>
  );
}

export interface FieldsetProps extends Omit<ComponentPropsWithoutRef<"fieldset">, "children"> {
  /** The question the group answers; read when focus enters the group. */
  readonly legend: ReactNode;
  /**
   * Shown after the legend when an answer is required, e.g. "(obligatoire)". A group has no
   * required state of its own: the inputs carry `required` where HTML allows it.
   */
  readonly requiredLabel?: string | undefined;
  readonly help?: ReactNode;
  /** Present when the answer is refused; the group is described by it. */
  readonly error?: ReactNode;
  readonly children: ReactNode;
}

/**
 * A group of controls under one question (`fieldset` + `legend`), with help and error wired to the
 * group by `aria-describedby`. `aria-invalid` is not allowed on a group: the error message and the
 * controls' own states say it. Used by `RadioGroup` and `ChoiceCards`, and for groups of checkboxes.
 */
export function Fieldset({
  legend,
  requiredLabel,
  help,
  error,
  className,
  children,
  ...rest
}: FieldsetProps) {
  const baseId = useId();
  const ids = messageIds(baseId, help, error);
  return (
    <fieldset aria-describedby={ids.describedBy} className={className} {...rest}>
      <legend className={cx(LABEL_CLASSES, "mb-2")}>
        {legend}
        <RequiredMarker label={requiredLabel} />
      </legend>
      <div className="flex flex-col gap-3">
        <Messages ids={ids} help={help} error={error} />
        {children}
      </div>
    </fieldset>
  );
}
