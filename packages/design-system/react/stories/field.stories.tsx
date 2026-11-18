import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Field, FileInput, Input, Select, Textarea } from "../forms.tsx";

// `Field` wires its control (id, descriptions, invalid and required states) through a render prop.
// One story per control and per state; the controls have no stories of their own.
const meta = {
  title: "Forms/Field",
  component: Field,
  args: {
    label: "Adresse e-mail",
    className: "max-w-md",
    children: (control) => <Input type="email" name="email" autoComplete="email" {...control} />,
  },
  argTypes: {
    children: { control: false },
  },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextInput: Story = {};
export const WithHelp: Story = {
  args: { help: "Nous l’utilisons uniquement pour vous envoyer la confirmation." },
};
export const Required: Story = { args: { required: true, requiredLabel: "(obligatoire)" } };
/** Help, then the error, above the control; the control is `aria-invalid`. */
export const WithError: Story = {
  args: {
    help: "Exemple : prenom.nom@example.com",
    error: "Saisissez une adresse e-mail valide.",
    required: true,
    requiredLabel: "(obligatoire)",
  },
};
export const Placeholder: Story = {
  args: {
    label: "Rechercher une formation",
    children: (control) => (
      <Input type="search" name="q" placeholder="Ex. : accessibilité" {...control} />
    ),
  },
};
export const Disabled: Story = {
  args: {
    label: "Identifiant",
    help: "Attribué automatiquement.",
    children: (control) => (
      <Input name="identifiant" defaultValue="UW-2026-0042" disabled {...control} />
    ),
  },
};
export const TextareaControl: Story = {
  args: {
    label: "Votre message",
    help: "500 caractères au plus.",
    children: (control) => <Textarea name="message" maxLength={500} {...control} />,
  },
};
export const SelectControl: Story = {
  args: {
    label: "Session souhaitée",
    children: (control) => (
      <Select name="session" defaultValue="" {...control}>
        <option value="" disabled>
          Choisissez une session
        </option>
        <option value="mars">Mars 2027</option>
        <option value="juin">Juin 2027</option>
        <option value="septembre">Septembre 2027</option>
      </Select>
    ),
  },
};
export const SelectWithError: Story = {
  args: {
    ...SelectControl.args,
    required: true,
    requiredLabel: "(obligatoire)",
    error: "Choisissez une session.",
  },
};
/** The browser draws the button and the file names, in its own language. */
export const FileInputControl: Story = {
  args: {
    label: "Votre CV",
    help: "PDF, 2 Mo au plus.",
    children: (control) => <FileInput name="cv" accept="application/pdf" {...control} />,
  },
};
