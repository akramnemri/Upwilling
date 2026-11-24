import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FlaskConical, GraduationCap, LifeBuoy, Users } from "lucide-react";

import { Badge, Chip } from "../content.tsx";
import { FeatureBento } from "../sections.tsx";

const meta = {
  title: "Sections/FeatureBento",
  component: FeatureBento,
  parameters: { layout: "fullscreen" },
  args: {
    eyebrow: "Pourquoi nous",
    title: "Des avantages concrets, en exemple",
    items: [
      {
        icon: Users,
        title: "Avantage d’exemple 1",
        text: "Une phrase qui montre un bénéfice concret plutôt qu’un adjectif.",
        size: "wide",
        visual: (
          <div className="flex flex-wrap gap-2">
            <Chip>Compétence A</Chip>
            <Chip>Compétence B</Chip>
            <Chip>Compétence C</Chip>
          </div>
        ),
      },
      {
        icon: FlaskConical,
        title: "Avantage d’exemple 2",
        text: "Une phrase qui montre un bénéfice concret.",
      },
      {
        icon: GraduationCap,
        title: "Avantage d’exemple 3",
        text: "Une phrase qui montre un bénéfice concret.",
        visual: <Badge tone="success">Statut d’exemple</Badge>,
      },
      {
        icon: LifeBuoy,
        title: "Avantage d’exemple 4",
        text: "Une phrase qui montre un bénéfice concret, sur une tuile large.",
        size: "wide",
      },
    ],
  },
} satisfies Meta<typeof FeatureBento>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** Phone width: one tile per row. */
export const Mobile: Story = {
  globals: { viewport: { value: "mobile2", isRotated: false } },
  tags: ["visual-mobile"],
};
