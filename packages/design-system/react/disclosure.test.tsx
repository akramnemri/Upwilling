import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Accordion, Tabs } from "./disclosure.tsx";
import { axeViolations } from "./testing/axe.ts";

// jsdom has no layout and does not group `<details name>`: opening, closing and exclusivity are
// checked in Chromium (apps/web/tests/e2e/interactive.spec.ts). Here: the markup and Radix's keyboard.

const QUESTIONS = [
  {
    value: "duree",
    title: "Combien de temps dure la formation ?",
    content: <p>Douze semaines.</p>,
  },
  { value: "prix", title: "Est-elle payante ?", content: <p>Des aides existent.</p> },
  { value: "lieu", title: "Où se déroule-t-elle ?", content: <p>En ligne et sur place.</p> },
] as const;

function detailsOf(title: string): HTMLDetailsElement {
  const details = screen.getByText(title).closest("details");
  if (details === null) {
    throw new Error(`No <details> around "${title}"`);
  }
  return details;
}

describe("Accordion", () => {
  it("renders one native details/summary per item, closed unless listed in defaultOpen", async () => {
    const { container } = render(<Accordion items={QUESTIONS} defaultOpen={["prix"]} />);
    expect(container.querySelectorAll("details > summary")).toHaveLength(3);
    expect(detailsOf("Combien de temps dure la formation ?").open).toBe(false);
    expect(detailsOf("Est-elle payante ?").open).toBe(true);
    // Every answer is in the HTML, closed or not (search engines, find-in-page).
    expect(container.textContent).toContain("Douze semaines.");
    // Independent panels: no group name.
    expect(detailsOf("Est-elle payante ?").hasAttribute("name")).toBe(false);
    expect(await axeViolations(container)).toEqual([]);
  });

  it("groups the panels under one name when exclusive, opening only the first default", () => {
    render(<Accordion items={QUESTIONS} exclusive defaultOpen={["lieu", "prix"]} />);
    const names = QUESTIONS.map(({ title }) => detailsOf(title).getAttribute("name"));
    expect(names[0]).not.toBeNull();
    expect(new Set(names).size).toBe(1);
    expect(QUESTIONS.map(({ title }) => detailsOf(title).open)).toEqual([false, false, true]);
  });

  it("gives each accordion its own group name", () => {
    render(
      <>
        <Accordion items={QUESTIONS.slice(0, 1)} exclusive />
        <Accordion items={QUESTIONS.slice(1, 2)} exclusive />
      </>,
    );
    expect(detailsOf(QUESTIONS[0].title).getAttribute("name")).not.toBe(
      detailsOf(QUESTIONS[1].title).getAttribute("name"),
    );
  });

  it("hides the chevron from assistive technology", () => {
    render(<Accordion items={QUESTIONS.slice(0, 1)} />);
    const summary = detailsOf(QUESTIONS[0].title).querySelector("summary");
    expect(summary?.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });
});

const DOMAINS = [
  { value: "web", label: "Web", content: <p>Sites et applications.</p> },
  { value: "donnees", label: "Données", content: <p>Analyse et visualisation.</p> },
  { value: "cyber", label: "Cybersécurité", content: <p>Protéger un système.</p> },
] as const;

describe("Tabs", () => {
  it("names the tab list and shows the first panel, labelled by its tab", async () => {
    const { container } = render(<Tabs label="Domaines de formation" items={DOMAINS} />);
    const list = screen.getByRole("tablist", { name: "Domaines de formation" });
    const tabs = within(list).getAllByRole("tab");
    expect(tabs.map((tab) => tab.getAttribute("aria-selected"))).toEqual([
      "true",
      "false",
      "false",
    ]);
    const panel = screen.getByRole("tabpanel", { name: "Web" });
    expect(panel.textContent).toBe("Sites et applications.");
    expect(tabs[0]?.getAttribute("aria-controls")).toBe(panel.id);
    // Only the selected panel's content is rendered.
    expect(container.textContent).not.toContain("Protéger un système.");
    expect(await axeViolations(container)).toEqual([]);
  });

  it("is one Tab stop: arrows, Home and End move the selection, Tab enters the panel", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Avant</button>
        <Tabs label="Domaines de formation" items={DOMAINS} />
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Avant" }));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Web" }));

    await user.keyboard("{ArrowRight}");
    const data = screen.getByRole("tab", { name: "Données" });
    expect(document.activeElement).toBe(data);
    expect(data.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tabpanel", { name: "Données" }).textContent).toBe(
      "Analyse et visualisation.",
    );

    await user.keyboard("{End}");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Cybersécurité" }));
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Web" }));
    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Cybersécurité" }));
    await user.keyboard("{Home}");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Web" }));

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("tabpanel", { name: "Web" }));
  });

  it("starts on defaultValue and selects a tab on click", async () => {
    const user = userEvent.setup();
    render(<Tabs label="Domaines de formation" items={DOMAINS} defaultValue="cyber" />);
    expect(screen.getByRole("tabpanel", { name: "Cybersécurité" })).toBeDefined();
    await user.click(screen.getByRole("tab", { name: "Données" }));
    expect(screen.getByRole("tab", { name: "Données" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tabpanel", { name: "Données" })).toBeDefined();
  });
});
