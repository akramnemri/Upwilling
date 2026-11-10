import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Breadcrumbs } from "./navigation.tsx";
import { axeViolations } from "./testing/axe.ts";

describe("Breadcrumbs", () => {
  it("is a named navigation landmark with an ordered list ending on the current page", async () => {
    const { container } = render(
      <Breadcrumbs
        label="Fil d’Ariane"
        items={[
          { label: "Accueil", href: "/" },
          { label: "Formations", href: "/formations" },
        ]}
        current="Développement web"
      />,
    );
    const nav = screen.getByRole("navigation", { name: "Fil d’Ariane" });
    const list = within(nav).getByRole("list");
    expect(list.tagName).toBe("OL");
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);

    expect(
      within(nav)
        .getAllByRole("link")
        .map((link) => [link.textContent, link.getAttribute("href")]),
    ).toEqual([
      ["Accueil", "/"],
      ["Formations", "/formations"],
    ]);

    // The current page is text, not a link to itself.
    const current = within(nav).getByText("Développement web");
    expect(current.getAttribute("aria-current")).toBe("page");
    expect(current.closest("a")).toBeNull();

    // Separators are decorative.
    const icons = nav.querySelectorAll("svg");
    expect(icons).toHaveLength(2);
    for (const icon of icons) {
      expect(icon.getAttribute("aria-hidden")).toBe("true");
    }
    expect(await axeViolations(container)).toEqual([]);
  });

  it("shows only the current page when there is nothing above it", () => {
    render(<Breadcrumbs label="Fil d’Ariane" items={[]} current="Accueil" />);
    const nav = screen.getByRole("navigation", { name: "Fil d’Ariane" });
    expect(within(nav).queryAllByRole("link")).toHaveLength(0);
    expect(within(nav).getByText("Accueil").getAttribute("aria-current")).toBe("page");
  });
});
