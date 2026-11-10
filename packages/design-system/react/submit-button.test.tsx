import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Send } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import { SubmitButton } from "./submit-button.tsx";
import { axeViolations } from "./testing/axe.ts";

/** A form action that stays pending until the test releases it. */
function pendingAction() {
  let release = (): void => undefined;
  const action = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        release = resolve;
      }),
  );
  return { action, release: () => release() };
}

describe("SubmitButton", () => {
  it("submits its form, announces the pending state and refuses a second submission", async () => {
    const user = userEvent.setup();
    const { action, release } = pendingAction();
    render(
      <form action={action} aria-label="Contact">
        <label htmlFor="nom">Nom</label>
        <input id="nom" name="nom" />
        <SubmitButton pendingLabel="Envoi en cours" icon={Send}>
          Envoyer
        </SubmitButton>
      </form>,
    );
    const button = screen.getByRole("button", { name: "Envoyer" });
    const status = screen.getByRole("status");
    expect(button.getAttribute("type")).toBe("submit");
    expect(status.textContent).toBe("");

    await user.click(button);
    await waitFor(() => {
      expect(status.textContent).toBe("Envoi en cours");
    });
    expect(button.getAttribute("aria-disabled")).toBe("true");
    expect(button.getAttribute("aria-busy")).toBe("true");
    // Still focusable and focused: aria-disabled, not disabled.
    expect(button.matches(":disabled")).toBe(false);
    expect(document.activeElement).toBe(button);
    // The spinner takes the icon's place; both are hidden from assistive technology.
    expect(button.querySelectorAll("svg")).toHaveLength(1);

    await user.click(button);
    await user.type(screen.getByRole("textbox", { name: "Nom" }), "Camille{Enter}");
    expect(action).toHaveBeenCalledTimes(1);

    await act(async () => {
      release();
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(status.textContent).toBe("");
    });
    expect(button.hasAttribute("aria-disabled")).toBe(false);
  });

  it("passes clicks to the caller's handler while idle", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <form action={() => undefined} aria-label="Contact">
        <SubmitButton pendingLabel="Envoi en cours" onClick={onClick} variant="secondary">
          Envoyer
        </SubmitButton>
      </form>,
    );
    await user.click(screen.getByRole("button", { name: "Envoyer" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <form action={() => undefined} aria-label="Contact">
        <SubmitButton pendingLabel="Envoi en cours">Envoyer</SubmitButton>
      </form>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
