import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "../actions.tsx";
import { ChoiceCards } from "../choices.tsx";
import { Field, Input, Textarea } from "../forms.tsx";
import { ContactCta } from "../sections.tsx";

// The form is the app's (its action comes with Task 5.4); this story only shows the layout.
function ExampleForm() {
  return (
    <div className="flex flex-col gap-6">
      <ChoiceCards
        type="radio"
        name="sujet"
        legend="Votre demande"
        options={[
          { value: "information", label: "Une information" },
          { value: "devis", label: "Un devis" },
        ]}
        defaultValue="information"
      />
      <Field label="Adresse e-mail" required requiredLabel="(obligatoire)">
        {(control) => <Input type="email" name="email" autoComplete="email" {...control} />}
      </Field>
      <Field label="Message" help="Quelques lignes suffisent.">
        {(control) => <Textarea name="message" rows={4} {...control} />}
      </Field>
      <Button>Envoyer (exemple)</Button>
    </div>
  );
}

const meta = {
  title: "Sections/ContactCta",
  component: ContactCta,
  parameters: { layout: "fullscreen" },
  args: {
    eyebrow: "Contact",
    title: "Parlons de votre projet (exemple)",
    lead: "Texte d’exemple : une réponse rapide, sans engagement.",
    stepsTitle: "Et ensuite ?",
    steps: [
      { title: "Étape d’exemple 1", text: "Ce qui se passe après l’envoi." },
      { title: "Étape d’exemple 2", text: "Ce qui se passe ensuite." },
      { title: "Étape d’exemple 3", text: "Ce que vous recevez à la fin." },
    ],
    form: <ExampleForm />,
  },
} satisfies Meta<typeof ContactCta>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** Phone width: steps first, then the form. */
export const Mobile: Story = {
  globals: { viewport: { value: "mobile2", isRotated: false } },
  tags: ["visual-mobile"],
};
