import type { LucideIcon } from "lucide-react";
import { type ReactNode, useId } from "react";

import { cx } from "./cx.ts";
import { CHECK_INPUT_CLASSES, checkLabelClasses, Fieldset, type RequiredProps } from "./forms.tsx";
import { Icon } from "./icon.tsx";

// Choices among options (Task 2.2b): native radios and checkboxes inside a fieldset, so the keyboard
// works as everywhere else (Tab into the group, arrows between radios, Space to toggle) and the
// form posts them without JavaScript. Server Components.

export interface ChoiceOption {
  /** The submitted value. */
  readonly value: string;
  readonly label: ReactNode;
  /** Read after the label as the option's description. */
  readonly description?: ReactNode;
  readonly disabled?: boolean;
}

type GroupProps = RequiredProps & {
  /** The question; read when focus enters the group. */
  readonly legend: ReactNode;
  /** The inputs' `name`. */
  readonly name: string;
  readonly help?: ReactNode;
  /** Present when the answer is refused. */
  readonly error?: ReactNode;
  /** Disables every option. */
  readonly disabled?: boolean;
  readonly className?: string;
};

const RADIO_ORIENTATIONS = {
  vertical: "flex flex-col gap-3",
  horizontal: "flex flex-wrap gap-x-6 gap-y-3",
} as const;

export type RadioGroupProps = GroupProps & {
  readonly options: readonly ChoiceOption[];
  /** The value checked at first (uncontrolled). */
  readonly defaultValue?: string;
  /** Default `vertical`. `horizontal` suits two or three short options ("Oui" / "Non"). */
  readonly orientation?: keyof typeof RADIO_ORIENTATIONS;
};

/** One answer among a few options, all visible. With many options, use a `Select`. */
export function RadioGroup({
  legend,
  name,
  options,
  defaultValue,
  orientation = "vertical",
  required,
  requiredLabel,
  help,
  error,
  disabled,
  className,
}: RadioGroupProps) {
  const baseId = useId();
  return (
    <Fieldset
      legend={legend}
      requiredLabel={requiredLabel}
      help={help}
      error={error}
      disabled={disabled}
      className={className}
    >
      <div className={RADIO_ORIENTATIONS[orientation]}>
        {options.map((option, index) => {
          const inputId = `${baseId}-${index}`;
          const descriptionId = option.description === undefined ? undefined : `${inputId}-desc`;
          return (
            <div key={option.value} className="flex items-start gap-3">
              <input
                type="radio"
                id={inputId}
                name={name}
                value={option.value}
                defaultChecked={defaultValue === option.value}
                // One required radio makes the whole group required.
                required={required}
                disabled={option.disabled}
                aria-describedby={descriptionId}
                className={cx(CHECK_INPUT_CLASSES, "focus-visible:focus-ring")}
              />
              <div className="flex flex-col gap-1">
                <label
                  htmlFor={inputId}
                  className={checkLabelClasses(disabled === true || option.disabled === true)}
                >
                  {option.label}
                </label>
                {descriptionId !== undefined && (
                  <p id={descriptionId} className="text-sm leading-body text-text-muted">
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Fieldset>
  );
}

export interface ChoiceCardOption extends ChoiceOption {
  /** A decorative Lucide icon above the label. */
  readonly icon?: LucideIcon;
}

const CARD_COLUMNS = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
} as const;

// The whole card is the label, so a click anywhere toggles the input. The focus ring and the
// selected look follow the input inside (`has-*`); the native input stays visible as the indicator.
const CARD_CLASSES =
  "flex cursor-pointer items-start gap-3 rounded-lg border-medium border-border bg-surface p-4 transition-colors duration-fast hover:border-border-strong has-checked:border-primary has-checked:bg-surface-muted has-focus-visible:focus-ring has-disabled:cursor-not-allowed has-disabled:opacity-60";

export type ChoiceCardsProps = GroupProps & {
  readonly options: readonly ChoiceCardOption[];
  /** Default 2 from the `sm` breakpoint up (one column on phones). */
  readonly columns?: keyof typeof CARD_COLUMNS;
} & (
    | {
        /** One answer (radios). */
        readonly type: "radio";
        readonly defaultValue?: string;
      }
    | {
        /** Several answers (checkboxes). `required` cannot apply to a checkbox group in HTML. */
        readonly type: "checkbox";
        readonly defaultValue?: readonly string[];
      }
  );

/**
 * Options shown as selectable cards (format of a training, topics of interest). Each card's label
 * names its input, and its description describes it.
 */
export function ChoiceCards(props: ChoiceCardsProps) {
  const {
    legend,
    name,
    options,
    type,
    columns = 2,
    required,
    requiredLabel,
    help,
    error,
    disabled,
    className,
  } = props;
  const baseId = useId();
  const isChecked = (value: string): boolean =>
    props.type === "radio"
      ? props.defaultValue === value
      : (props.defaultValue?.includes(value) ?? false);
  return (
    <Fieldset
      legend={legend}
      requiredLabel={requiredLabel}
      help={help}
      error={error}
      disabled={disabled}
      className={className}
    >
      <div className={cx("grid gap-3", CARD_COLUMNS[columns])}>
        {options.map((option, index) => {
          const labelId = `${baseId}-${index}-label`;
          const descriptionId =
            option.description === undefined ? undefined : `${baseId}-${index}-desc`;
          return (
            <label key={option.value} className={CARD_CLASSES}>
              <input
                type={type}
                name={name}
                value={option.value}
                defaultChecked={isChecked(option.value)}
                required={type === "radio" ? required : undefined}
                disabled={option.disabled}
                // The label wraps the description too: name the input by its title only.
                aria-labelledby={labelId}
                aria-describedby={descriptionId}
                className={cx(CHECK_INPUT_CLASSES, "focus-visible:outline-hidden")}
              />
              <span className="flex flex-col gap-1">
                {option.icon !== undefined && (
                  <Icon icon={option.icon} size="lg" className="text-primary" />
                )}
                <span id={labelId} className="text-md leading-snug font-semibold text-text">
                  {option.label}
                </span>
                {descriptionId !== undefined && (
                  <span id={descriptionId} className="text-sm leading-body text-text-muted">
                    {option.description}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </Fieldset>
  );
}
