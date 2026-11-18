import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Container, Section } from "../layout.tsx";
import { Eyebrow, Heading, Text } from "../typography.tsx";

const meta = {
  title: "Layout/Section",
  component: Section,
  parameters: { layout: "fullscreen" },
  args: {
    spacing: "md",
    background: "surface",
    children: (
      <Container>
        <Eyebrow tone="inherit">Nos formations</Eyebrow>
        <Heading level={2}>Apprendre à son rythme</Heading>
        <Text>Une bande pleine largeur de la page, avec son rythme vertical et son fond.</Text>
      </Container>
    ),
  },
} satisfies Meta<typeof Section>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Surface: Story = {};
export const Muted: Story = { args: { background: "muted" } };
export const Primary: Story = { args: { background: "primary" } };
export const SpacingSmall: Story = { args: { spacing: "sm", background: "muted" } };
export const SpacingLarge: Story = { args: { spacing: "lg", background: "muted" } };
