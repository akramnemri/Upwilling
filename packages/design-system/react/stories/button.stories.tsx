import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowRight, Download } from "lucide-react";

import { Button } from "../actions.tsx";
import { Stack } from "../layout.tsx";

const meta = {
  title: "Actions/Button",
  component: Button,
  args: { children: "S’inscrire" },
  argTypes: {
    icon: { control: false },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: "secondary" } };
export const Ghost: Story = { args: { variant: "ghost" } };
export const LinkLook: Story = { args: { variant: "link" } };
export const Small: Story = { args: { size: "sm" } };
export const Large: Story = { args: { size: "lg" } };
export const IconStart: Story = { args: { icon: Download, children: "Télécharger le programme" } };
export const IconEnd: Story = {
  args: { icon: ArrowRight, iconPosition: "end", children: "Voir les formations" },
};
/** Disabled and `aria-busy`; the label is read after the text. */
export const Loading: Story = {
  args: { loading: true, loadingLabel: "(envoi en cours)", children: "Envoyer" },
};
export const Disabled: Story = { args: { disabled: true } };

export const AllVariantsAndSizes: Story = {
  render: () => (
    <Stack gap="4">
      {(["primary", "secondary", "ghost", "link"] as const).map((variant) => (
        <Stack key={variant} direction="row" gap="3" align="center" wrap>
          {(["sm", "md", "lg"] as const).map((size) => (
            <Button key={size} variant={variant} size={size}>
              {variant} {size}
            </Button>
          ))}
        </Stack>
      ))}
    </Stack>
  ),
};
