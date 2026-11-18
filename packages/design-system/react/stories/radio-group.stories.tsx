import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RadioGroup } from "../choices.tsx";

const meta = {
  title: "Forms/RadioGroup",
  component: RadioGroup,
  args: {
    legend: "Format de la formation",
    name: "format",
    options: [
      { value: "presentiel", label: "En présentiel", description: "À Paris, en petit groupe." },
      { value: "distanciel", label: "À distance", description: "En visioconférence." },
      { value: "mixte", label: "Mixte" },
    ],
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vertical: Story = {};
export const WithDefaultValue: Story = { args: { defaultValue: "distanciel" } };
export const Horizontal: Story = {
  args: {
    legend: "Êtes-vous déjà adhérent ?",
    name: "adherent",
    orientation: "horizontal",
    options: [
      { value: "oui", label: "Oui" },
      { value: "non", label: "Non" },
    ],
  },
};
export const RequiredWithError: Story = {
  args: {
    required: true,
    requiredLabel: "(obligatoire)",
    help: "Vous pourrez changer plus tard.",
    error: "Choisissez un format.",
  },
};
export const DisabledOption: Story = {
  args: {
    options: [
      { value: "presentiel", label: "En présentiel", description: "Complet.", disabled: true },
      { value: "distanciel", label: "À distance" },
    ],
  },
};
export const DisabledGroup: Story = { args: { disabled: true, defaultValue: "presentiel" } };
