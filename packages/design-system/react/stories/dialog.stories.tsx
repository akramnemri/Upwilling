import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "../actions.tsx";
import { Dialog } from "../dialog.tsx";
import { Field, Input } from "../forms.tsx";
import { Text } from "../typography.tsx";

const meta = {
  title: "Disclosure/Dialog",
  component: Dialog,
  args: {
    triggerLabel: "Voir les conditions",
    title: "Conditions d’inscription",
    closeLabel: "Fermer",
    children: (
      <Text>
        L’inscription est confirmée à réception du paiement. Vous pouvez annuler sans frais jusqu’à
        quatorze jours avant la session.
      </Text>
    ),
  },
  argTypes: {
    children: { control: false },
    footer: { control: false },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

const closeFooter = (
  <form method="dialog">
    <Button type="submit">J’ai compris</Button>
  </form>
);

const descriptionAndFooter = {
  description: "À lire avant de valider votre demande.",
  footer: closeFooter,
};

export const WithDescriptionAndFooter: Story = { args: descriptionAndFooter };

export const WithForm: Story = {
  args: {
    triggerLabel: "Être rappelé",
    triggerVariant: "primary",
    title: "Être rappelé",
    description: "Exemple fictif : rien n’est envoyé.",
    children: (
      <Field label="Numéro de téléphone">
        {(control) => <Input type="tel" name="telephone" autoComplete="tel" {...control} />}
      </Field>
    ),
    footer: closeFooter,
  },
};

/**
 * Opens on load (play function clicks the trigger): top layer, inert page, focus on the close
 * button. Escape or the close button closes it. Docs pages render stories inline, so open it from
 * the story's own canvas.
 */
export const Open: Story = {
  args: descriptionAndFooter,
  tags: ["!autodocs"],
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Voir les conditions" }));
  },
};
