import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Badge } from "../content.tsx";
import { Stack } from "../layout.tsx";

const items = ["Débutant", "Intermédiaire", "Avancé", "Expert", "Certifiant"].map((label) => (
  <Badge key={label}>{label}</Badge>
));

const meta = {
  title: "Layout/Stack",
  component: Stack,
  args: { children: items },
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Column: Story = { args: { align: "start" } };
export const Row: Story = { args: { direction: "row", gap: "2" } };
export const RowWrapped: Story = {
  args: { direction: "row", gap: "2", wrap: true, className: "max-w-md" },
};
export const RowBetween: Story = {
  args: { direction: "row", justify: "between", align: "center" },
};
export const FluidGap: Story = { args: { direction: "row", gap: "lg" } };
