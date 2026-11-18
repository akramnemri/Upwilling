import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Spinner } from "../feedback.tsx";
import { Stack } from "../layout.tsx";

const meta = {
  title: "Feedback/Spinner",
  component: Spinner,
  args: { label: "Chargement des formations" },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A status region that announces its label. Stops rotating under reduced motion. */
export const Labelled: Story = {};
/** Inside a control that already says it is busy. */
export const Decorative: Story = { args: { decorative: true, label: undefined } };

export const Sizes: Story = {
  render: () => (
    <Stack direction="row" gap="4" align="center" className="text-primary">
      <Spinner size="sm" label="Chargement" />
      <Spinner size="md" label="Chargement" />
      <Spinner size="lg" label="Chargement" />
    </Stack>
  ),
};
