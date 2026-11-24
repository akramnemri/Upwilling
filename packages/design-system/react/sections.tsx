import { Check, type LucideIcon } from "lucide-react";
import { type ReactNode, useId } from "react";

import { Card, CardBody, CardFooter, CardHeader } from "./content.tsx";
import { cx } from "./cx.ts";
import { Icon } from "./icon.tsx";
import { Container, Section } from "./layout.tsx";
import { Eyebrow, Heading, Text } from "./typography.tsx";

// Section patterns, static part (Task 2.5a, 04_DESIGN_SYSTEM.md §1 and §4). Each one is a full-width
// `Section` labelled by its own title. They render on the server with no browser JavaScript, take
// every word from props (French copy lives in the CMS or the app, never here) and fetch nothing: the
// CMS blocks of Milestone 5 map onto these props.

/** The page band's background; text colors follow it (see `Section`). */
export type SectionBackground = "surface" | "muted" | "primary";

/** Props every section shares. */
export interface SectionPatternProps {
  /** The section's `id`, the target of an anchor link in the site header ("formations"). */
  readonly id?: string;
  /** Default depends on the section. */
  readonly background?: SectionBackground;
  readonly className?: string;
}

/** A section's opening: optional eyebrow, the title (h2), an optional lead paragraph. */
interface SectionIntroProps {
  readonly titleId: string;
  readonly eyebrow?: string | undefined;
  readonly title: ReactNode;
  readonly lead?: ReactNode;
  readonly background: SectionBackground;
  readonly align?: "start" | "center";
  readonly hideTitle?: boolean;
}

function SectionIntro({
  titleId,
  eyebrow,
  title,
  lead,
  background,
  align = "start",
  hideTitle = false,
}: Readonly<SectionIntroProps>) {
  // Muted and primary-colored text only pass contrast on light backgrounds (contrast pairs).
  const onPrimary = background === "primary";
  return (
    <div
      className={cx(
        "flex max-w-prose flex-col gap-3",
        align === "center" && "mx-auto items-center text-center",
        hideTitle && lead === undefined && eyebrow === undefined && "sr-only",
      )}
    >
      {eyebrow !== undefined && (
        <Eyebrow tone={onPrimary ? "inherit" : "primary"}>{eyebrow}</Eyebrow>
      )}
      <Heading level={2} id={titleId} className={cx(hideTitle && "sr-only")}>
        {title}
      </Heading>
      {lead !== undefined && (
        <Text size="lg" tone={onPrimary ? "inherit" : "muted"}>
          {lead}
        </Text>
      )}
    </div>
  );
}

/** A check-marked list of short points (hero trust bullets, track benefits). */
function CheckList({
  items,
  className,
}: Readonly<{ items: readonly string[]; className?: string }>) {
  return (
    <ul className={cx("flex flex-col gap-2", className)}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <Icon icon={Check} size="md" className="mt-1 text-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------------------------------
// Hero

export interface HeroProps extends SectionPatternProps {
  /** Above the title, usually an `AnnouncementPill`. */
  readonly announcement?: ReactNode;
  /** The page's main title (the only h1): a short promise, on two lines at most. */
  readonly title: ReactNode;
  readonly lead: ReactNode;
  /** One or two calls to action (`ButtonLink`s: primary first, then secondary). */
  readonly actions?: ReactNode;
  /** Up to three short trust points under the actions. */
  readonly highlights?: readonly string[];
  /** The illustration on the right from `lg`, under the text on smaller screens (`HeroPanel`). */
  readonly visual?: ReactNode;
}

/** The page opening: announcement, promise, lead, calls to action, trust points and a visual. */
export function Hero({
  id,
  background = "surface",
  className,
  announcement,
  title,
  lead,
  actions,
  highlights = [],
  visual,
}: HeroProps) {
  const titleId = useId();
  return (
    <Section
      id={id}
      spacing="lg"
      background={background}
      aria-labelledby={titleId}
      className={className}
    >
      <Container
        className={cx("grid items-center gap-gap-lg", visual !== undefined && "lg:grid-cols-2")}
      >
        <div className="flex flex-col items-start gap-6">
          {announcement}
          <Heading level={1} id={titleId} size="5xl">
            {title}
          </Heading>
          <Text
            size="lg"
            tone={background === "primary" ? "inherit" : "muted"}
            className="max-w-prose"
          >
            {lead}
          </Text>
          {actions !== undefined && <div className="flex flex-wrap gap-3">{actions}</div>}
          {highlights.length > 0 && (
            <CheckList
              items={highlights}
              className="text-sm font-semibold sm:flex-row sm:flex-wrap sm:gap-x-6"
            />
          )}
        </div>
        {visual}
      </Container>
    </Section>
  );
}

export interface HeroPanelCard {
  readonly icon?: LucideIcon;
  readonly title: string;
  readonly detail?: string;
}

export interface HeroPanelProps {
  /** What the illustration shows, read by screen readers instead of its parts. */
  readonly label: string;
  /** The window title of the panel ("atelier-linux — session 3"). */
  readonly windowTitle: string;
  /** Lines of the panel, in a monospace font (a terminal, a board's console). */
  readonly lines: readonly string[];
  /** Up to two status cards floating over the panel's corners. */
  readonly cards?: readonly HeroPanelCard[];
  readonly className?: string;
}

/**
 * Our own hero illustration, drawn in HTML and CSS with tokens: a console panel with floating status
 * cards ("Session inter · 8 places"). It is one image for assistive technology (`label`), so its
 * parts are not read one by one. Below `lg` the panel sits lower, so the top card stays clear of its
 * window title.
 */
export function HeroPanel({ label, windowTitle, lines, cards = [], className }: HeroPanelProps) {
  const [first, second] = cards;
  return (
    <div
      role="img"
      aria-label={label}
      className={cx("relative px-4 pb-12 pt-16 lg:pt-10", className)}
    >
      <div
        aria-hidden="true"
        className="overflow-hidden rounded-xl border-thin border-border bg-text text-text-inverse shadow-lg"
      >
        <div className="flex items-center gap-2 border-b-thin border-text-muted px-4 py-3">
          <span className="size-3 rounded-full bg-danger" />
          <span className="size-3 rounded-full bg-warning" />
          <span className="size-3 rounded-full bg-success" />
          <span className="ms-2 truncate font-mono text-xs">{windowTitle}</span>
        </div>
        <div className="flex flex-col gap-2 p-6 font-mono text-sm leading-snug">
          {/* Lines can repeat and never reorder: the position is a stable key. */}
          {lines.map((line, index) => (
            <p key={`${index}-${line}`} className="break-words">
              {line}
            </p>
          ))}
        </div>
      </div>
      {first !== undefined && <FloatingCard card={first} className="end-0 top-0" />}
      {second !== undefined && <FloatingCard card={second} className="bottom-0 start-0" />}
    </div>
  );
}

function FloatingCard({ card, className }: Readonly<{ card: HeroPanelCard; className: string }>) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        "absolute flex items-center gap-3 rounded-lg border-thin border-border bg-surface-raised px-4 py-3 text-text shadow-md",
        className,
      )}
    >
      {card.icon !== undefined && (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-contrast">
          <Icon icon={card.icon} size="sm" />
        </span>
      )}
      <span className="flex flex-col">
        <span className="text-sm font-semibold leading-tight">{card.title}</span>
        {card.detail !== undefined && (
          <span className="text-xs leading-tight text-text-muted">{card.detail}</span>
        )}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------
// Stats band

export interface StatItem {
  /** The figure as it should read ("1 200", "94 %"). */
  readonly value: string;
  readonly label: string;
}

export interface StatsBandProps extends SectionPatternProps {
  /** Names the section; hidden visually with `hideTitle`, still read by screen readers. */
  readonly title: string;
  readonly hideTitle?: boolean;
  /** Two to four figures. */
  readonly items: readonly StatItem[];
  /** A short line under the figures: source, date, or "Chiffres d'exemple" for placeholders. */
  readonly note?: string | undefined;
}

/** A band of key figures. Default background `primary`. */
export function StatsBand({
  id,
  background = "primary",
  className,
  title,
  hideTitle = false,
  items,
  note,
}: StatsBandProps) {
  const titleId = useId();
  const columns = items.length >= 4 ? "lg:grid-cols-4" : items.length === 3 ? "md:grid-cols-3" : "";
  return (
    <Section
      id={id}
      spacing="sm"
      background={background}
      aria-labelledby={titleId}
      className={className}
    >
      <Container className="flex flex-col gap-8">
        <SectionIntro
          titleId={titleId}
          title={title}
          background={background}
          hideTitle={hideTitle}
        />
        <dl className={cx("grid grid-cols-2 gap-gap-md", columns)}>
          {items.map((item) => (
            <div key={item.label} className="flex flex-col-reverse gap-1">
              <dt className="text-sm font-semibold">{item.label}</dt>
              <dd className="font-display text-4xl font-bold leading-tight">{item.value}</dd>
            </div>
          ))}
        </dl>
        {note !== undefined && (
          <Text size="sm" tone={background === "primary" ? "inherit" : "muted"}>
            {note}
          </Text>
        )}
      </Container>
    </Section>
  );
}

// ---------------------------------------------------------------------------------------------------
// Pain points

export interface PainPoint {
  readonly icon?: LucideIcon;
  readonly title: string;
  readonly text: string;
}

export interface PainPointsProps extends SectionPatternProps {
  readonly eyebrow?: string | undefined;
  readonly title: ReactNode;
  readonly lead?: ReactNode;
  /** Usually four: the situations the visitor recognizes. */
  readonly items: readonly PainPoint[];
}

/** "Ça vous parle ?": the visitor's problems, as cards, before the offer. Default background `muted`. */
export function PainPoints({
  id,
  background = "muted",
  className,
  eyebrow,
  title,
  lead,
  items,
}: PainPointsProps) {
  const titleId = useId();
  return (
    <Section id={id} background={background} aria-labelledby={titleId} className={className}>
      <Container className="flex flex-col gap-gap-lg">
        <SectionIntro
          titleId={titleId}
          eyebrow={eyebrow}
          title={title}
          lead={lead}
          background={background}
        />
        <ul
          className={cx(
            "grid gap-gap-md sm:grid-cols-2",
            items.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
          )}
        >
          {items.map((item) => (
            <Card as="li" key={item.title} className="p-6">
              <div className="flex flex-col gap-3">
                {item.icon !== undefined && (
                  <span className="flex size-10 items-center justify-center rounded-md bg-surface-muted text-primary">
                    <Icon icon={item.icon} size="lg" />
                  </span>
                )}
                <Heading level={3} size="lg">
                  {item.title}
                </Heading>
                <Text tone="muted">{item.text}</Text>
              </div>
            </Card>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

// ---------------------------------------------------------------------------------------------------
// Audience tracks

export interface AudienceTrack {
  /** A short label above the title ("En ligne", "En présentiel"). */
  readonly label?: string;
  readonly title: string;
  readonly text: string;
  /** What this track brings, as short points. */
  readonly points: readonly string[];
  /** A small illustration at the top of the card (optional). */
  readonly visual?: ReactNode;
  /** A link or button at the bottom of the card. */
  readonly action?: ReactNode;
}

export interface AudienceTracksProps extends SectionPatternProps {
  readonly eyebrow?: string | undefined;
  readonly title: ReactNode;
  readonly lead?: ReactNode;
  /** Two tracks side by side from `md` (three also fit). */
  readonly tracks: readonly AudienceTrack[];
}

/** Two audiences or formats side by side, so each visitor finds their own. */
export function AudienceTracks({
  id,
  background = "surface",
  className,
  eyebrow,
  title,
  lead,
  tracks,
}: AudienceTracksProps) {
  const titleId = useId();
  return (
    <Section id={id} background={background} aria-labelledby={titleId} className={className}>
      <Container className="flex flex-col gap-gap-lg">
        <SectionIntro
          titleId={titleId}
          eyebrow={eyebrow}
          title={title}
          lead={lead}
          background={background}
        />
        <ul
          className={cx("grid gap-gap-md md:grid-cols-2", tracks.length >= 3 && "lg:grid-cols-3")}
        >
          {tracks.map((track) => (
            <Card as="li" key={track.title}>
              {track.visual !== undefined && (
                <div className="border-b-thin border-border bg-surface-muted p-6">
                  {track.visual}
                </div>
              )}
              <CardHeader>
                {track.label !== undefined && <Eyebrow as="span">{track.label}</Eyebrow>}
                <Heading level={3} size="2xl">
                  {track.title}
                </Heading>
              </CardHeader>
              <CardBody className="flex flex-col gap-4">
                <Text tone="muted">{track.text}</Text>
                <CheckList items={track.points} />
              </CardBody>
              {track.action !== undefined && <CardFooter>{track.action}</CardFooter>}
            </Card>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

// ---------------------------------------------------------------------------------------------------
// Feature bento

export interface Feature {
  readonly icon?: LucideIcon;
  readonly title: string;
  readonly text: string;
  /** A small illustration under the text (chips, a mini card…). */
  readonly visual?: ReactNode;
  /** `wide` spans two columns from `lg`. Default `regular`. */
  readonly size?: "regular" | "wide";
}

export interface FeatureBentoProps extends SectionPatternProps {
  readonly eyebrow?: string | undefined;
  readonly title: ReactNode;
  readonly lead?: ReactNode;
  readonly items: readonly Feature[];
}

/**
 * "Pourquoi nous": concrete benefits in a grid of tiles of two widths, three columns from `lg`. Put
 * wide tiles so that each row adds up to three columns.
 */
export function FeatureBento({
  id,
  background = "surface",
  className,
  eyebrow,
  title,
  lead,
  items,
}: FeatureBentoProps) {
  const titleId = useId();
  return (
    <Section id={id} background={background} aria-labelledby={titleId} className={className}>
      <Container className="flex flex-col gap-gap-lg">
        <SectionIntro
          titleId={titleId}
          eyebrow={eyebrow}
          title={title}
          lead={lead}
          background={background}
        />
        <ul className="grid gap-gap-md md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card
              as="li"
              key={item.title}
              className={cx("p-6", item.size === "wide" && "md:col-span-2")}
            >
              <div className="flex h-full flex-col gap-4">
                <div className="flex items-center gap-3">
                  {item.icon !== undefined && (
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-contrast">
                      <Icon icon={item.icon} size="lg" />
                    </span>
                  )}
                  <Heading level={3} size="xl">
                    {item.title}
                  </Heading>
                </div>
                <Text tone="muted">{item.text}</Text>
                {item.visual !== undefined && <div className="mt-auto pt-2">{item.visual}</div>}
              </div>
            </Card>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

// ---------------------------------------------------------------------------------------------------
// Process steps

export interface ProcessStep {
  readonly title: string;
  readonly text: string;
  /** What the visitor gets at the end of this step ("Proposition écrite sous 48 h"). */
  readonly deliverable?: string;
}

export interface ProcessStepsProps extends SectionPatternProps {
  readonly eyebrow?: string | undefined;
  readonly title: ReactNode;
  readonly lead?: ReactNode;
  /** Three to five steps, in order. */
  readonly steps: readonly ProcessStep[];
  /**
   * Words before each deliverable, punctuation included ("Livrable :"), so its meaning does not rely
   * on the layout. Needed as soon as one step has a deliverable.
   */
  readonly deliverableLabel?: string | undefined;
}

/** How it works, step by step: a numbered list, in a row from `lg`. Default background `muted`. */
export function ProcessSteps({
  id,
  background = "muted",
  className,
  eyebrow,
  title,
  lead,
  steps,
  deliverableLabel,
}: ProcessStepsProps) {
  const titleId = useId();
  const columns =
    steps.length >= 5 ? "lg:grid-cols-5" : steps.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3";
  return (
    <Section id={id} background={background} aria-labelledby={titleId} className={className}>
      <Container className="flex flex-col gap-gap-lg">
        <SectionIntro
          titleId={titleId}
          eyebrow={eyebrow}
          title={title}
          lead={lead}
          background={background}
        />
        <ol className={cx("grid gap-gap-md", columns)}>
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-4 lg:flex-col">
              {/* The list is ordered for assistive technology; the number is for the eye. */}
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-primary-contrast"
              >
                {index + 1}
              </span>
              <div className="flex flex-col gap-2">
                <Heading level={3} size="lg">
                  {step.title}
                </Heading>
                <Text tone="muted">{step.text}</Text>
                {step.deliverable !== undefined && (
                  <Text size="sm">
                    {deliverableLabel !== undefined && (
                      <span className="font-semibold">{deliverableLabel} </span>
                    )}
                    {step.deliverable}
                  </Text>
                )}
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
