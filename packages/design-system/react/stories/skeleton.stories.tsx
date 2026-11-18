import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Card, CardBody, CardHeader } from "../content.tsx";
import { Skeleton } from "../feedback.tsx";
import { Stack } from "../layout.tsx";

const meta = {
  title: "Feedback/Skeleton",
  component: Skeleton,
  args: { className: "max-w-md" },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Line: Story = {};
/** The last line is shorter. */
export const SeveralLines: Story = { args: { lines: 3 } };
export const Title: Story = { args: { shape: "title" } };
export const Avatar: Story = { args: { shape: "avatar" } };
export const Block: Story = { args: { shape: "block" } };

/** The loading region says it is busy (`aria-busy`); the shapes are hidden from assistive technology. */
export const LoadingCard: Story = {
  render: () => (
    <Card aria-busy="true" className="max-w-md">
      <CardHeader>
        <Stack direction="row" gap="3" align="center" className="w-full">
          <Skeleton shape="avatar" className="w-auto" />
          <Skeleton shape="title" />
        </Stack>
      </CardHeader>
      <CardBody>
        <Skeleton lines={3} />
      </CardBody>
    </Card>
  ),
};
