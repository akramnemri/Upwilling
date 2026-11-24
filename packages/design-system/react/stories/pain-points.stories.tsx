import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Clock, Compass, MessageCircleQuestion, Puzzle } from "lucide-react";

import { PainPoints } from "../sections.tsx";

const TEXT = "Une ou deux phrases qui décrivent le problème.";

const meta = {
  title: "Sections/PainPoints",
  component: PainPoints,
  parameters: { layout: "fullscreen" },
  args: {
    eyebrow: "Ça vous parle ?",
    title: "Des situations d’exemple que le visiteur reconnaît",
    lead: "Une phrase d’introduction d’exemple, avant de présenter l’offre.",
    items: [
      { icon: Compass, title: "Situation d’exemple 1", text: TEXT },
      { icon: Clock, title: "Situation d’exemple 2", text: TEXT },
      { icon: Puzzle, title: "Situation d’exemple 3", text: TEXT },
      { icon: MessageCircleQuestion, title: "Situation d’exemple 4", text: TEXT },
    ],
  },
} satisfies Meta<typeof PainPoints>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FourItems: Story = {};
/** Three items without icons, on a white band. */
export const ThreeItemsPlain: Story = {
  args: {
    background: "surface",
    eyebrow: undefined,
    lead: undefined,
    items: [
      { title: "Situation d’exemple 1", text: TEXT },
      { title: "Situation d’exemple 2", text: TEXT },
      { title: "Situation d’exemple 3", text: TEXT },
    ],
  },
};
