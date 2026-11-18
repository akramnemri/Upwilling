import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Accordion } from "../disclosure.tsx";
import { Text } from "../typography.tsx";

const meta = {
  title: "Disclosure/Accordion",
  component: Accordion,
  args: {
    className: "max-w-prose",
    items: [
      {
        value: "prerequis",
        title: "Faut-il des connaissances préalables ?",
        content: <Text>Non : la formation commence par les bases.</Text>,
      },
      {
        value: "financement",
        title: "Comment financer la formation ?",
        content: <Text>Plusieurs dispositifs existent ; nous vous aidons à choisir.</Text>,
      },
      {
        value: "certificat",
        title: "Reçoit-on un certificat ?",
        content: <Text>Oui, une attestation de fin de formation.</Text>,
      },
    ],
  },
  argTypes: {
    items: { control: false },
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Native `<details>`: several panels may be open. */
export const AllClosed: Story = {};
export const OneOpen: Story = { args: { defaultOpen: ["financement"] } };
export const SeveralOpen: Story = { args: { defaultOpen: ["prerequis", "certificat"] } };
/** Opening a panel closes the others (shared `name`). */
export const Exclusive: Story = { args: { exclusive: true, defaultOpen: ["prerequis"] } };
