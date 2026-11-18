import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Tabs } from "../disclosure.tsx";
import { Text } from "../typography.tsx";

const meta = {
  title: "Disclosure/Tabs",
  component: Tabs,
  args: {
    label: "Domaines de formation",
    items: [
      {
        value: "web",
        label: "Développement web",
        content: <Text>HTML, CSS, JavaScript et les frameworks actuels.</Text>,
      },
      {
        value: "data",
        label: "Données",
        content: <Text>Analyse, visualisation et bonnes pratiques.</Text>,
      },
      {
        value: "securite",
        label: "Cybersécurité",
        content: <Text>Les gestes essentiels pour protéger une organisation.</Text>,
      },
    ],
  },
  argTypes: {
    items: { control: false },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One Tab stop; the arrow keys, Home and End select a tab. */
export const FirstSelected: Story = {};
export const OtherSelected: Story = { args: { defaultValue: "data" } };
