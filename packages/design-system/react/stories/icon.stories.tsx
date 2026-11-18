import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CalendarDays, GraduationCap, Heart } from "lucide-react";

import { Icon } from "../icon.tsx";
import { Stack } from "../layout.tsx";

const meta = {
  title: "Content/Icon",
  component: Icon,
  args: { icon: GraduationCap },
  argTypes: {
    icon: { control: false },
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Hidden from assistive technology: the text next to it says the same. */
export const Decorative: Story = {};
/** The only carrier of meaning: `role="img"` with a label. */
export const Labelled: Story = { args: { icon: Heart, label: "Favori" } };

export const Sizes: Story = {
  render: () => (
    <Stack direction="row" gap="4" align="center" className="text-primary">
      <Icon icon={CalendarDays} size="sm" />
      <Icon icon={CalendarDays} size="md" />
      <Icon icon={CalendarDays} size="lg" />
    </Stack>
  ),
};
