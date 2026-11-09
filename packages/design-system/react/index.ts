// React components of the design system (Task 2.2a). Brand-agnostic: they use semantic token classes
// only, and every visible or announced text comes from props (French copy lives in the application).

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
export { cx } from "./cx.ts";
export { Skeleton, type SkeletonProps, Spinner, type SpinnerProps } from "./feedback.tsx";
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
