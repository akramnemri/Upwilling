import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SiteFooter } from "../site.tsx";

// Placeholder legal details, clearly fake: the real ones come from the tenant's settings (PO).
const meta = {
  title: "Navigation/SiteFooter",
  component: SiteFooter,
  parameters: { layout: "fullscreen" },
  args: {
    columns: [
      {
        title: "Le site",
        links: [
          { label: "Formations", href: "/formations" },
          { label: "Sessions", href: "/sessions" },
          { label: "Blog", href: "/blog" },
        ],
      },
      {
        title: "Contact",
        links: [
          { label: "Nous écrire", href: "/contact" },
          { label: "Demande de devis", href: "/devis" },
        ],
      },
    ],
    legalNavLabel: "Informations légales",
    legalLinks: [
      { label: "Mentions légales", href: "/mentions-legales" },
      { label: "Confidentialité", href: "/confidentialite" },
      { label: "Cookies", href: "/cookies" },
    ],
    legalEntity: "Organisme exemple, SAS au capital de 1 000 €, 1 rue de l’Exemple, 00000 Ville",
    note: "© 2026 Organisme exemple",
  },
} satisfies Meta<typeof SiteFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithColumns: Story = {};
/** Legal line and legal links only (no columns, no note). */
export const LegalOnly: Story = { args: { columns: [], note: undefined } };
/** Phone width: columns stack, legal links wrap. */
export const Mobile: Story = {
  globals: { viewport: { value: "mobile2", isRotated: false } },
  tags: ["visual-mobile"],
};
