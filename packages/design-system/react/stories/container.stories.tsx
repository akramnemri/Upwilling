import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Container } from "../layout.tsx";
import { Text } from "../typography.tsx";

const meta = {
  title: "Layout/Container",
  component: Container,
  parameters: { layout: "fullscreen" },
  args: {
    width: "xl",
    children: (
      <Text className="bg-surface-muted p-4">
        Contenu centré à la largeur du conteneur, avec la marge de page de chaque côté.
      </Text>
    ),
  },
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ExtraLarge: Story = {};
export const Large: Story = { args: { width: "lg" } };
export const Medium: Story = { args: { width: "md" } };
export const Prose: Story = { args: { width: "prose" } };
