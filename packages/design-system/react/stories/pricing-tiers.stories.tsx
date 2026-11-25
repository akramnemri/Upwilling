import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ButtonLink } from "../actions.tsx";
import { type PricingTier, PricingTiers } from "../sections.tsx";

// Example prices only: the real amounts are a PO decision (formats, CB-02 membership).
const TIERS: readonly PricingTier[] = [
  {
    name: "Formule d’exemple A",
    price: "00 €",
    period: "par personne",
    description: "Une phrase d’exemple sur cette formule.",
    features: ["Avantage d’exemple 1", "Avantage d’exemple 2"],
    action: (
      <ButtonLink href="#formule-a" variant="secondary">
        Choisir la formule A
      </ButtonLink>
    ),
  },
  {
    name: "Formule d’exemple B",
    price: "00 €",
    period: "par personne",
    description: "Une phrase d’exemple sur cette formule.",
    features: ["Avantage d’exemple 1", "Avantage d’exemple 2", "Avantage d’exemple 3"],
    action: <ButtonLink href="#formule-b">Choisir la formule B</ButtonLink>,
    highlighted: true,
  },
  {
    name: "Formule d’exemple C",
    price: "Sur devis",
    description: "Une phrase d’exemple sur cette formule.",
    features: ["Avantage d’exemple 1", "Avantage d’exemple 2", "Avantage d’exemple 4"],
    action: (
      <ButtonLink href="#formule-c" variant="secondary">
        Demander un devis
      </ButtonLink>
    ),
  },
];

const meta = {
  title: "Sections/PricingTiers",
  component: PricingTiers,
  parameters: { layout: "fullscreen" },
  args: {
    eyebrow: "Formules",
    title: "Des formules d’exemple",
    highlightLabel: "Le plus choisi",
    tiers: TIERS,
    note: "Tarifs d’exemple, sans valeur réelle.",
  },
} satisfies Meta<typeof PricingTiers>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeTiers: Story = {};
/** Two tiers, none highlighted, on a white band. */
export const TwoTiers: Story = {
  args: { background: "surface", tiers: [TIERS[0], TIERS[2]].filter((tier) => tier !== undefined) },
};
/** Phone width: one tier per row. */
export const Mobile: Story = {
  globals: { viewport: { value: "mobile2", isRotated: false } },
  tags: ["visual-mobile"],
};
