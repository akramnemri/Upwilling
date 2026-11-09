import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArrowRight } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import { Button, ButtonLink, isInternalHref, Link } from "./actions.tsx";
import { axeViolations } from "./testing/axe.ts";

describe("Button", () => {
  it("is a real button that does not submit forms by default", () => {
    render(<Button>Envoyer</Button>);
    const button = screen.getByRole("button", { name: "Envoyer" });
    expect(button).toHaveProperty("type", "button");
  });

  it("works from the keyboard (Enter and Space) and shows the focus ring only on keyboard focus", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Valider</Button>);

    await user.tab();
    const button = screen.getByRole("button", { name: "Valider" });
    expect(document.activeElement).toBe(button);
    expect(button.className).toContain("focus-visible:focus-ring");

    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it.each(["primary", "secondary", "ghost", "link"] as const)(
    "renders the %s variant with token classes only",
    (variant) => {
      render(<Button variant={variant}>Action</Button>);
      const { className } = screen.getByRole("button", { name: "Action" });
      expect(className).toMatch(variant === "link" ? /\bunderline\b/ : /\brounded-md\b/);
      expect(className).not.toMatch(/\[|#/);
    },
  );

  it("while loading: disabled, busy, says why, and ignores clicks", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button loading loadingLabel="(envoi en cours)" onClick={onClick}>
        Envoyer
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Envoyer (envoi en cours)" });
    expect(button).toHaveProperty("disabled", true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    // The spinner is decorative inside the button: no second status for screen readers.
    expect(screen.queryByRole("status")).toBeNull();

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("keeps a decorative icon out of the accessible name", () => {
    render(
      <Button icon={ArrowRight} iconPosition="end">
        Continuer
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Continuer" });
    expect(button.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("has no axe violations in any state", async () => {
    const { container } = render(
      <div>
        <Button>Par défaut</Button>
        <Button variant="secondary" size="sm">
          Petit
        </Button>
        <Button variant="ghost" size="lg" icon={ArrowRight}>
          Grand
        </Button>
        <Button disabled>Indisponible</Button>
        <Button loading loadingLabel="(chargement)">
          En cours
        </Button>
      </div>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("Link and ButtonLink", () => {
  it.each([
    ["/formations", true],
    ["#programme", true],
    ["?page=2", true],
    ["//example.com/page", false],
    ["https://example.com", false],
    ["mailto:contact@example.com", false],
    ["tel:+33100000000", false],
  ])("treats %s as internal: %s", (href, internal) => {
    expect(isInternalHref(href)).toBe(internal);
  });

  it("renders an underlined link with its href", () => {
    render(<Link href="/formations">Nos formations</Link>);
    const link = screen.getByRole("link", { name: "Nos formations" });
    expect(link.getAttribute("href")).toBe("/formations");
    expect(link.className).toContain("underline");
    expect(link.getAttribute("target")).toBeNull();
  });

  it("says when a link opens a new tab, and protects the opener", () => {
    render(
      <Link href="https://example.com/partenaire" newTab newTabLabel="(nouvel onglet)">
        Site du partenaire
      </Link>,
    );
    const link = screen.getByRole("link", { name: "Site du partenaire (nouvel onglet)" });
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("ButtonLink is a link (it navigates) styled as a button", () => {
    render(
      <ButtonLink href="/inscription" variant="secondary">
        S’inscrire
      </ButtonLink>,
    );
    const link = screen.getByRole("link", { name: "S’inscrire" });
    expect(link.getAttribute("href")).toBe("/inscription");
    expect(link.className).toContain("rounded-md");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <p>
        Lire <Link href="/a-propos">la présentation</Link> ou{" "}
        <Link href="https://example.com" newTab newTabLabel="(nouvel onglet)">
          un site externe
        </Link>
        . <ButtonLink href="/contact">Nous écrire</ButtonLink>
      </p>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
