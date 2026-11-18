import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Send } from "lucide-react";

import { Field, Input } from "../forms.tsx";
import { Stack } from "../layout.tsx";
import { SubmitButton } from "../submit-button.tsx";

const SIMULATED_DELAY_MS = 3000;

// The pending state comes from the enclosing `<form action={…}>` (useFormStatus). A function action
// runs in the browser: this one only waits, so submitting shows the pending state for three seconds
// without sending anything.
async function simulateSubmission(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));
}

const meta = {
  title: "Forms/SubmitButton",
  component: SubmitButton,
  args: { pendingLabel: "Envoi en cours", children: "Envoyer la demande" },
  argTypes: {
    icon: { control: false },
  },
  decorators: [
    (Story) => (
      <form action={simulateSubmission}>
        <Stack gap="4" align="start">
          <Field label="Votre prénom" help="Exemple fictif : rien n’est envoyé.">
            {(control) => <Input name="prenom" autoComplete="given-name" {...control} />}
          </Field>
          <Story />
        </Stack>
      </form>
    ),
  ],
} satisfies Meta<typeof SubmitButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Submit the form to see the pending state: spinner, `aria-disabled`, announcement, focus kept. */
export const Idle: Story = {};
export const WithIcon: Story = { args: { icon: Send } };
export const Secondary: Story = { args: { variant: "secondary" } };
/** Submits the form on load (play function): the pending state lasts three seconds. */
export const Pending: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Envoyer la demande" }));
  },
};
