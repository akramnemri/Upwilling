import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StatsBand } from "../sections.tsx";

// Placeholder figures, marked as such on screen: real figures need a source (PO).
const meta = {
  title: "Sections/StatsBand",
  component: StatsBand,
  parameters: { layout: "fullscreen" },
  args: {
    title: "Quelques chiffres",
    items: [
      { value: "120", label: "Chiffre d’exemple A" },
      { value: "35", label: "Chiffre d’exemple B" },
      { value: "12", label: "Chiffre d’exemple C" },
      { value: "4", label: "Chiffre d’exemple D" },
    ],
    note: "Chiffres d’exemple, sans valeur réelle.",
  },
} satisfies Meta<typeof StatsBand>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OnPrimary: Story = {};
/** Title hidden visually (still read by screen readers), on a muted band, three figures. */
export const MutedHiddenTitle: Story = {
  args: {
    background: "muted",
    hideTitle: true,
    items: [
      { value: "120", label: "Chiffre d’exemple A" },
      { value: "35", label: "Chiffre d’exemple B" },
      { value: "12", label: "Chiffre d’exemple C" },
    ],
  },
};
/** Phone width: two figures per row. */
export const Mobile: Story = {
  globals: { viewport: { value: "mobile2", isRotated: false } },
  tags: ["visual-mobile"],
};
