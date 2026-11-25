import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Cpu, GitBranch, Terminal } from "lucide-react";

import { LogoStrip } from "../sections.tsx";

// Technologies as text chips (no third-party logos). The visual tests run with reduced motion, so
// they show the strip at rest: one wrapped list. Check the scrolling and its pause control by hand.
const meta = {
  title: "Sections/LogoStrip",
  component: LogoStrip,
  parameters: { layout: "fullscreen" },
  args: {
    title: "Technologies abordées (exemple)",
    pauseLabel: "Mettre en pause le défilement",
    items: [
      { label: "Linux", icon: Terminal },
      { label: "C" },
      { label: "Yocto" },
      { label: "RTOS", icon: Cpu },
      { label: "Git", icon: GitBranch },
      { label: "Bash" },
      { label: "Technologie d’exemple" },
    ],
  },
} satisfies Meta<typeof LogoStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** Title hidden visually (still read by screen readers), on a muted band. */
export const MutedHiddenTitle: Story = { args: { background: "muted", hideTitle: true } };
