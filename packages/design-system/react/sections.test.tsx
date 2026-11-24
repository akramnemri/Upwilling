import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendarCheck, Compass } from "lucide-react";
import { describe, expect, it } from "vitest";

import { ButtonLink } from "./actions.tsx";
import {
  AudienceTracks,
  CatalogueGrid,
  FaqAccordion,
  FeatureBento,
  Hero,
  HeroPanel,
  LogoStrip,
  PainPoints,
  PricingTiers,
  ProcessSteps,
  StatsBand,
  Testimonials,
} from "./sections.tsx";
import { axeViolations } from "./testing/axe.ts";

// jsdom applies no CSS: layout and colors are covered by the visual baselines in both brands. Here:
// landmarks, names, headings, list semantics and what assistive technology reads.

describe("Hero", () => {
  it("is a region named by the page's only h1, with actions, trust points and the visual", async () => {
    const { container } = render(
      <Hero
        title="Promesse d’exemple"
        lead="Paragraphe d’exemple."
        actions={<ButtonLink href="#contact">Action principale</ButtonLink>}
        highlights={["Point A", "Point B"]}
        visual={
          <HeroPanel
            label="Illustration d’exemple"
            windowTitle="console-exemple"
            lines={["$ commande", "ok"]}
            cards={[{ icon: CalendarCheck, title: "Carte d’exemple", detail: "Détail" }]}
          />
        }
      />,
    );
    const region = screen.getByRole("region", { name: "Promesse d’exemple" });
    expect(within(region).getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(within(region).getByRole("link", { name: "Action principale" })).toBeDefined();
    expect(
      within(region)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["Point A", "Point B"]);
    expect(await axeViolations(container)).toEqual([]);
  });

  it("renders the panel as one named image whose parts are not read one by one", () => {
    render(
      <HeroPanel
        label="Illustration d’exemple"
        windowTitle="console-exemple"
        lines={["$ commande"]}
        cards={[{ title: "Carte d’exemple" }, { title: "Seconde carte" }, { title: "Ignorée" }]}
      />,
    );
    const image = screen.getByRole("img", { name: "Illustration d’exemple" });
    expect(within(image).queryByText("$ commande")?.closest("[aria-hidden='true']")).not.toBeNull();
    // Two floating cards at most.
    expect(within(image).queryByText("Ignorée")).toBeNull();
    expect(within(image).getByText("Seconde carte")).toBeDefined();
  });
});

describe("StatsBand", () => {
  const items = [
    { value: "120", label: "Chiffre A" },
    { value: "35", label: "Chiffre B" },
  ];

  it("pairs each figure with its label in a description list, and keeps the note", async () => {
    const { container } = render(
      <StatsBand title="Quelques chiffres" items={items} note="Chiffres d’exemple." />,
    );
    const region = screen.getByRole("region", { name: "Quelques chiffres" });
    const terms = within(region).getAllByRole("term");
    expect(terms.map((term) => term.textContent)).toEqual(["Chiffre A", "Chiffre B"]);
    expect(terms[0]?.nextElementSibling?.textContent).toBe("120");
    expect(within(region).getByText("Chiffres d’exemple.")).toBeDefined();
    expect(await axeViolations(container)).toEqual([]);
  });

  it("still names the region when the title is hidden visually", () => {
    render(<StatsBand title="Quelques chiffres" hideTitle items={items} />);
    const heading = screen.getByRole("heading", { level: 2, name: "Quelques chiffres" });
    expect(heading.className).toContain("sr-only");
    expect(screen.getByRole("region", { name: "Quelques chiffres" })).toBeDefined();
  });
});

describe("PainPoints", () => {
  it("lists one card per item, each with an h3 under the section's h2", async () => {
    const { container } = render(
      <PainPoints
        eyebrow="Ça vous parle ?"
        title="Situations d’exemple"
        items={[
          { icon: Compass, title: "Situation 1", text: "Texte 1" },
          { title: "Situation 2", text: "Texte 2" },
        ]}
      />,
    );
    const region = screen.getByRole("region", { name: "Situations d’exemple" });
    const items = within(region).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(
      items.map((item) => within(item).getByRole("heading", { level: 3 }).textContent),
    ).toEqual(["Situation 1", "Situation 2"]);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("AudienceTracks", () => {
  it("shows each track with its points and its action", async () => {
    const { container } = render(
      <AudienceTracks
        id="parcours"
        title="Deux parcours"
        tracks={[
          {
            label: "En ligne",
            title: "Parcours A",
            text: "Texte A",
            points: ["Avantage 1", "Avantage 2"],
            action: <ButtonLink href="#a">Découvrir A</ButtonLink>,
          },
          { title: "Parcours B", text: "Texte B", points: ["Avantage 3"] },
        ]}
      />,
    );
    const region = screen.getByRole("region", { name: "Deux parcours" });
    expect(region.id).toBe("parcours");
    const tracks = within(region)
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.closest("li"));
    expect(tracks).toHaveLength(2);
    const trackA = tracks[0] as HTMLElement;
    expect(within(trackA).getByText("En ligne")).toBeDefined();
    expect(within(trackA).getByRole("link", { name: "Découvrir A" })).toBeDefined();
    expect(
      within(within(trackA).getByRole("list"))
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["Avantage 1", "Avantage 2"]);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("FeatureBento", () => {
  it("lists the features and lets a wide tile span two columns", async () => {
    const { container } = render(
      <FeatureBento
        title="Pourquoi nous"
        items={[
          { title: "Avantage 1", text: "Texte 1", size: "wide" },
          { title: "Avantage 2", text: "Texte 2" },
        ]}
      />,
    );
    const wide = screen.getByRole("heading", { level: 3, name: "Avantage 1" }).closest("li");
    const regular = screen.getByRole("heading", { level: 3, name: "Avantage 2" }).closest("li");
    expect(wide?.className).toContain("md:col-span-2");
    expect(regular?.className).not.toContain("col-span");
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("ProcessSteps", () => {
  it("is an ordered list; deliverables say what they are in words", async () => {
    const { container } = render(
      <ProcessSteps
        title="Les étapes"
        deliverableLabel="Livrable :"
        steps={[
          { title: "Étape 1", text: "Texte 1", deliverable: "Document A" },
          { title: "Étape 2", text: "Texte 2" },
          { title: "Étape 3", text: "Texte 3" },
        ]}
      />,
    );
    const region = screen.getByRole("region", { name: "Les étapes" });
    const list = within(region).getByRole("list");
    expect(list.tagName).toBe("OL");
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    // The label and the deliverable are one paragraph, read together.
    expect(within(list).getByText("Document A").textContent).toBe("Livrable : Document A");
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("LogoStrip", () => {
  const items = [{ label: "Linux" }, { label: "Yocto" }];

  it("exposes one list to assistive technology; the loop copy is hidden", async () => {
    const { container } = render(
      <LogoStrip title="Technologies" items={items} pauseLabel="Mettre en pause le défilement" />,
    );
    const region = screen.getByRole("region", { name: "Technologies" });
    const lists = within(region).getAllByRole("list");
    expect(lists).toHaveLength(1);
    expect(
      within(lists[0] as HTMLElement)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["Linux", "Yocto"]);
    const copy = region.querySelector("[data-marquee-copy]");
    expect(copy?.getAttribute("aria-hidden")).toBe("true");
    expect(await axeViolations(container)).toEqual([]);
  });

  it("has a labelled pause checkbox (CSS stops the scrolling while it is checked)", async () => {
    render(<LogoStrip title="Technologies" items={items} pauseLabel="Mettre en pause" />);
    const pause = screen.getByRole("checkbox", { name: "Mettre en pause" });
    expect(pause.closest("[data-marquee]")).not.toBeNull();
    await userEvent.setup().click(pause);
    expect((pause as HTMLInputElement).checked).toBe(true);
  });
});

describe("CatalogueGrid", () => {
  const items = [
    {
      title: "Formation 1",
      href: "/formations/1",
      badge: "Débutant",
      facts: ["3 jours"],
      price: "Sur devis",
    },
    { title: "Formation 2", href: "/formations/2", chips: ["Thème A"] },
  ];

  it("shows category tabs over cards whose title is the link", async () => {
    const { container } = render(
      <CatalogueGrid
        title="Catalogue"
        tabsLabel="Domaines"
        categories={[
          { value: "toutes", label: "Toutes", items },
          { value: "a", label: "Domaine A", items: items.slice(0, 1) },
        ]}
      />,
    );
    const tablist = screen.getByRole("tablist", { name: "Domaines" });
    expect(
      within(tablist)
        .getAllByRole("tab")
        .map((tab) => tab.textContent),
    ).toEqual(["Toutes", "Domaine A"]);
    const panel = screen.getByRole("tabpanel");
    const link = within(panel).getByRole("link", { name: "Formation 1" });
    expect(link.getAttribute("href")).toBe("/formations/1");
    expect(link.closest("h3")).not.toBeNull();
    expect(within(panel).getByText("Sur devis")).toBeDefined();
    expect(await axeViolations(container)).toEqual([]);
  });

  it("switches category with the tabs", async () => {
    render(
      <CatalogueGrid
        title="Catalogue"
        tabsLabel="Domaines"
        categories={[
          { value: "toutes", label: "Toutes", items },
          { value: "a", label: "Domaine A", items: items.slice(1) },
        ]}
      />,
    );
    await userEvent.setup().click(screen.getByRole("tab", { name: "Domaine A" }));
    const panel = screen.getByRole("tabpanel");
    expect(within(panel).queryByRole("link", { name: "Formation 1" })).toBeNull();
    expect(within(panel).getByRole("link", { name: "Formation 2" })).toBeDefined();
  });

  it("renders the grid without tabs for a single category", () => {
    render(
      <CatalogueGrid
        title="Catalogue"
        tabsLabel="Domaines"
        categories={[{ value: "toutes", label: "Toutes", items }]}
      />,
    );
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(2);
  });
});

describe("PricingTiers", () => {
  it("marks the highlighted tier in words, not by color alone", async () => {
    const { container } = render(
      <PricingTiers
        title="Formules"
        highlightLabel="Le plus choisi"
        note="Tarifs d’exemple."
        tiers={[
          { name: "Formule A", price: "10 €", features: ["Point 1"] },
          {
            name: "Formule B",
            price: "20 €",
            period: "par an",
            features: ["Point 1", "Point 2"],
            highlighted: true,
          },
        ]}
      />,
    );
    const tierB = screen.getByRole("heading", { level: 3, name: "Formule B" }).closest("li");
    const tierA = screen.getByRole("heading", { level: 3, name: "Formule A" }).closest("li");
    expect(within(tierB as HTMLElement).getByText("Le plus choisi")).toBeDefined();
    expect(within(tierA as HTMLElement).queryByText("Le plus choisi")).toBeNull();
    expect(within(tierB as HTMLElement).getByText("par an")).toBeDefined();
    expect(screen.getByText("Tarifs d’exemple.")).toBeDefined();
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("FaqAccordion", () => {
  it("renders each question as a native disclosure with its answer in the page", async () => {
    const { container } = render(
      <FaqAccordion
        title="Questions fréquentes"
        items={[
          { question: "Question 1 ?", answer: "Réponse 1" },
          { question: "Question 2 ?", answer: "Réponse 2" },
        ]}
      />,
    );
    const region = screen.getByRole("region", { name: "Questions fréquentes" });
    const details = region.querySelectorAll("details");
    expect(details).toHaveLength(2);
    expect(details[0]?.querySelector("summary")?.textContent).toBe("Question 1 ?");
    expect(within(region).getByText("Réponse 2")).toBeDefined();
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("Testimonials", () => {
  it("renders each quote as a figure with its author", async () => {
    const { container } = render(
      <Testimonials
        title="Témoignages"
        note="Témoignages fictifs."
        items={[
          { quote: "Citation 1", name: "Prénom A.", role: "Rôle" },
          { quote: "Citation 2", name: "Prénom B." },
        ]}
      />,
    );
    const figures = screen.getAllByRole("figure");
    expect(figures).toHaveLength(2);
    const first = figures[0] as HTMLElement;
    expect(first.querySelector("blockquote")?.textContent).toBe("Citation 1");
    expect(first.querySelector("figcaption")?.textContent).toBe("Prénom A.Rôle");
    expect(screen.getByText("Témoignages fictifs.")).toBeDefined();
    expect(await axeViolations(container)).toEqual([]);
  });
});
