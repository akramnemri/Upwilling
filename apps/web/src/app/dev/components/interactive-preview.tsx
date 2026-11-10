import {
  Accordion,
  Breadcrumbs,
  Button,
  Chip,
  Dialog,
  Grid,
  Heading,
  Stack,
  Tabs,
  Text,
} from "@upwilling/design-system/react";

import { PreviewSection } from "./preview-section";

// Interactive components of the preview (Task 2.2c). Synthetic copy. A Server Component: only the
// Dialog (showModal) and the Radix tab parts run in the browser.

const QUESTIONS = [
  {
    value: "duree",
    title: "Combien de temps dure une formation ?",
    content: <Text>De quatre à douze semaines, selon le parcours choisi.</Text>,
  },
  {
    value: "financement",
    title: "Comment financer ma formation ?",
    content: <Text>Plusieurs aides existent : nous étudions votre situation avec vous.</Text>,
  },
  {
    value: "prerequis",
    title: "Faut-il des connaissances préalables ?",
    content: <Text>Non pour les parcours débutants ; un test de niveau oriente les autres.</Text>,
  },
] as const;

const PROGRAMME = [
  {
    value: "module-1",
    title: "Module 1 — Les bases du web",
    content: <Text>HTML, CSS et accessibilité des pages.</Text>,
  },
  {
    value: "module-2",
    title: "Module 2 — JavaScript",
    content: <Text>Le langage, le navigateur et les formulaires.</Text>,
  },
] as const;

const DOMAINS = [
  {
    value: "web",
    label: "Web",
    content: (
      <Stack gap="3" align="start">
        <Text>Concevoir et publier des sites et des applications.</Text>
        <Stack direction="row" gap="2" wrap>
          <Chip>HTML et CSS</Chip>
          <Chip>TypeScript</Chip>
        </Stack>
      </Stack>
    ),
  },
  {
    value: "donnees",
    label: "Données",
    content: (
      <Stack gap="3" align="start">
        <Text>Nettoyer, analyser et présenter des données.</Text>
        <Stack direction="row" gap="2" wrap>
          <Chip>Tableurs</Chip>
          <Chip>SQL</Chip>
        </Stack>
      </Stack>
    ),
  },
  {
    value: "cyber",
    label: "Cybersécurité",
    content: (
      <Stack gap="3" align="start">
        <Text>Comprendre les attaques courantes et s’en protéger.</Text>
        <Stack direction="row" gap="2" wrap>
          <Chip>Réseaux</Chip>
          <Chip>Bonnes pratiques</Chip>
        </Stack>
      </Stack>
    ),
  },
] as const;

/** Every interactive component of Task 2.2c. */
export function InteractivePreview() {
  return (
    <>
      <PreviewSection id="accordeon" title="Accordéon" background="muted">
        <Grid columns={2}>
          <Stack gap="3">
            <Heading level={3} size="lg">
              Une réponse à la fois
            </Heading>
            <Accordion items={QUESTIONS} exclusive defaultOpen={["duree"]} />
          </Stack>
          <Stack gap="3">
            <Heading level={3} size="lg">
              Panneaux indépendants
            </Heading>
            <Accordion items={PROGRAMME} />
          </Stack>
        </Grid>
      </PreviewSection>

      <PreviewSection id="onglets" title="Onglets">
        <Tabs label="Domaines de formation" items={DOMAINS} />
      </PreviewSection>

      <PreviewSection id="dialogue" title="Boîte de dialogue" background="muted">
        <Stack gap="3" align="start">
          <Text tone="muted">
            Échap ferme la boîte ; le focus revient sur le bouton qui l’a ouverte.
          </Text>
          <Dialog
            triggerLabel="Voir le programme"
            title="Programme de la formation"
            description="Douze semaines, trois modules, un projet final."
            closeLabel="Fermer"
            footer={
              <form method="dialog">
                <Button type="submit">J’ai compris</Button>
              </form>
            }
          >
            <Text>
              Chaque module se termine par un atelier pratique. Le projet final est présenté devant
              un jury de professionnels.
            </Text>
          </Dialog>
        </Stack>
      </PreviewSection>

      <PreviewSection id="fil-ariane" title="Fil d’Ariane">
        <Breadcrumbs
          label="Fil d’Ariane"
          items={[
            { label: "Accueil", href: "/" },
            { label: "Formations", href: "/dev/components" },
          ]}
          current="Développement web"
        />
      </PreviewSection>
    </>
  );
}
