import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { type CatalogueItem, CatalogueGrid } from "../sections.tsx";

// Synthetic trainings: titles, prices and durations are examples (the catalogue comes from AC-01).
const ITEMS: readonly CatalogueItem[] = [
  {
    title: "Formation d’exemple 1",
    href: "/formations/exemple-1",
    summary: "Deux lignes d’exemple qui résument ce que la formation apporte.",
    badge: "Débutant",
    chips: ["Thème A", "Thème B"],
    facts: ["3 jours", "Présentiel"],
    price: "Prix d’exemple",
  },
  {
    title: "Formation d’exemple 2",
    href: "/formations/exemple-2",
    summary: "Deux lignes d’exemple qui résument ce que la formation apporte.",
    badge: "Intermédiaire",
    chips: ["Thème C"],
    facts: ["5 jours", "En ligne"],
    price: "Sur devis",
  },
  {
    title: "Formation d’exemple 3",
    href: "/formations/exemple-3",
    summary: "Deux lignes d’exemple qui résument ce que la formation apporte.",
    badge: "Avancé",
    chips: ["Thème A", "Thème D", "Thème E"],
    facts: ["2 jours", "Intra-entreprise"],
    price: "Prix d’exemple",
  },
];

const meta = {
  title: "Sections/CatalogueGrid",
  component: CatalogueGrid,
  parameters: { layout: "fullscreen" },
  args: {
    eyebrow: "Catalogue",
    title: "Des formations d’exemple",
    lead: "Texte d’exemple : choisissez un domaine pour filtrer les formations.",
    tabsLabel: "Domaines de formation",
    categories: [
      { value: "toutes", label: "Toutes", items: ITEMS },
      { value: "domaine-a", label: "Domaine A", items: ITEMS.slice(0, 2) },
      { value: "domaine-b", label: "Domaine B", items: ITEMS.slice(2) },
    ],
  },
} satisfies Meta<typeof CatalogueGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithTabs: Story = {};
/** One category: the grid without tabs, on a muted band. */
export const SingleCategory: Story = {
  args: {
    background: "muted",
    lead: undefined,
    categories: [{ value: "toutes", label: "Toutes", items: ITEMS }],
  },
};
/** Phone width: tabs wrap, one card per row. */
export const Mobile: Story = {
  globals: { viewport: { value: "mobile2", isRotated: false } },
  tags: ["visual-mobile"],
};
