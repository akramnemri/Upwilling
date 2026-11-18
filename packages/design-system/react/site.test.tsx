import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ButtonLink } from "./actions.tsx";
import { SiteFooter, SiteHeader } from "./site.tsx";
import { axeViolations } from "./testing/axe.ts";

// jsdom applies no CSS: what is hidden at which width is checked in Chromium
// (apps/web/tests/e2e/site.spec.ts). Here: roles, names, the menu's state and keyboard.

const ITEMS = [
  { label: "Formations", href: "#formations" },
  { label: "Tarifs", href: "#tarifs" },
];

function renderHeader() {
  return render(
    <SiteHeader
      logo={<a href="/">Accueil exemple</a>}
      navLabel="Navigation principale"
      menuLabel="Menu"
      items={ITEMS}
      cta={<ButtonLink href="#contact">Nous contacter</ButtonLink>}
    />,
  );
}

describe("SiteHeader", () => {
  it("is a banner with a named navigation landmark listing the items", async () => {
    const { container } = renderHeader();
    const banner = screen.getByRole("banner");
    const nav = within(banner).getByRole("navigation", { name: "Navigation principale" });
    expect(
      within(within(nav).getByRole("list"))
        .getAllByRole("link")
        .map((link) => [link.textContent, link.getAttribute("href")]),
    ).toEqual([
      ["Formations", "#formations"],
      ["Tarifs", "#tarifs"],
    ]);
    expect(banner.hasAttribute("data-site-header")).toBe(true);
    expect(await axeViolations(container)).toEqual([]);
  });

  it("renders the call to action twice: in the row and in the menu (one is hidden by CSS)", () => {
    renderHeader();
    expect(screen.getAllByRole("link", { name: "Nous contacter" })).toHaveLength(2);
  });

  it("opens and closes the menu with its button, which says whether it is expanded", async () => {
    const user = userEvent.setup();
    renderHeader();
    const button = screen.getByRole("button", { name: "Menu" });
    const panel = document.getElementById(button.getAttribute("aria-controls") ?? "");
    expect(panel).not.toBeNull();
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(panel?.className).toContain("max-md:hidden");

    await user.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(panel?.className).not.toContain("max-md:hidden");

    await user.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes on Escape and gives focus back to the button", async () => {
    const user = userEvent.setup();
    renderHeader();
    const button = screen.getByRole("button", { name: "Menu" });
    await user.click(button);
    await user.tab();
    expect(document.activeElement?.textContent).toBe("Formations");

    await user.keyboard("{Escape}");
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(button);
  });

  it("closes after a link is chosen (anchors stay on the same page)", async () => {
    const user = userEvent.setup();
    renderHeader();
    const button = screen.getByRole("button", { name: "Menu" });
    await user.click(button);
    await user.click(screen.getByRole("link", { name: "Tarifs" }));
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });

  it("has no call to action when none is given", () => {
    render(
      <SiteHeader
        logo={<a href="/">Accueil exemple</a>}
        navLabel="Navigation principale"
        menuLabel="Menu"
        items={ITEMS}
      />,
    );
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Accueil exemple",
      "Formations",
      "Tarifs",
    ]);
  });
});

describe("SiteFooter", () => {
  it("is a contentinfo landmark with named column and legal navigations", async () => {
    const { container } = render(
      <SiteFooter
        columns={[{ title: "Le site", links: [{ label: "Blog", href: "/blog" }] }]}
        legalNavLabel="Informations légales"
        legalLinks={[{ label: "Mentions légales", href: "/mentions-legales" }]}
        legalEntity="Organisme exemple, 00000 Ville"
        note="© 2026 Organisme exemple"
      />,
    );
    const footer = screen.getByRole("contentinfo");
    const column = within(footer).getByRole("navigation", { name: "Le site" });
    expect(within(column).getByRole("heading", { level: 2, name: "Le site" })).toBeTruthy();
    expect(within(column).getByRole("link", { name: "Blog" }).getAttribute("href")).toBe("/blog");

    const legal = within(footer).getByRole("navigation", { name: "Informations légales" });
    expect(within(legal).getByRole("link", { name: "Mentions légales" })).toBeTruthy();
    expect(within(footer).getByText("Organisme exemple, 00000 Ville")).toBeTruthy();
    expect(within(footer).getByText("© 2026 Organisme exemple")).toBeTruthy();
    expect(await axeViolations(container)).toEqual([]);
  });

  it("shows only the legal part without columns", () => {
    render(
      <SiteFooter
        legalNavLabel="Informations légales"
        legalLinks={[{ label: "Mentions légales", href: "/mentions-legales" }]}
        legalEntity="Organisme exemple"
      />,
    );
    expect(screen.getAllByRole("navigation")).toHaveLength(1);
    expect(screen.queryByRole("heading")).toBeNull();
  });
});
