import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Laptop, Users } from "lucide-react";
import { describe, expect, it } from "vitest";

import { ChoiceCards, RadioGroup } from "./choices.tsx";
import { Checkbox, Field, Fieldset, FileInput, Input, Select, Textarea } from "./forms.tsx";
import { axeViolations } from "./testing/axe.ts";

const HELP = "Nous vous répondrons à cette adresse.";
const ERROR = "Saisissez une adresse e-mail valide, par exemple nom@example.com.";

describe("Field", () => {
  it("names the control with its label and describes it with the help, then the error", () => {
    render(
      <Field label="Adresse e-mail" help={HELP} error={ERROR}>
        {(control) => <Input type="email" name="email" {...control} />}
      </Field>,
    );
    const input = screen.getByRole("textbox", {
      name: "Adresse e-mail",
      description: `${HELP} ${ERROR}`,
    });
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("type")).toBe("email");
    expect(input.className).toContain("aria-[invalid=true]:border-danger");
  });

  it("leaves out the description and the invalid state when there is nothing to say", () => {
    render(<Field label="Ville">{(control) => <Input name="ville" {...control} />}</Field>);
    const input = screen.getByRole("textbox", { name: "Ville" });
    expect(input.hasAttribute("aria-describedby")).toBe(false);
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    expect(input.hasAttribute("required")).toBe(false);
  });

  it("shows the required marker in the label and makes the control required", () => {
    render(
      <Field label="Nom" required requiredLabel="(obligatoire)">
        {(control) => <Input name="nom" {...control} />}
      </Field>,
    );
    const input = screen.getByRole<HTMLInputElement>("textbox", { name: "Nom (obligatoire)" });
    expect(input.required).toBe(true);
  });

  it("uses the given id for the control and derives the message ids from it", () => {
    render(
      <Field id="code-postal" label="Code postal" help="Cinq chiffres.">
        {(control) => <Input name="cp" inputMode="numeric" {...control} />}
      </Field>,
    );
    const input = screen.getByRole("textbox", { name: "Code postal" });
    expect(input.id).toBe("code-postal");
    expect(input.getAttribute("aria-describedby")).toBe("code-postal-help");
  });

  it("wires a textarea, a select and a file input the same way", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Field label="Message" help="Quelques lignes suffisent.">
          {(control) => <Textarea name="message" {...control} />}
        </Field>
        <Field label="Formation" error="Choisissez une formation.">
          {(control) => (
            <Select name="formation" defaultValue="" {...control}>
              <option value="" disabled>
                Choisir…
              </option>
              <option value="web">Développement web</option>
              <option value="data">Analyse de données</option>
            </Select>
          )}
        </Field>
        <Field label="Curriculum vitæ" help="PDF, 2 Mo au plus.">
          {(control) => <FileInput name="cv" accept="application/pdf" {...control} />}
        </Field>
      </>,
    );
    const textarea = screen.getByRole("textbox", {
      name: "Message",
      description: "Quelques lignes suffisent.",
    });
    expect(textarea.getAttribute("rows")).toBe("4");
    await user.type(textarea, "Bonjour");
    expect((textarea as HTMLTextAreaElement).value).toBe("Bonjour");

    const select = screen.getByRole<HTMLSelectElement>("combobox", {
      name: "Formation",
      description: "Choisissez une formation.",
    });
    expect(select.getAttribute("aria-invalid")).toBe("true");
    await user.selectOptions(select, "data");
    expect(select.value).toBe("data");

    const file = screen.getByLabelText<HTMLInputElement>("Curriculum vitæ");
    expect(file.type).toBe("file");
    expect(file.getAttribute("aria-describedby")).toMatch(/-help$/);
  });
});

describe("Checkbox", () => {
  it("is named by its label, toggled by a click on it, and described by its help and error", async () => {
    const user = userEvent.setup();
    render(
      <Checkbox
        name="newsletter"
        label="Recevoir la lettre d’information"
        help="Une fois par mois."
        error="Cochez la case pour continuer."
      />,
    );
    const checkbox = screen.getByRole<HTMLInputElement>("checkbox", {
      name: "Recevoir la lettre d’information",
      description: "Une fois par mois. Cochez la case pour continuer.",
    });
    expect(checkbox.getAttribute("aria-invalid")).toBe("true");
    await user.click(screen.getByText("Recevoir la lettre d’information"));
    expect(checkbox.checked).toBe(true);
    await user.keyboard(" ");
    expect(checkbox.checked).toBe(false);
  });

  it("dims its label when disabled", () => {
    render(<Checkbox name="cgv" label="J’accepte les conditions" disabled />);
    expect(screen.getByRole("checkbox").matches(":disabled")).toBe(true);
    expect(screen.getByText("J’accepte les conditions").className).toContain("text-text-muted");
  });
});

describe("Fieldset", () => {
  it("is a group named by its legend and described by its help and error", () => {
    render(
      <Fieldset
        legend="Vos centres d’intérêt"
        requiredLabel="(obligatoire)"
        help="Plusieurs réponses possibles."
        error="Cochez au moins une case."
      >
        <Checkbox name="themes" value="web" label="Web" />
        <Checkbox name="themes" value="data" label="Données" />
      </Fieldset>,
    );
    const group = screen.getByRole("group", {
      name: "Vos centres d’intérêt (obligatoire)",
      description: "Plusieurs réponses possibles. Cochez au moins une case.",
    });
    expect(group.hasAttribute("aria-invalid")).toBe(false);
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
  });
});

describe("RadioGroup", () => {
  const OPTIONS = [
    { value: "oui", label: "Oui" },
    { value: "non", label: "Non", description: "Vous pourrez changer d’avis plus tard." },
  ];

  it("names each radio, describes the one with a description, and checks the default value", () => {
    render(
      <RadioGroup
        legend="Êtes-vous demandeur d’emploi ?"
        name="demandeur"
        options={OPTIONS}
        defaultValue="non"
        required
        requiredLabel="(obligatoire)"
      />,
    );
    screen.getByRole("group", { name: "Êtes-vous demandeur d’emploi ? (obligatoire)" });
    const yes = screen.getByRole<HTMLInputElement>("radio", { name: "Oui" });
    const no = screen.getByRole<HTMLInputElement>("radio", {
      name: "Non",
      description: "Vous pourrez changer d’avis plus tard.",
    });
    expect(no.checked).toBe(true);
    expect(yes.required && no.required).toBe(true);
    expect(yes.name).toBe("demandeur");
  });

  it("moves the selection with the arrow keys, like any native radio group", async () => {
    const user = userEvent.setup();
    render(<RadioGroup legend="Réponse" name="reponse" options={OPTIONS} defaultValue="oui" />);
    const yes = screen.getByRole<HTMLInputElement>("radio", { name: "Oui" });
    const no = screen.getByRole<HTMLInputElement>("radio", { name: "Non" });
    await user.tab();
    expect(document.activeElement).toBe(yes);
    await user.keyboard("{ArrowDown}");
    expect(no.checked).toBe(true);
    expect(document.activeElement).toBe(no);
  });

  it("disables every option with the group", () => {
    render(<RadioGroup legend="Réponse" name="reponse" options={OPTIONS} disabled />);
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio.matches(":disabled")).toBe(true);
    }
    expect(screen.getByText("Oui").className).toContain("text-text-muted");
  });
});

describe("ChoiceCards", () => {
  const FORMATS = [
    {
      value: "presentiel",
      label: "Présentiel",
      description: "Dans nos locaux, en petit groupe.",
      icon: Users,
    },
    { value: "distanciel", label: "À distance", description: "En classe virtuelle.", icon: Laptop },
  ];

  it("names each radio card by its title only and describes it with its description", async () => {
    const user = userEvent.setup();
    render(
      <ChoiceCards
        type="radio"
        legend="Format"
        name="format"
        options={FORMATS}
        required
        requiredLabel="(obligatoire)"
      />,
    );
    const onSite = screen.getByRole<HTMLInputElement>("radio", {
      name: "Présentiel",
      description: "Dans nos locaux, en petit groupe.",
    });
    expect(onSite.required).toBe(true);
    // A click anywhere on the card (here, its description) selects it.
    await user.click(screen.getByText("En classe virtuelle."));
    expect(screen.getByRole<HTMLInputElement>("radio", { name: "À distance" }).checked).toBe(true);
    expect(onSite.closest("label")?.className).toContain("has-checked:border-primary");
  });

  it("allows several answers as checkboxes, never required one by one", () => {
    render(
      <ChoiceCards
        type="checkbox"
        legend="Thèmes"
        name="themes"
        options={FORMATS}
        defaultValue={["presentiel", "distanciel"]}
        required
        requiredLabel="(obligatoire)"
        columns={3}
      />,
    );
    const boxes = screen.getAllByRole<HTMLInputElement>("checkbox");
    expect(boxes.map((box) => box.checked)).toEqual([true, true]);
    expect(boxes.some((box) => box.required)).toBe(false);
    screen.getByRole("group", { name: "Thèmes (obligatoire)" });
  });
});

describe("form components together", () => {
  it("have no axe violations, valid and invalid", async () => {
    const { container } = render(
      <form aria-label="Inscription">
        <Field
          label="Adresse e-mail"
          help={HELP}
          error={ERROR}
          required
          requiredLabel="(obligatoire)"
        >
          {(control) => <Input type="email" name="email" {...control} />}
        </Field>
        <Field label="Message">{(control) => <Textarea name="message" {...control} />}</Field>
        <Field label="Formation">
          {(control) => (
            <Select name="formation" {...control}>
              <option value="web">Développement web</option>
            </Select>
          )}
        </Field>
        <Field label="Pièce jointe" help="PDF uniquement.">
          {(control) => <FileInput name="piece" {...control} />}
        </Field>
        <Checkbox name="cgv" label="J’accepte les conditions" error="Obligatoire." />
        <RadioGroup
          legend="Réponse"
          name="reponse"
          options={[
            { value: "oui", label: "Oui" },
            { value: "non", label: "Non", description: "Plus tard." },
          ]}
          orientation="horizontal"
          error="Choisissez une réponse."
        />
        <ChoiceCards type="checkbox" legend="Thèmes" name="themes" options={FORMATS_FOR_AXE} />
      </form>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

const FORMATS_FOR_AXE = [
  { value: "web", label: "Web", description: "Sites et applications.", icon: Laptop },
  { value: "data", label: "Données" },
];
