import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Stack } from "../layout.tsx";
import { Heading } from "../typography.tsx";

const meta = {
  title: "Typography/Heading",
  component: Heading,
  args: { level: 2, children: "Des formations pour progresser" },
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Level2: Story = {};
export const Primary: Story = { args: { tone: "primary" } };
/** The level follows the page outline; the size is chosen separately. */
export const LevelIsNotSize: Story = { args: { level: 3, size: "4xl" } };

export const AllLevels: Story = {
  render: () => (
    <Stack gap="4">
      <Heading level={1}>Titre de niveau 1</Heading>
      <Heading level={2}>Titre de niveau 2</Heading>
      <Heading level={3}>Titre de niveau 3</Heading>
      <Heading level={4}>Titre de niveau 4</Heading>
      <Heading level={5}>Titre de niveau 5</Heading>
      <Heading level={6}>Titre de niveau 6</Heading>
    </Stack>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <Stack gap="4">
      {(["5xl", "4xl", "3xl", "2xl", "xl", "lg", "md"] as const).map((size) => (
        <Heading key={size} level={2} size={size}>
          Taille {size}
        </Heading>
      ))}
    </Stack>
  ),
};
