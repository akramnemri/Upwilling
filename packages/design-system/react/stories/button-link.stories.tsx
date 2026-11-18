import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowRight } from "lucide-react";

import { ButtonLink } from "../actions.tsx";

const meta = {
  title: "Actions/ButtonLink",
  component: ButtonLink,
  args: { href: "/formations", children: "Découvrir les formations" },
  argTypes: {
    icon: { control: false },
  },
} satisfies Meta<typeof ButtonLink>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A path: rendered by `next/link`. */
export const Internal: Story = {};
export const Secondary: Story = { args: { variant: "secondary" } };
export const WithIcon: Story = { args: { icon: ArrowRight, iconPosition: "end" } };
/** A URL: plain anchor. A new tab is said to screen readers (`newTabLabel`) and shown by an icon. */
export const ExternalNewTab: Story = {
  args: {
    href: "https://example.com/programme",
    newTab: true,
    newTabLabel: "(nouvel onglet)",
    children: "Programme détaillé",
    variant: "ghost",
  },
};
