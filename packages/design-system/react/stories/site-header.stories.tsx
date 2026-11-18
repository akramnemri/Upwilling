import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ButtonLink } from "../actions.tsx";
import { SiteHeader } from "../site.tsx";

// Synthetic logo: the application passes the brand's real logo (an image link to the home page).
const logo = (
  <a
    href="/"
    className="rounded-sm font-display text-xl font-bold text-primary focus-visible:focus-ring"
  >
    Marque exemple
  </a>
);

const meta = {
  title: "Navigation/SiteHeader",
  component: SiteHeader,
  parameters: { layout: "fullscreen" },
  args: {
    logo,
    navLabel: "Navigation principale",
    menuLabel: "Menu",
    items: [
      { label: "Formations", href: "#formations" },
      { label: "Méthode", href: "#methode" },
      { label: "Tarifs", href: "#tarifs" },
      { label: "Questions fréquentes", href: "#faq" },
    ],
    cta: (
      <ButtonLink href="#contact" size="sm">
        Nous contacter
      </ButtonLink>
    ),
  },
} satisfies Meta<typeof SiteHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithCallToAction: Story = {};
export const WithoutCallToAction: Story = { args: { cta: undefined } };
export const TwoItems: Story = {
  args: {
    items: [
      { label: "Actualités", href: "/actualites" },
      { label: "Adhérer", href: "/adherer" },
    ],
  },
};

const MOBILE = { viewport: { value: "mobile2", isRotated: false } };

/** Phone width: the links hide behind the "Menu" button. */
export const MobileClosed: Story = {
  globals: MOBILE,
  tags: ["visual-mobile"],
};

/**
 * Phone width, menu open (play function presses "Menu"): the panel under the header holds the
 * links and the call to action. Escape closes it and focus returns to the button.
 */
export const MobileOpen: Story = {
  globals: MOBILE,
  tags: ["visual-mobile", "!autodocs"],
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Menu" }));
  },
};
