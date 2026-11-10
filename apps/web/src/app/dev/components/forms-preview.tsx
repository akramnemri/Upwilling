import {
  Alert,
  ButtonLink,
  Checkbox,
  ChoiceCards,
  EmptyState,
  Field,
  Fieldset,
  FileInput,
  Grid,
  Input,
  RadioGroup,
  Select,
  Stack,
  Text,
  Textarea,
} from "@upwilling/design-system/react";
import { Building2, CalendarX, Laptop, Users } from "lucide-react";

import { PendingFormDemo } from "./pending-form-demo";
import { PreviewSection } from "./preview-section";

// Form components of the preview (Task 2.2b). Synthetic copy. The fields are not inside a form (only
// the pending demo is), so nothing here can be submitted.

const REQUIRED = "(obligatoire)";

/** Every form and feedback component of Task 2.2b, valid and invalid. */
export function FormsPreview() {
  return (
    <>
      <PreviewSection id="champs" title="Champs de formulaire" background="muted">
        <Grid columns={2}>
          <Field label="Nom complet" required requiredLabel={REQUIRED}>
            {(control) => <Input name="nom" autoComplete="name" {...control} />}
          </Field>
          <Field
            label="Adresse e-mail"
            help="Nous vous répondrons à cette adresse."
            required
            requiredLabel={REQUIRED}
          >
            {(control) => <Input type="email" name="email" autoComplete="email" {...control} />}
          </Field>
          <Field label="Code postal" error="Le code postal doit contenir cinq chiffres.">
            {(control) => (
              <Input
                name="code-postal"
                inputMode="numeric"
                autoComplete="postal-code"
                defaultValue="750"
                {...control}
              />
            )}
          </Field>
          <Field label="Identifiant" help="Attribué automatiquement.">
            {(control) => <Input name="identifiant" defaultValue="UW-0042" disabled {...control} />}
          </Field>
          <Field label="Formation souhaitée">
            {(control) => (
              <Select name="formation" defaultValue="" {...control}>
                <option value="" disabled>
                  Choisir une formation
                </option>
                <option value="web">Développement web</option>
                <option value="donnees">Analyse de données</option>
                <option value="cyber">Cybersécurité</option>
              </Select>
            )}
          </Field>
          <Field label="Curriculum vitæ" help="Format PDF, 2 Mo au plus.">
            {(control) => <FileInput name="cv" accept=".pdf,application/pdf" {...control} />}
          </Field>
          <Field
            label="Votre message"
            help="Quelques lignes sur votre projet suffisent."
            className="md:col-span-2"
          >
            {(control) => <Textarea name="message" {...control} />}
          </Field>
        </Grid>
      </PreviewSection>

      <PreviewSection id="choix" title="Cases, boutons radio et cartes de choix">
        <Stack gap="8">
          <ChoiceCards
            type="radio"
            legend="Format de la formation"
            name="format"
            required
            requiredLabel={REQUIRED}
            columns={3}
            options={[
              {
                value: "presentiel",
                label: "Présentiel",
                description: "Dans nos locaux, en petit groupe.",
                icon: Users,
              },
              {
                value: "distanciel",
                label: "À distance",
                description: "En classe virtuelle, aux mêmes horaires.",
                icon: Laptop,
              },
              {
                value: "entreprise",
                label: "En entreprise",
                description: "Une session pour votre équipe (bientôt disponible).",
                icon: Building2,
                disabled: true,
              },
            ]}
          />
          <ChoiceCards
            type="checkbox"
            legend="Thèmes qui vous intéressent"
            name="themes"
            help="Plusieurs réponses possibles."
            defaultValue={["web"]}
            options={[
              { value: "web", label: "Développement web" },
              { value: "donnees", label: "Données" },
              { value: "cyber", label: "Cybersécurité" },
              { value: "projet", label: "Gestion de projet" },
            ]}
          />
          <Grid columns={2}>
            <RadioGroup
              legend="Êtes-vous demandeur d’emploi ?"
              name="demandeur"
              orientation="horizontal"
              required
              requiredLabel={REQUIRED}
              options={[
                { value: "oui", label: "Oui" },
                { value: "non", label: "Non" },
              ]}
            />
            <RadioGroup
              legend="Votre niveau"
              name="niveau"
              error="Choisissez votre niveau."
              options={[
                { value: "debutant", label: "Débutant", description: "Je découvre le sujet." },
                {
                  value: "intermediaire",
                  label: "Intermédiaire",
                  description: "J’ai déjà pratiqué.",
                },
                { value: "avance", label: "Avancé", description: "Je pratique au quotidien." },
              ]}
            />
            <Fieldset legend="Vos disponibilités" help="Cochez tout ce qui vous convient.">
              <Checkbox name="disponibilites" value="semaine" label="En semaine" />
              <Checkbox name="disponibilites" value="soir" label="Le soir" />
              <Checkbox
                name="disponibilites"
                value="weekend"
                label="Le week-end (complet)"
                disabled
              />
            </Fieldset>
            <Stack gap="4">
              <Checkbox
                name="lettre"
                label="Recevoir la lettre d’information"
                help="Une fois par mois, désinscription en un clic."
              />
              <Checkbox
                name="conditions"
                label="J’accepte les conditions générales"
                error="Cochez la case pour continuer."
              />
            </Stack>
          </Grid>
        </Stack>
      </PreviewSection>

      <PreviewSection id="messages" title="Messages et état vide" background="muted">
        <Stack gap="4">
          <Alert title="Information">Les inscriptions ferment le 15 du mois.</Alert>
          <Alert tone="success" title="Inscription confirmée">
            Un e-mail de confirmation vous a été envoyé.
          </Alert>
          <Alert tone="warning" title="Dernières places">
            Plus que trois places sur cette session.
          </Alert>
          <Alert tone="danger" title="Le formulaire contient 2 erreurs" titleLevel={3}>
            <ul className="list-disc pl-6">
              <li>Le code postal doit contenir cinq chiffres.</li>
              <li>Choisissez votre niveau.</li>
            </ul>
          </Alert>
          <EmptyState
            icon={CalendarX}
            title="Aucune session programmée"
            titleLevel={3}
            description="Aucune session n’est ouverte pour le moment. Laissez-nous vos coordonnées pour être prévenu."
            action={<ButtonLink href="/dev/tokens">Être prévenu</ButtonLink>}
          />
        </Stack>
      </PreviewSection>

      <PreviewSection id="envoi" title="Envoi d’un formulaire">
        <Stack gap="4">
          <Text tone="muted">
            L’envoi dure 1,5 seconde : le bouton garde le focus, refuse un second envoi et un
            message « Envoi en cours » est annoncé aux lecteurs d’écran.
          </Text>
          <PendingFormDemo />
        </Stack>
      </PreviewSection>
    </>
  );
}
