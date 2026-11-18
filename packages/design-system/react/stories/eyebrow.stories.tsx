import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Section } from "../layout.tsx";
import { Eyebrow, Heading } from "../typography.tsx";

const meta = {
  title: "Typography/Eyebrow",
  component: Eyebrow,
  args: { children: "Nouvelle session" },
} satisfies Meta<typeof Eyebrow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const AboveHeading: Story = {
  render: (args) => (
    <div>
      <Eyebrow {...args} />
      <Heading level={2}>Développement web</Heading>
    </div>
  ),
};

/** On a primary section, the eyebrow inherits the section's text color. */
export const OnPrimarySection: Story = {
  args: { tone: "inherit" },
  render: (args) => (
    <Section background="primary" spacing="sm" className="px-6">
      <Eyebrow {...args} />
      <Heading level={2}>Rejoindre l’association</Heading>
    </Section>
  ),
};
