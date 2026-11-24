import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CalendarCheck, CircleCheck } from "lucide-react";

import { ButtonLink } from "../actions.tsx";
import { AnnouncementPill } from "../content.tsx";
import { Hero, HeroPanel } from "../sections.tsx";

// Synthetic copy: the real promise and figures come from the CMS (Milestone 5).
const meta = {
  title: "Sections/Hero",
  component: Hero,
  parameters: { layout: "fullscreen" },
  args: {
    announcement: (
      <AnnouncementPill tag="Nouveau" href="#sessions">
        Session d’exemple ouverte aux inscriptions
      </AnnouncementPill>
    ),
    title: "Une promesse d’exemple, écrite sur deux lignes",
    lead: "Un paragraphe d’exemple qui explique l’offre en une ou deux phrases. Le texte réel viendra du CMS.",
    actions: (
      <>
        <ButtonLink href="#contact">Action principale</ButtonLink>
        <ButtonLink href="#offre" variant="secondary">
          Action secondaire
        </ButtonLink>
      </>
    ),
    highlights: ["Premier point de confiance", "Deuxième point", "Troisième point"],
    visual: (
      <HeroPanel
        label="Illustration d’exemple : une console avec deux cartes de statut"
        windowTitle="atelier-exemple — module 3"
        lines={["$ make build", "Compilation de l’exemple… ok", "$ ./lancer --carte demo", "Prêt."]}
        cards={[
          { icon: CalendarCheck, title: "Session d’exemple", detail: "8 places (fictif)" },
          { icon: CircleCheck, title: "Module 3 terminé", detail: "Progression fictive" },
        ]}
      />
    ),
  },
} satisfies Meta<typeof Hero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** Text only: no illustration, no trust points. */
export const WithoutVisual: Story = { args: { visual: undefined, highlights: [] } };
/** On the brand color. */
export const OnPrimary: Story = {
  args: {
    background: "primary",
    visual: undefined,
    announcement: undefined,
    actions: (
      <ButtonLink href="#contact" variant="secondary">
        Action principale
      </ButtonLink>
    ),
    highlights: [],
  },
};
/** Phone width: the illustration moves under the text. */
export const Mobile: Story = {
  globals: { viewport: { value: "mobile2", isRotated: false } },
  tags: ["visual-mobile"],
};
