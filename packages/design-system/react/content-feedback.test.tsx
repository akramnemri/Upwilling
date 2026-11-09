import { render, screen } from "@testing-library/react";
import { Code } from "lucide-react";
import { describe, expect, it } from "vitest";

import {
  AnnouncementPill,
  Badge,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardMedia,
  Chip,
} from "./content.tsx";
import { Skeleton, Spinner } from "./feedback.tsx";
import { Icon } from "./icon.tsx";
import { axeViolations } from "./testing/axe.ts";
import { Heading, Text } from "./typography.tsx";

describe("Icon", () => {
  it("is hidden from assistive technology unless it carries a label", () => {
    const { container } = render(
      <>
        <Icon icon={Code} />
        <Icon icon={Code} size="lg" label="Code source" />
      </>,
    );
    const [decorative] = container.querySelectorAll("svg");
    expect(decorative?.getAttribute("aria-hidden")).toBe("true");
    expect(decorative?.getAttribute("class")).toContain("size-5");
    expect(screen.getByRole("img", { name: "Code source" }).getAttribute("class")).toContain(
      "size-6",
    );
  });
});

describe("Badge, Chip, AnnouncementPill", () => {
  it.each(["neutral", "primary", "success", "warning", "danger", "info"] as const)(
    "Badge %s pairs a background with its contrast-checked text color",
    (tone) => {
      render(<Badge tone={tone}>Statut</Badge>);
      const { className } = screen.getByText("Statut");
      expect(className).toMatch(/\bbg-[a-z-]+\b.*\btext-[a-z-]+\b/);
      expect(className).not.toMatch(/\[|#/);
    },
  );

  it("Chip shows a decorative icon before its text", () => {
    render(<Chip icon={Code}>TypeScript</Chip>);
    const chip = screen.getByText("TypeScript");
    expect(chip.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("AnnouncementPill is a paragraph, or a single link when it has an href", () => {
    const { rerender } = render(
      <AnnouncementPill tag="Nouveau">Sessions de mars</AnnouncementPill>,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Nouveau")).toBeTruthy();

    rerender(
      <AnnouncementPill tag="Nouveau" href="/sessions">
        Sessions de mars
      </AnnouncementPill>,
    );
    const link = screen.getByRole("link", { name: "Nouveau Sessions de mars" });
    expect(link.getAttribute("href")).toBe("/sessions");
  });
});

describe("Card", () => {
  it("is an article with its slots in order", () => {
    render(
      <Card aria-labelledby="carte-titre">
        <CardMedia>
          <img src="/placeholder.png" alt="" width={320} height={180} />
        </CardMedia>
        <CardHeader>
          <Heading level={3} id="carte-titre">
            Développement web
          </Heading>
        </CardHeader>
        <CardBody>
          <Text>Douze semaines pour apprendre les bases.</Text>
        </CardBody>
        <CardFooter>
          <Badge>Débutant</Badge>
        </CardFooter>
      </Card>,
    );
    const card = screen.getByRole("article", { name: "Développement web" });
    expect(card.className).toContain("rounded-lg");
    expect(card.textContent).toBe(
      "Développement webDouze semaines pour apprendre les bases.Débutant",
    );
  });
});

describe("Spinner and Skeleton", () => {
  it("Spinner announces its label as a status, and its ring stops under reduced motion", () => {
    render(<Spinner label="Chargement des formations" />);
    const status = screen.getByRole("status");
    expect(status.textContent).toBe("Chargement des formations");
    expect(status.querySelector("svg")?.getAttribute("class")).toContain(
      "motion-safe:animate-spin",
    );
  });

  it("a decorative Spinner has no status role", () => {
    render(<Spinner decorative />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("Skeleton is hidden from assistive technology; the last of several lines is shorter", () => {
    const { container } = render(<Skeleton lines={3} />);
    const root = container.firstElementChild;
    expect(root?.getAttribute("aria-hidden")).toBe("true");
    const lines = [...(root?.children ?? [])].map((line) => line.className);
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain("w-full");
    expect(lines[2]).toContain("w-2/3");
    expect(lines[2]).not.toContain("w-full");
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <div>
        <Badge tone="success">Inscriptions ouvertes</Badge>
        <Chip icon={Code}>React</Chip>
        <AnnouncementPill tag="Nouveau" href="/agenda">
          Journée portes ouvertes
        </AnnouncementPill>
        <Spinner label="Chargement" />
        <Skeleton shape="title" />
      </div>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
