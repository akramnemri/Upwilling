import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Link } from "../actions.tsx";
import { Section } from "../layout.tsx";
import { Text } from "../typography.tsx";

const meta = {
  title: "Actions/Link",
  component: Link,
  args: { href: "/mentions-legales", children: "mentions légales" },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Internal: Story = {};
export const Email: Story = {
  args: { href: "mailto:contact@example.com", children: "contact@example.com" },
};
export const ExternalNewTab: Story = {
  args: {
    href: "https://example.com",
    newTab: true,
    newTabLabel: "(nouvel onglet)",
    children: "site partenaire",
  },
};

export const InSentence: Story = {
  render: (args) => (
    <Text>
      Avant de vous inscrire, lisez nos <Link {...args} />.
    </Text>
  ),
};

/** `inherit` keeps the section's contrast color on a primary background. */
export const OnPrimarySection: Story = {
  args: { tone: "inherit" },
  render: (args) => (
    <Section background="primary" spacing="sm" className="px-6">
      <Text>
        Consultez nos <Link {...args} />.
      </Text>
    </Section>
  ),
};
