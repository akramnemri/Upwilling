import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProcessSteps } from "../sections.tsx";

const TEXT = "Ce qui se passe pendant cette étape.";

const meta = {
  title: "Sections/ProcessSteps",
  component: ProcessSteps,
  parameters: { layout: "fullscreen" },
  args: {
    eyebrow: "Comment ça marche",
    title: "Les étapes d’exemple, dans l’ordre",
    deliverableLabel: "Livrable :",
    steps: [
      { title: "Étape d’exemple 1", text: TEXT, deliverable: "Livrable d’exemple" },
      { title: "Étape d’exemple 2", text: TEXT, deliverable: "Livrable d’exemple" },
      { title: "Étape d’exemple 3", text: TEXT, deliverable: "Livrable d’exemple" },
      { title: "Étape d’exemple 4", text: TEXT, deliverable: "Livrable d’exemple" },
    ],
  },
} satisfies Meta<typeof ProcessSteps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FourSteps: Story = {};
/** Three steps, no deliverables, on a white band. */
export const ThreeStepsPlain: Story = {
  args: {
    background: "surface",
    deliverableLabel: undefined,
    steps: [
      { title: "Étape d’exemple 1", text: TEXT },
      { title: "Étape d’exemple 2", text: TEXT },
      { title: "Étape d’exemple 3", text: TEXT },
    ],
  },
};
/** Phone width: the steps stack, number beside the text. */
export const Mobile: Story = {
  globals: { viewport: { value: "mobile2", isRotated: false } },
  tags: ["visual-mobile"],
};
