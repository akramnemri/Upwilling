import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Checkbox, Fieldset } from "../forms.tsx";

const checkboxes = (
  <>
    <Checkbox name="themes" value="web" label="Développement web" />
    <Checkbox name="themes" value="data" label="Données" />
    <Checkbox name="themes" value="securite" label="Cybersécurité" />
  </>
);

const meta = {
  title: "Forms/Fieldset",
  component: Fieldset,
  args: { legend: "Thèmes qui vous intéressent", children: checkboxes },
  argTypes: {
    children: { control: false },
  },
} satisfies Meta<typeof Fieldset>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CheckboxGroup: Story = {};
export const WithHelp: Story = { args: { help: "Plusieurs choix possibles." } };
export const WithError: Story = {
  args: {
    requiredLabel: "(obligatoire)",
    help: "Plusieurs choix possibles.",
    error: "Choisissez au moins un thème.",
  },
};
export const Disabled: Story = { args: { disabled: true } };
