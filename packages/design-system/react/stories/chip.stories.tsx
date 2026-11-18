import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Code, ShieldCheck } from "lucide-react";

import { Chip } from "../content.tsx";
import { Stack } from "../layout.tsx";

const meta = {
  title: "Content/Chip",
  component: Chip,
  args: { children: "React" },
  argTypes: {
    icon: { control: false },
  },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithIcon: Story = { args: { icon: Code, children: "TypeScript" } };

export const Group: Story = {
  render: () => (
    <Stack direction="row" gap="2" wrap>
      <Chip icon={Code}>TypeScript</Chip>
      <Chip>React</Chip>
      <Chip icon={ShieldCheck}>Cybersécurité</Chip>
      <Chip>Accessibilité</Chip>
    </Stack>
  ),
};
