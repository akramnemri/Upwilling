import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ButtonLink } from "../actions.tsx";
import { Chip } from "../content.tsx";
import { AudienceTracks } from "../sections.tsx";

const POINTS = ["Premier avantage d’exemple", "Deuxième avantage", "Troisième avantage"];

const meta = {
  title: "Sections/AudienceTracks",
  component: AudienceTracks,
  parameters: { layout: "fullscreen" },
  args: {
    eyebrow: "Deux parcours",
    title: "Choisissez le format qui vous correspond",
    lead: "Texte d’exemple : chaque visiteur se reconnaît dans l’un des deux parcours.",
    tracks: [
      {
        label: "En ligne",
        title: "Parcours d’exemple A",
        text: "Une phrase d’exemple qui présente ce parcours.",
        points: POINTS,
        visual: (
          <div className="flex flex-wrap gap-2">
            <Chip>Thème 1</Chip>
            <Chip>Thème 2</Chip>
          </div>
        ),
        action: (
          <ButtonLink href="#parcours-a" variant="secondary">
            Découvrir le parcours A
          </ButtonLink>
        ),
      },
      {
        label: "En présentiel",
        title: "Parcours d’exemple B",
        text: "Une phrase d’exemple qui présente ce parcours.",
        points: POINTS,
        visual: (
          <div className="flex flex-wrap gap-2">
            <Chip>Thème 3</Chip>
            <Chip>Thème 4</Chip>
          </div>
        ),
        action: (
          <ButtonLink href="#parcours-b" variant="secondary">
            Découvrir le parcours B
          </ButtonLink>
        ),
      },
    ],
  },
} satisfies Meta<typeof AudienceTracks>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoTracks: Story = {};
/** Phone width: the tracks stack. */
export const Mobile: Story = {
  globals: { viewport: { value: "mobile2", isRotated: false } },
  tags: ["visual-mobile"],
};
