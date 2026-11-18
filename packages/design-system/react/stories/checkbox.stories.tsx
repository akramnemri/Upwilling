import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Checkbox } from "../forms.tsx";

const meta = {
  title: "Forms/Checkbox",
  component: Checkbox,
  args: { label: "Recevoir la lettre d’information", name: "lettre" },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};
export const Checked: Story = { args: { defaultChecked: true } };
export const WithHelp: Story = {
  args: { help: "Un message par mois, désinscription en un clic." },
};
export const WithError: Story = {
  args: {
    label: "J’accepte les conditions générales de vente",
    name: "cgv",
    required: true,
    error: "Vous devez accepter les conditions pour continuer.",
  },
};
export const Disabled: Story = { args: { disabled: true } };
export const DisabledChecked: Story = { args: { disabled: true, defaultChecked: true } };
