import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DocumentList } from "../sections.tsx";

// Synthetic documents (CB-08): the files and their sizes are examples.
const meta = {
  title: "Sections/DocumentList",
  component: DocumentList,
  parameters: { layout: "fullscreen" },
  args: {
    eyebrow: "Transparence",
    title: "Documents officiels (exemple)",
    lead: "Texte d’exemple : les documents de l’association, à télécharger.",
    items: [
      {
        title: "Document d’exemple 1",
        href: "/documents/exemple-1.pdf",
        format: "PDF",
        size: "240 Ko",
        description: "Une phrase d’exemple sur ce document.",
        date: "Mis à jour le 3 février 2027",
      },
      {
        title: "Document d’exemple 2",
        href: "/documents/exemple-2.pdf",
        format: "PDF",
        size: "1,2 Mo",
      },
      {
        title: "Document d’exemple 3",
        href: "/documents/exemple-3.pdf",
        format: "PDF",
        description: "Une phrase d’exemple sur ce document.",
      },
    ],
  },
} satisfies Meta<typeof DocumentList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** Phone width. */
export const Mobile: Story = {
  globals: { viewport: { value: "mobile2", isRotated: false } },
  tags: ["visual-mobile"],
};
