// React components of the design system (Tasks 2.2a, 2.2b). Brand-agnostic: they use semantic token
// classes only, and every visible or announced text comes from props (French copy lives in the
// application). Server Components, except `SubmitButton` (`"use client"`).

export {
  Button,
  ButtonLink,
  type ButtonLinkProps,
  type ButtonProps,
  type ButtonSize,
  type ButtonVariant,
  isInternalHref,
  Link,
  type LinkProps,
  type NewTabProps,
} from "./actions.tsx";
export {
  AnnouncementPill,
  type AnnouncementPillProps,
  Badge,
  type BadgeProps,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardMedia,
  type CardProps,
  Chip,
  type ChipProps,
} from "./content.tsx";
export {
  type ChoiceCardOption,
  ChoiceCards,
  type ChoiceCardsProps,
  type ChoiceOption,
  RadioGroup,
  type RadioGroupProps,
} from "./choices.tsx";
export { cx } from "./cx.ts";
export {
  Alert,
  type AlertProps,
  type AlertTone,
  EmptyState,
  type EmptyStateProps,
  Skeleton,
  type SkeletonProps,
  Spinner,
  type SpinnerProps,
} from "./feedback.tsx";
export {
  Checkbox,
  type CheckboxProps,
  Field,
  type FieldControlProps,
  type FieldProps,
  FileInput,
  type FileInputProps,
  Fieldset,
  type FieldsetProps,
  Input,
  type InputProps,
  type InputType,
  type RequiredProps,
  Select,
  type SelectProps,
  Textarea,
  type TextareaProps,
} from "./forms.tsx";
export { Icon, type IconProps, type IconSize } from "./icon.tsx";
export {
  Container,
  type ContainerProps,
  type Gap,
  Grid,
  type GridProps,
  Section,
  type SectionProps,
  Stack,
  type StackProps,
} from "./layout.tsx";
export {
  Eyebrow,
  type EyebrowProps,
  Heading,
  type HeadingProps,
  type HeadingSize,
  Text,
  type TextProps,
} from "./typography.tsx";
export { SubmitButton, type SubmitButtonProps } from "./submit-button.tsx";
