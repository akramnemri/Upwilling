import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Container, Grid, Section, Stack } from "./layout.tsx";
import { axeViolations } from "./testing/axe.ts";
import { Eyebrow, Heading, Text } from "./typography.tsx";

describe("layout", () => {
  it("Container centers at a token width with the page gutter", () => {
    render(
      <Container as="main" width="prose">
        Contenu
      </Container>,
    );
    const main = screen.getByRole("main");
    expect(main.className.split(" ")).toEqual(
      expect.arrayContaining(["mx-auto", "px-gutter-page", "max-w-prose"]),
    );
  });

  it("Section sets the text color that goes with its background", () => {
    render(
      <>
        <Section aria-label="Clair">a</Section>
        <Section aria-label="Primaire" background="primary" spacing="lg">
          b
        </Section>
      </>,
    );
    expect(screen.getByRole("region", { name: "Clair" }).className).toBe(
      "py-section-md bg-surface text-text",
    );
    expect(screen.getByRole("region", { name: "Primaire" }).className).toBe(
      "py-section-lg bg-primary text-primary-contrast",
    );
  });

  it("Stack and Grid map their props to token classes", () => {
    render(
      <>
        <Stack data-testid="stack" direction="row" gap="sm" align="center" wrap>
          x
        </Stack>
        <Grid as="ul" data-testid="grid" columns={4} gap="lg">
          <li>y</li>
        </Grid>
      </>,
    );
    expect(screen.getByTestId("stack").className).toBe(
      "flex flex-row gap-gap-sm items-center flex-wrap",
    );
    const grid = screen.getByRole("list");
    expect(grid.className).toBe("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gap-lg");
  });

  it("keeps a caller's className for placement", () => {
    render(<Stack data-testid="stack" className="mt-6" />);
    expect(screen.getByTestId("stack").className).toBe("flex flex-col gap-4 mt-6");
  });
});

describe("typography", () => {
  it("Heading keeps the outline level apart from the visual size", () => {
    render(
      <>
        <Heading level={1}>Titre de page</Heading>
        <Heading level={2} size="5xl" tone="primary">
          Grand titre de section
        </Heading>
      </>,
    );
    const h1 = screen.getByRole("heading", { level: 1, name: "Titre de page" });
    expect(h1.className).toContain("text-4xl");
    const h2 = screen.getByRole("heading", { level: 2, name: "Grand titre de section" });
    expect(h2.className).toContain("text-5xl");
    expect(h2.className).toContain("text-primary");
  });

  it("Text renders a paragraph by default, with token size, tone and weight", () => {
    render(
      <Text size="lg" tone="muted" weight="semibold">
        Un paragraphe
      </Text>,
    );
    const text = screen.getByText("Un paragraphe");
    expect(text.tagName).toBe("P");
    expect(text.className).toBe("leading-body text-lg text-text-muted font-semibold");
  });

  it("Eyebrow is plain text placed before its heading (no role of its own)", () => {
    render(
      <hgroup>
        <Eyebrow>Formations</Eyebrow>
        <Heading level={2}>Nos parcours</Heading>
      </hgroup>,
    );
    expect(screen.getByText("Formations").className).toContain("uppercase");
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <Section aria-labelledby="titre">
        <Container>
          <Stack>
            <Eyebrow>Centre de formation</Eyebrow>
            <Heading level={2} id="titre">
              Apprendre autrement
            </Heading>
            <Text tone="muted">Des parcours courts et concrets.</Text>
            <Grid as="ul" columns={2}>
              <li>Un</li>
              <li>Deux</li>
            </Grid>
          </Stack>
        </Container>
      </Section>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
