import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ButtonLink } from "../actions.tsx";
import { NewsGrid } from "../sections.tsx";

// Synthetic news: titles and dates are examples (CB-05).
const meta = {
  title: "Sections/NewsGrid",
  component: NewsGrid,
  parameters: { layout: "fullscreen" },
  args: {
    eyebrow: "Actualités",
    title: "Les dernières nouvelles (exemple)",
    items: [
      {
        title: "Actualité d’exemple 1",
        href: "/actualites/exemple-1",
        date: "12 mars 2027",
        dateTime: "2027-03-12",
        tag: "Événement",
        excerpt: "Deux lignes d’exemple qui résument l’actualité.",
      },
      {
        title: "Actualité d’exemple 2",
        href: "/actualites/exemple-2",
        date: "28 février 2027",
        dateTime: "2027-02-28",
        excerpt: "Deux lignes d’exemple qui résument l’actualité.",
      },
      {
        title: "Actualité d’exemple 3",
        href: "/actualites/exemple-3",
        date: "3 février 2027",
        dateTime: "2027-02-03",
        tag: "Vie de l’association",
        excerpt: "Deux lignes d’exemple qui résument l’actualité.",
      },
    ],
    action: (
      <ButtonLink href="/actualites" variant="secondary">
        Toutes les actualités
      </ButtonLink>
    ),
  },
} satisfies Meta<typeof NewsGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeItems: Story = {};
/** Phone width: one card per row. */
export const Mobile: Story = {
  globals: { viewport: { value: "mobile2", isRotated: false } },
  tags: ["visual-mobile"],
};
