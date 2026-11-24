import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FaqAccordion } from "../sections.tsx";

const ANSWER = "Une réponse d’exemple, en une ou deux phrases. Le contenu réel viendra du CMS.";

const meta = {
  title: "Sections/FaqAccordion",
  component: FaqAccordion,
  parameters: { layout: "fullscreen" },
  args: {
    eyebrow: "Questions fréquentes",
    title: "Vos questions, en exemple",
    lead: "Texte d’exemple : les réponses aux questions les plus courantes.",
    items: [
      { question: "Question d’exemple 1 ?", answer: ANSWER },
      { question: "Question d’exemple 2 ?", answer: ANSWER },
      { question: "Question d’exemple 3 ?", answer: ANSWER },
      { question: "Question d’exemple 4 ?", answer: ANSWER },
    ],
  },
} satisfies Meta<typeof FaqAccordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** One answer open at a time, on a muted band. */
export const ExclusiveMuted: Story = { args: { background: "muted", exclusive: true } };
/** Phone width: the title above the questions. */
export const Mobile: Story = {
  globals: { viewport: { value: "mobile2", isRotated: false } },
  tags: ["visual-mobile"],
};
