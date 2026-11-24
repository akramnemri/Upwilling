import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Testimonials } from "../sections.tsx";

// Fictional quotes and people, marked as such on screen: real testimonials need consent (AC-16).
const meta = {
  title: "Sections/Testimonials",
  component: Testimonials,
  parameters: { layout: "fullscreen" },
  args: {
    eyebrow: "Témoignages",
    title: "Ils en parlent (exemple)",
    items: [
      {
        quote: "Une citation d’exemple, d’une ou deux phrases, sur ce que la formation a changé.",
        name: "Prénom A.",
        role: "Rôle d’exemple",
      },
      {
        quote: "Une citation d’exemple, d’une ou deux phrases.",
        name: "Prénom B.",
        role: "Rôle d’exemple",
      },
      { quote: "Une citation d’exemple, plus courte.", name: "Prénom C." },
    ],
    note: "Témoignages fictifs, pour l’exemple.",
  },
} satisfies Meta<typeof Testimonials>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeQuotes: Story = {};
/** Phone width: one quote per row. */
export const Mobile: Story = {
  globals: { viewport: { value: "mobile2", isRotated: false } },
  tags: ["visual-mobile"],
};
