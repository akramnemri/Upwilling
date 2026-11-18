import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Stack } from "../layout.tsx";
import { Text } from "../typography.tsx";

const meta = {
  title: "Typography/Text",
  component: Text,
  args: {
    children:
      "Nos sessions réunissent de petits groupes, pour que chacun puisse poser ses questions et pratiquer.",
  },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Muted: Story = { args: { tone: "muted" } };
export const Primary: Story = { args: { tone: "primary" } };
export const Semibold: Story = { args: { weight: "semibold" } };
export const Bold: Story = { args: { weight: "bold" } };

export const AllSizes: Story = {
  render: () => (
    <Stack gap="3">
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Text key={size} size={size}>
          Texte de taille {size}
        </Text>
      ))}
    </Stack>
  ),
};
