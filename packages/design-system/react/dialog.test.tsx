import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Dialog } from "./dialog.tsx";
import { axeViolations } from "./testing/axe.ts";

// jsdom 30 has no `showModal()` (no top layer, no inert page): these tests stand in for it and check
// the markup and the wiring. Focus, inertness, Escape and focus return are checked in Chromium
// (apps/web/tests/e2e/interactive.spec.ts).

const showModal = vi.fn(function (this: HTMLDialogElement) {
  this.setAttribute("open", "");
});
const close = vi.fn(function (this: HTMLDialogElement) {
  this.removeAttribute("open");
});

beforeEach(() => {
  Object.assign(HTMLDialogElement.prototype, { showModal, close });
});

afterEach(() => {
  Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
  Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
  vi.clearAllMocks();
});

function renderDialog() {
  return render(
    <Dialog
      triggerLabel="Voir le programme"
      title="Programme de la formation"
      description="Douze semaines, trois modules."
      closeLabel="Fermer"
      footer={
        <form method="dialog">
          <button type="submit">J’ai compris</button>
        </form>
      }
    >
      <p>Module 1 : les bases du web.</p>
    </Dialog>,
  );
}

describe("Dialog", () => {
  it("renders a closed native dialog after its trigger button", () => {
    const { container } = renderDialog();
    const dialog = container.querySelector("dialog");
    expect(dialog?.open).toBe(false);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: "Voir le programme" }).getAttribute("type")).toBe(
      "button",
    );
  });

  it("opens with showModal, named by its title and described by its description", async () => {
    const user = userEvent.setup();
    const { container } = renderDialog();
    await user.click(screen.getByRole("button", { name: "Voir le programme" }));

    expect(showModal).toHaveBeenCalledTimes(1);
    const dialog = screen.getByRole("dialog", {
      name: "Programme de la formation",
      description: "Douze semaines, trois modules.",
    });
    expect(screen.getByRole("heading", { level: 2, name: "Programme de la formation" })).toBe(
      dialog.querySelector("h2"),
    );
    expect(dialog.textContent).toContain("Module 1 : les bases du web.");
    expect(await axeViolations(container)).toEqual([]);
  });

  it("closes from its close button, named by closeLabel with a decorative icon", async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole("button", { name: "Voir le programme" }));
    const closeButton = screen.getByRole("button", { name: "Fermer" });
    expect(closeButton.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");

    await user.click(closeButton);
    expect(close).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("has no description reference without a description", async () => {
    const user = userEvent.setup();
    render(
      <Dialog triggerLabel="Ouvrir" title="Information" closeLabel="Fermer">
        <p>Contenu.</p>
      </Dialog>,
    );
    await user.click(screen.getByRole("button", { name: "Ouvrir" }));
    expect(
      screen.getByRole("dialog", { name: "Information" }).hasAttribute("aria-describedby"),
    ).toBe(false);
  });
});
