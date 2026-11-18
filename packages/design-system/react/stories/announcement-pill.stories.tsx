import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AnnouncementPill } from "../content.tsx";

const meta = {
  title: "Content/AnnouncementPill",
  component: AnnouncementPill,
  args: { children: "Les inscriptions de mars sont ouvertes" },
} satisfies Meta<typeof AnnouncementPill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextOnly: Story = {};
export const WithTag: Story = { args: { tag: "Nouveau" } };
/** The whole pill is a link; an arrow shows it. */
export const AsLink: Story = { args: { tag: "Nouveau", href: "/sessions" } };
export const AsLinkWithoutTag: Story = { args: { href: "/sessions" } };
