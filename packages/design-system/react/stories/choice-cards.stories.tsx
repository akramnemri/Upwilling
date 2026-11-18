import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Building2, Laptop, Users } from "lucide-react";

import { ChoiceCards } from "../choices.tsx";

const formats = [
  {
    value: "presentiel",
    label: "En présentiel",
    description: "Dans nos locaux, en petit groupe.",
    icon: Users,
  },
  {
    value: "distanciel",
    label: "À distance",
    description: "En visioconférence, avec le formateur.",
    icon: Laptop,
  },
  {
    value: "entreprise",
    label: "Dans votre entreprise",
    description: "Pour une équipe, sur devis.",
    icon: Building2,
  },
];

const meta = {
  title: "Forms/ChoiceCards",
  component: ChoiceCards,
  args: {
    legend: "Comment souhaitez-vous suivre la formation ?",
    name: "format",
    type: "radio",
    options: formats,
  },
  argTypes: {
    options: { control: false },
  },
} satisfies Meta<typeof ChoiceCards>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Radio: Story = {};
export const RadioWithDefault: Story = { args: { type: "radio", defaultValue: "distanciel" } };
export const ThreeColumns: Story = { args: { columns: 3 } };
export const OneColumn: Story = { args: { columns: 1 } };
export const Checkboxes: Story = {
  args: {
    legend: "Thèmes qui vous intéressent",
    name: "themes",
    type: "checkbox",
    defaultValue: ["web"],
    help: "Plusieurs choix possibles.",
    options: [
      { value: "web", label: "Développement web" },
      { value: "data", label: "Données", description: "Analyse et visualisation." },
      { value: "securite", label: "Cybersécurité" },
    ],
  },
};
export const RequiredWithError: Story = {
  args: {
    required: true,
    requiredLabel: "(obligatoire)",
    error: "Choisissez un format.",
  },
};
export const DisabledOption: Story = {
  args: {
    options: formats.map((option, index) => (index === 0 ? { ...option, disabled: true } : option)),
  },
};
