import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Breadcrumbs } from "../navigation.tsx";

const meta = {
  title: "Navigation/Breadcrumbs",
  component: Breadcrumbs,
  args: {
    label: "Fil d’Ariane",
    items: [
      { label: "Accueil", href: "/" },
      { label: "Formations", href: "/formations" },
    ],
    current: "Initiation au développement web",
  },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoLevels: Story = {};
export const OneLevel: Story = {
  args: { items: [{ label: "Accueil", href: "/" }], current: "Contact" },
};
/** Wraps on narrow screens. */
export const Deep: Story = {
  args: {
    items: [
      { label: "Accueil", href: "/" },
      { label: "Formations", href: "/formations" },
      { label: "Développement web", href: "/formations/web" },
      { label: "Sessions", href: "/formations/web/sessions" },
    ],
    current: "Session de mars 2027 à distance",
  },
};
