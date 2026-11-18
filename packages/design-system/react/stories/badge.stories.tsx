import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Badge } from "../content.tsx";
import { Stack } from "../layout.tsx";

const meta = {
  title: "Content/Badge",
  component: Badge,
  args: { children: "Débutant" },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};
export const Primary: Story = { args: { tone: "primary", children: "Nouveau" } };
export const Success: Story = { args: { tone: "success", children: "Places disponibles" } };
export const Warning: Story = { args: { tone: "warning", children: "Dernières places" } };
export const Danger: Story = { args: { tone: "danger", children: "Complet" } };
export const Info: Story = { args: { tone: "info", children: "En ligne" } };

export const AllTones: Story = {
  render: () => (
    <Stack direction="row" gap="2" wrap>
      <Badge>Débutant</Badge>
      <Badge tone="primary">Nouveau</Badge>
      <Badge tone="success">Places disponibles</Badge>
      <Badge tone="warning">Dernières places</Badge>
      <Badge tone="danger">Complet</Badge>
      <Badge tone="info">En ligne</Badge>
    </Stack>
  ),
};
