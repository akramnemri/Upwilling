import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CalendarX } from "lucide-react";

import { ButtonLink } from "../actions.tsx";
import { EmptyState } from "../feedback.tsx";

const meta = {
  title: "Feedback/EmptyState",
  component: EmptyState,
  args: {
    title: "Aucune session prévue",
    titleLevel: 2,
    description: "Les prochaines dates seront publiées bientôt. Laissez-nous vos coordonnées.",
  },
  argTypes: {
    icon: { control: false },
    action: { control: false },
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TitleAndDescription: Story = {};
export const WithIcon: Story = { args: { icon: CalendarX } };
export const WithAction: Story = {
  args: {
    icon: CalendarX,
    action: <ButtonLink href="/contact">Être prévenu</ButtonLink>,
  },
};
export const TitleOnly: Story = { args: { description: undefined } };
