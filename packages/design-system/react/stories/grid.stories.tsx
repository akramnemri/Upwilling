import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Card, CardBody } from "../content.tsx";
import { Grid } from "../layout.tsx";
import { Text } from "../typography.tsx";

function cells(count: number) {
  return Array.from({ length: count }, (_, index) => (
    <Card key={index} as="div">
      <CardBody>
        <Text>Carte {index + 1}</Text>
      </CardBody>
    </Card>
  ));
}

const meta = {
  title: "Layout/Grid",
  component: Grid,
  args: { columns: 3, children: cells(6) },
} satisfies Meta<typeof Grid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeColumns: Story = {};
export const OneColumn: Story = { args: { columns: 1, children: cells(2) } };
export const TwoColumns: Story = { args: { columns: 2, children: cells(4) } };
export const FourColumns: Story = { args: { columns: 4, children: cells(8) } };
export const SmallGap: Story = { args: { gap: "sm" } };
