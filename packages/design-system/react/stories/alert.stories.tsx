import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Alert } from "../feedback.tsx";
import { Stack } from "../layout.tsx";

const meta = {
  title: "Feedback/Alert",
  component: Alert,
  args: {
    title: "Inscriptions ouvertes",
    children: "Les sessions de mars acceptent des inscriptions jusqu’au 15 février.",
    className: "max-w-prose",
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {};
export const Success: Story = {
  args: { tone: "success", title: "Demande envoyée", children: "Nous vous répondons sous 48 h." },
};
export const Warning: Story = {
  args: {
    tone: "warning",
    title: "Dernières places",
    children: "Il reste deux places dans cette session.",
  },
};
/** An error summary: the title is a heading. */
export const DangerWithHeading: Story = {
  args: {
    tone: "danger",
    title: "Le formulaire contient deux erreurs",
    titleLevel: 2,
    children: "Corrigez les champs signalés, puis envoyez de nouveau.",
  },
};
export const WithoutTitle: Story = {
  args: { title: undefined, children: "Les informations sont enregistrées automatiquement." },
};

export const AllTones: Story = {
  render: () => (
    <Stack gap="4" className="max-w-prose">
      <Alert tone="info" title="Information">
        Un message d’information.
      </Alert>
      <Alert tone="success" title="Succès">
        Un message de confirmation.
      </Alert>
      <Alert tone="warning" title="Attention">
        Un message d’avertissement.
      </Alert>
      <Alert tone="danger" title="Erreur">
        Un message d’erreur.
      </Alert>
    </Stack>
  ),
};
