import { Check, FileText, type LucideIcon, Quote } from "lucide-react";
import { type ReactNode, useId } from "react";

import { Anchor } from "./actions.tsx";
import { Badge, Card, CardBody, CardFooter, CardHeader, CardMedia, Chip } from "./content.tsx";
import { cx } from "./cx.ts";
import { Accordion, Tabs } from "./disclosure.tsx";
import { Icon } from "./icon.tsx";
import { Container, Section } from "./layout.tsx";
import { Eyebrow, Heading, Text } from "./typography.tsx";

// Section patterns (Tasks 2.5a–2.5c, 04_DESIGN_SYSTEM.md §1 and §4). Each one is a full-width
// `Section` labelled by its own title. They render on the server, take every word from props (French
// copy lives in the CMS or the app, never here) and fetch nothing: the CMS blocks of Milestone 5 map
// onto these props. Only `CatalogueGrid`'s tabs (Radix) run in the browser; `LogoStrip` moves with
// CSS alone (css/base.css).

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

// ---------------------------------------------------------------------------------------------------
// Logo strip

export interface LogoStripItem {
  readonly label: string;
  /** A decorative Lucide icon before the label. Brand logos need a license first (assets/LICENSES.md). */
  readonly icon?: LucideIcon;
}

export interface LogoStripProps extends SectionPatternProps {
  /** Names the section; hidden visually with `hideTitle`. */
  readonly title: string;
  readonly hideTitle?: boolean;
  /** Technologies or partners, as text chips. */
  readonly items: readonly LogoStripItem[];
  /** Label of the checkbox that stops the scrolling ("Mettre en pause le défilement"). */
  readonly pauseLabel: string;
}

/**
 * A strip of technologies that scrolls sideways, with CSS only (`css/base.css`, `[data-marquee]`).
 * It stops on hover, on keyboard focus and with its own pause checkbox (WCAG 2.2.2: moving content
 * can be stopped). Under reduced motion it does not move: one list that wraps onto several lines,
 * and no pause control. The second copy of the list, needed for a seamless loop, is hidden from
 * assistive technology and shown only while the strip moves.
 */
export function LogoStrip({
  id,
  background = "surface",
  className,
  title,
  hideTitle = false,
  items,
  pauseLabel,
}: LogoStripProps) {
  const titleId = useId();
  const list = (copy: boolean) => (
    <ul
      {...(copy ? { "aria-hidden": true, "data-marquee-copy": "" } : {})}
      className="flex flex-wrap items-center justify-center gap-4 pe-4"
    >
      {items.map((item) => (
        <li
          key={item.label}
          className="inline-flex items-center gap-2 rounded-full border-thin border-border bg-surface-raised px-4 py-2 font-semibold leading-tight text-text whitespace-nowrap"
        >
          {item.icon !== undefined && <Icon icon={item.icon} size="md" className="text-primary" />}
          {item.label}
        </li>
      ))}
    </ul>
  );
  return (
    <Section
      id={id}
      spacing="sm"
      background={background}
      aria-labelledby={titleId}
      className={className}
    >
      <Container data-marquee="" className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionIntro
            titleId={titleId}
            title={title}
            background={background}
            hideTitle={hideTitle}
          />
          <label
            data-marquee-pause=""
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border-thin border-border-strong bg-surface px-3 py-1 text-sm text-text has-focus-visible:focus-ring"
          >
            <input type="checkbox" className="size-4 accent-primary" />
            {pauseLabel}
          </label>
        </div>
        <div data-marquee-viewport="">
          <div data-marquee-track="" className="flex">
            {list(false)}
            {list(true)}
          </div>
        </div>
      </Container>
    </Section>
  );
}

// ---------------------------------------------------------------------------------------------------
// Catalogue grid

export interface CatalogueItem {
  readonly title: string;
  /** The training's page. The title is the link. */
  readonly href: string;
  readonly summary?: string;
  /** A level or status label ("Débutant", "Complet"), shown as a badge. */
  readonly badge?: string;
  /** Short facts: format, duration, number of projects ("3 jours", "Présentiel"). */
  readonly facts?: readonly string[];
  /** Technologies covered, as chips. */
  readonly chips?: readonly string[];
  /** The price as it should read ("1 200 € HT", "Sur devis"). */
  readonly price?: string;
}

export interface CatalogueCategory {
  /** Short id-like key (letters, digits, hyphens), used by the tabs. */
  readonly value: string;
  readonly label: string;
  readonly items: readonly CatalogueItem[];
}

export interface CatalogueGridProps extends SectionPatternProps {
  readonly eyebrow?: string | undefined;
  readonly title: ReactNode;
  readonly lead?: ReactNode;
  /** Names the tab list ("Domaines de formation"). */
  readonly tabsLabel: string;
  /** One tab per category; with a single category, no tabs. An "all" category is up to the caller. */
  readonly categories: readonly CatalogueCategory[];
}

/** The catalogue: category tabs over a grid of training cards (AC-01, AC-02). */
export function CatalogueGrid({
  id,
  background = "surface",
  className,
  eyebrow,
  title,
  lead,
  tabsLabel,
  categories,
}: CatalogueGridProps) {
  const titleId = useId();
  const grid = (items: readonly CatalogueItem[]) => (
    <ul className="grid gap-gap-md md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card as="li" key={item.href}>
          <CardHeader>
            {item.badge !== undefined && <Badge>{item.badge}</Badge>}
            <Heading level={3} size="xl">
              <Anchor
                href={item.href}
                className="rounded-sm hover:text-primary hover:underline hover:underline-offset-4 focus-visible:focus-ring"
              >
                {item.title}
              </Anchor>
            </Heading>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            {item.summary !== undefined && <Text tone="muted">{item.summary}</Text>}
            {item.chips !== undefined && item.chips.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {item.chips.map((chip) => (
                  <li key={chip}>
                    <Chip>{chip}</Chip>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
          {(item.facts !== undefined || item.price !== undefined) && (
            <CardFooter className="justify-between border-t-thin border-border pt-4">
              {item.facts !== undefined && (
                <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-text-muted">
                  {item.facts.map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>
              )}
              {item.price !== undefined && (
                <Text as="span" weight="bold">
                  {item.price}
                </Text>
              )}
            </CardFooter>
          )}
        </Card>
      ))}
    </ul>
  );
  const [only] = categories;
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
        {categories.length === 1 && only !== undefined ? (
          grid(only.items)
        ) : (
          <Tabs
            label={tabsLabel}
            items={categories.map((category) => ({
              value: category.value,
              label: category.label,
              content: grid(category.items),
            }))}
          />
        )}
      </Container>
    </Section>
  );
}

// ---------------------------------------------------------------------------------------------------
// Pricing tiers

export interface PricingTier {
  readonly name: string;
  /** The price as it should read ("490 €", "Sur devis", "30 €"). */
  readonly price: string;
  /** After the price ("par personne", "par an"). */
  readonly period?: string;
  readonly description?: string;
  readonly features: readonly string[];
  /** A `ButtonLink`: primary on the highlighted tier, secondary on the others. */
  readonly action?: ReactNode;
  /** The recommended tier: framed with the primary color, with `highlightLabel` above its name. */
  readonly highlighted?: boolean;
}

export interface PricingTiersProps extends SectionPatternProps {
  readonly eyebrow?: string | undefined;
  readonly title: ReactNode;
  readonly lead?: ReactNode;
  /** Two to four tiers, one highlighted at most. */
  readonly tiers: readonly PricingTier[];
  /** The words that mark the highlighted tier ("Le plus choisi"), so it is not color alone. */
  readonly highlightLabel?: string | undefined;
  /** Under the tiers: taxes, conditions, or "Tarifs d’exemple". */
  readonly note?: string | undefined;
}

/** Formats or membership tiers side by side, one of them highlighted. Default background `muted`. */
export function PricingTiers({
  id,
  background = "muted",
  className,
  eyebrow,
  title,
  lead,
  tiers,
  highlightLabel,
  note,
}: PricingTiersProps) {
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
            "grid items-stretch gap-gap-md md:grid-cols-2",
            tiers.length >= 4 ? "lg:grid-cols-4" : tiers.length === 3 && "lg:grid-cols-3",
          )}
        >
          {tiers.map((tier) => (
            <li
              key={tier.name}
              className={cx(
                "flex flex-col gap-6 rounded-lg bg-surface-raised p-6 text-text",
                tier.highlighted === true
                  ? "border-medium border-primary shadow-md"
                  : "border-thin border-border shadow-sm",
              )}
            >
              <div className="flex flex-col items-start gap-2">
                {tier.highlighted === true && highlightLabel !== undefined && (
                  <Badge tone="primary">{highlightLabel}</Badge>
                )}
                <Heading level={3} size="xl">
                  {tier.name}
                </Heading>
                {tier.description !== undefined && <Text tone="muted">{tier.description}</Text>}
              </div>
              <p className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-display text-4xl font-bold leading-tight">{tier.price}</span>
                {tier.period !== undefined && (
                  <span className="text-sm text-text-muted">{tier.period}</span>
                )}
              </p>
              <CheckList items={tier.features} className="flex-1" />
              {tier.action !== undefined && <div className="flex">{tier.action}</div>}
            </li>
          ))}
        </ul>
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
// FAQ accordion

export interface FaqItem {
  readonly question: string;
  readonly answer: ReactNode;
}

export interface FaqAccordionProps extends SectionPatternProps {
  readonly eyebrow?: string | undefined;
  readonly title: ReactNode;
  readonly lead?: ReactNode;
  readonly items: readonly FaqItem[];
  /** Opening a question closes the others. Default false. */
  readonly exclusive?: boolean;
}

/**
 * Questions and answers (native `<details>`, see `Accordion`): every answer is in the HTML, open or
 * not. Title on the left and questions on the right from `lg`.
 */
export function FaqAccordion({
  id,
  background = "surface",
  className,
  eyebrow,
  title,
  lead,
  items,
  exclusive = false,
}: FaqAccordionProps) {
  const titleId = useId();
  return (
    <Section id={id} background={background} aria-labelledby={titleId} className={className}>
      <Container className="grid gap-gap-lg lg:grid-cols-3">
        <SectionIntro
          titleId={titleId}
          eyebrow={eyebrow}
          title={title}
          lead={lead}
          background={background}
        />
        <Accordion
          className="lg:col-span-2"
          exclusive={exclusive}
          items={items.map((item, index) => ({
            value: `q${index}`,
            title: item.question,
            content: item.answer,
          }))}
        />
      </Container>
    </Section>
  );
}

// ---------------------------------------------------------------------------------------------------
// Testimonials

export interface Testimonial {
  readonly quote: string;
  /** Who said it, as they agreed to be named ("Prénom N."). */
  readonly name: string;
  /** Their role or context ("Stagiaire, session de mars"). */
  readonly role?: string;
}

export interface TestimonialsProps extends SectionPatternProps {
  readonly eyebrow?: string | undefined;
  readonly title: ReactNode;
  readonly lead?: ReactNode;
  readonly items: readonly Testimonial[];
  /** Under the quotes: source, consent, or "Témoignages fictifs" for placeholders. */
  readonly note?: string | undefined;
}

/** Quotes from learners or members (AC-16), as figures with their author. */
export function Testimonials({
  id,
  background = "surface",
  className,
  eyebrow,
  title,
  lead,
  items,
  note,
}: TestimonialsProps) {
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
            <li key={`${item.name}-${item.quote}`}>
              <figure className="flex h-full flex-col gap-4 rounded-lg border-thin border-border bg-surface-raised p-6 text-text shadow-sm">
                <Icon icon={Quote} size="lg" className="text-primary" />
                <blockquote className="flex-1 text-lg leading-body">
                  <p>{item.quote}</p>
                </blockquote>
                <figcaption className="flex flex-col">
                  <span className="font-semibold">{item.name}</span>
                  {item.role !== undefined && (
                    <span className="text-sm text-text-muted">{item.role}</span>
                  )}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
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
// Contact call to action

export interface ContactStep {
  readonly title: string;
  readonly text: string;
}

export interface ContactCtaProps extends SectionPatternProps {
  readonly eyebrow?: string | undefined;
  readonly title: ReactNode;
  readonly lead?: ReactNode;
  /** Names the list of steps ("Et ensuite ?"). */
  readonly stepsTitle: string;
  /** What happens after the visitor writes, in order (three is usual). */
  readonly steps: readonly ContactStep[];
  /**
   * The form, built by the app with the form components (`Field`, `ChoiceCards`…) and its own action:
   * this section only lays it out.
   */
  readonly form: ReactNode;
}

/**
 * Low-friction contact: on the left the title and "what happens next" as numbered steps, on the
 * right the short form in a raised panel (one column on phones, form last). Default background
 * `muted`.
 */
export function ContactCta({
  id,
  background = "muted",
  className,
  eyebrow,
  title,
  lead,
  stepsTitle,
  steps,
  form,
}: ContactCtaProps) {
  const titleId = useId();
  const stepsId = useId();
  const onPrimary = background === "primary";
  return (
    <Section id={id} background={background} aria-labelledby={titleId} className={className}>
      <Container className="grid gap-gap-lg lg:grid-cols-2">
        <div className="flex flex-col gap-8">
          <SectionIntro
            titleId={titleId}
            eyebrow={eyebrow}
            title={title}
            lead={lead}
            background={background}
          />
          <div className="flex flex-col gap-4">
            <Heading level={3} size="lg" id={stepsId}>
              {stepsTitle}
            </Heading>
            <ol aria-labelledby={stepsId} className="flex flex-col gap-4">
              {steps.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  {/* The list is ordered for assistive technology; the number is for the eye. */}
                  <span
                    aria-hidden="true"
                    className={cx(
                      "flex size-8 shrink-0 items-center justify-center rounded-full font-display font-bold",
                      onPrimary ? "bg-surface text-primary" : "bg-primary text-primary-contrast",
                    )}
                  >
                    {index + 1}
                  </span>
                  <div className="flex flex-col gap-1">
                    <Text weight="semibold">{step.title}</Text>
                    <Text tone={onPrimary ? "inherit" : "muted"}>{step.text}</Text>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="rounded-lg border-thin border-border bg-surface-raised p-6 text-text shadow-md">
          {form}
        </div>
      </Container>
    </Section>
  );
}

// ---------------------------------------------------------------------------------------------------
// News grid

export interface NewsItem {
  readonly title: string;
  /** The article's page. The title is the link. */
  readonly href: string;
  /** The date as it reads ("12 mars 2027"). */
  readonly date: string;
  /** The same date, machine-readable for `<time>` ("2027-03-12"). */
  readonly dateTime: string;
  readonly excerpt?: string;
  /** A category label ("Événement"), shown as a badge. */
  readonly tag?: string;
  /** An image with its own size and alt text (often `alt=""`: the title says it all). */
  readonly media?: ReactNode;
}

export interface NewsGridProps extends SectionPatternProps {
  readonly eyebrow?: string | undefined;
  readonly title: ReactNode;
  readonly lead?: ReactNode;
  readonly items: readonly NewsItem[];
  /** A link to all news, under the grid ("Toutes les actualités"). */
  readonly action?: ReactNode;
}

/** The latest news as cards (CB-05, AC-14): date, optional tag and image, title as the link. */
export function NewsGrid({
  id,
  background = "surface",
  className,
  eyebrow,
  title,
  lead,
  items,
  action,
}: NewsGridProps) {
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
            <Card as="li" key={item.href}>
              {item.media !== undefined && <CardMedia>{item.media}</CardMedia>}
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  {item.tag !== undefined && <Badge tone="info">{item.tag}</Badge>}
                  <Text as="span" size="sm" tone="muted">
                    <time dateTime={item.dateTime}>{item.date}</time>
                  </Text>
                </div>
                <Heading level={3} size="xl">
                  <Anchor
                    href={item.href}
                    className="rounded-sm hover:text-primary hover:underline hover:underline-offset-4 focus-visible:focus-ring"
                  >
                    {item.title}
                  </Anchor>
                </Heading>
              </CardHeader>
              {item.excerpt !== undefined && (
                <CardBody>
                  <Text tone="muted">{item.excerpt}</Text>
                </CardBody>
              )}
            </Card>
          ))}
        </ul>
        {action !== undefined && <div className="flex">{action}</div>}
      </Container>
    </Section>
  );
}

// ---------------------------------------------------------------------------------------------------
// Document list

export interface DocumentItem {
  readonly title: string;
  /** The file's address. */
  readonly href: string;
  /** The file format as it reads ("PDF"). Announced with the link, so nobody downloads by surprise. */
  readonly format: string;
  /** The file size as it reads ("240 Ko"). */
  readonly size?: string;
  readonly description?: string;
  /** The document's date as it reads ("Mis à jour le 3 février 2027"). */
  readonly date?: string;
}

export interface DocumentListProps extends SectionPatternProps {
  readonly eyebrow?: string | undefined;
  readonly title: ReactNode;
  readonly lead?: ReactNode;
  readonly items: readonly DocumentItem[];
}

/**
 * Official documents to download (CB-08): one row per file, its title as the link, then format and
 * size, which are part of the link's name ("Statuts (PDF, 240 Ko)").
 */
export function DocumentList({
  id,
  background = "surface",
  className,
  eyebrow,
  title,
  lead,
  items,
}: DocumentListProps) {
  const titleId = useId();
  return (
    <Section id={id} background={background} aria-labelledby={titleId} className={className}>
      <Container width="lg" className="flex flex-col gap-gap-lg">
        <SectionIntro
          titleId={titleId}
          eyebrow={eyebrow}
          title={title}
          lead={lead}
          background={background}
        />
        <ul className="flex flex-col rounded-lg border-thin border-border bg-surface-raised text-text">
          {items.map((item) => {
            const details = item.size === undefined ? item.format : `${item.format}, ${item.size}`;
            return (
              <li
                key={item.href}
                className="flex items-start gap-4 border-t-thin border-border p-4 first:border-t-0 sm:p-6"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-muted text-primary">
                  <Icon icon={FileText} size="lg" />
                </span>
                <div className="flex flex-col gap-1">
                  <Anchor
                    href={item.href}
                    className="rounded-sm font-semibold text-primary underline underline-offset-4 hover:text-primary-hover focus-visible:focus-ring"
                  >
                    {item.title}
                    {/* A real space keeps the details a separate phrase in the accessible name. */}{" "}
                    <span className="text-sm font-regular whitespace-nowrap text-text-muted">
                      ({details})
                    </span>
                  </Anchor>
                  {item.description !== undefined && <Text tone="muted">{item.description}</Text>}
                  {item.date !== undefined && (
                    <Text size="sm" tone="muted">
                      {item.date}
                    </Text>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}

// ---------------------------------------------------------------------------------------------------
// Rich text section

export interface RichTextSectionProps extends SectionPatternProps {
  readonly eyebrow?: string | undefined;
  readonly title: ReactNode;
  /**
   * The text as HTML elements (paragraphs, h3, lists, links, blockquote), e.g. the CMS's rich text
   * rendered by the app. Styled by `css/base.css` (`[data-rich-text]`), at reading width.
   */
  readonly children: ReactNode;
}

/** A titled block of running text (about, mission, legal notice) at a comfortable reading width. */
export function RichTextSection({
  id,
  background = "surface",
  className,
  eyebrow,
  title,
  children,
}: RichTextSectionProps) {
  const titleId = useId();
  return (
    <Section id={id} background={background} aria-labelledby={titleId} className={className}>
      <Container width="prose" className="flex flex-col gap-6">
        <SectionIntro titleId={titleId} eyebrow={eyebrow} title={title} background={background} />
        <div data-rich-text="">{children}</div>
      </Container>
    </Section>
  );
}
