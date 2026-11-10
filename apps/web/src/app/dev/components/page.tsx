import {
  AnnouncementPill,
  Badge,
  Button,
  ButtonLink,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardMedia,
  Chip,
  Container,
  Eyebrow,
  Grid,
  Heading,
  Link,
  Section,
  Skeleton,
  Spinner,
  Stack,
  Text,
} from "@upwilling/design-system/react";
import { ArrowRight, Code, Download, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getEnv } from "../../../lib/env";
import { FormsPreview } from "./forms-preview";
import { PreviewSection } from "./preview-section";

// Rendered per request: the brand comes from the Host header (root layout), and at build time there is
// no DEPLOY_ENV to check.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Aperçu des composants" };

/**
 * Component preview (Tasks 2.2a, 2.2b): every component of @upwilling/design-system/react in the brand
 * of the current host, for the keyboard walkthrough. Synthetic copy. Local and recette only; the route
 * rules also refuse /dev in production.
 */
export default function ComponentPreviewPage() {
  if (getEnv().DEPLOY_ENV === "production") {
    notFound();
  }

  return (
    <main>
      <Section spacing="sm" aria-labelledby="apercu">
        <Container>
          <Stack gap="3">
            <Eyebrow>Design system · tâches 2.2a et 2.2b</Eyebrow>
            <Heading level={1} id="apercu" tone="primary">
              Aperçu des composants
            </Heading>
            <Text tone="muted">
              Parcourez la page au clavier (Tab, Maj+Tab, Entrée, Espace) : chaque élément
              interactif montre un contour de focus visible. Les jetons sont sur{" "}
              <Link href="/dev/tokens">l’aperçu des jetons</Link>.
            </Text>
          </Stack>
        </Container>
      </Section>

      <PreviewSection id="typographie" title="Typographie">
        <Stack gap="4">
          <Eyebrow>Sur-titre</Eyebrow>
          <Heading level={3} size="5xl">
            Titre 5xl
          </Heading>
          <Heading level={3} size="3xl">
            Titre 3xl
          </Heading>
          <Heading level={3} size="xl">
            Titre xl
          </Heading>
          <Text size="lg">Texte lg : apprendre un métier du numérique, à son rythme.</Text>
          <Text>Texte md : des formations courtes, concrètes et accompagnées.</Text>
          <Text size="sm" tone="muted">
            Texte sm atténué : informations complémentaires.
          </Text>
          <Text tone="primary" weight="semibold">
            Texte de couleur principale, semi-gras.
          </Text>
        </Stack>
      </PreviewSection>

      <PreviewSection id="boutons" title="Boutons" background="muted">
        <Stack gap="6">
          <Stack direction="row" gap="3" align="center" wrap>
            <Button>Principal</Button>
            <Button variant="secondary">Secondaire</Button>
            <Button variant="ghost">Discret</Button>
            <Button variant="link">Lien</Button>
          </Stack>
          <Stack direction="row" gap="3" align="center" wrap>
            <Button size="sm">Petit</Button>
            <Button size="md">Moyen</Button>
            <Button size="lg">Grand</Button>
          </Stack>
          <Stack direction="row" gap="3" align="center" wrap>
            <Button icon={Download}>Télécharger le programme</Button>
            <Button variant="secondary" icon={ArrowRight} iconPosition="end">
              Continuer
            </Button>
            <Button disabled>Indisponible</Button>
            <Button loading loadingLabel="(envoi en cours)">
              Envoyer
            </Button>
          </Stack>
        </Stack>
      </PreviewSection>

      <PreviewSection id="etiquettes" title="Badges, puces et annonce">
        <Stack gap="4">
          <Stack direction="row" gap="2" wrap>
            <Badge>Neutre</Badge>
            <Badge tone="primary">Nouveau</Badge>
            <Badge tone="success">Inscriptions ouvertes</Badge>
            <Badge tone="warning">Dernières places</Badge>
            <Badge tone="danger">Complet</Badge>
            <Badge tone="info">En ligne</Badge>
          </Stack>
          <Stack direction="row" gap="2" wrap>
            <Chip icon={Code}>TypeScript</Chip>
            <Chip icon={ShieldCheck}>Cybersécurité</Chip>
            <Chip>Gestion de projet</Chip>
          </Stack>
          <Stack align="start" gap="2">
            <AnnouncementPill tag="Nouveau" href="/dev/tokens">
              Les sessions de printemps sont ouvertes
            </AnnouncementPill>
            <AnnouncementPill>Annonce sans lien</AnnouncementPill>
          </Stack>
        </Stack>
      </PreviewSection>

      <PreviewSection id="liens" title="Liens" background="muted">
        <Stack gap="4">
          <Text>
            Un lien interne vers <Link href="/dev/tokens">les jetons de design</Link>, et un lien
            externe vers{" "}
            <Link href="https://example.com" newTab newTabLabel="(nouvel onglet)">
              un site d’exemple
            </Link>
            .
          </Text>
          <Stack direction="row" gap="3" wrap>
            <ButtonLink href="/dev/tokens">Voir les jetons</ButtonLink>
            <ButtonLink href="/dev/tokens" variant="secondary" icon={ArrowRight} iconPosition="end">
              Lien en bouton secondaire
            </ButtonLink>
          </Stack>
        </Stack>
      </PreviewSection>

      <PreviewSection id="cartes" title="Cartes">
        <Grid as="ul" columns={3}>
          {SAMPLE_COURSES.map((course) => (
            <Card as="li" key={course.title} aria-labelledby={course.id}>
              <CardMedia>
                <Skeleton shape="block" />
              </CardMedia>
              <CardHeader>
                <Badge tone={course.badgeTone}>{course.level}</Badge>
                <Heading level={3} size="xl" id={course.id}>
                  {course.title}
                </Heading>
              </CardHeader>
              <CardBody>
                <Text tone="muted">{course.summary}</Text>
              </CardBody>
              <CardFooter>
                <ButtonLink href="/dev/tokens" variant="link" size="sm">
                  En savoir plus<span className="sr-only"> sur {course.title}</span>
                </ButtonLink>
              </CardFooter>
            </Card>
          ))}
        </Grid>
      </PreviewSection>

      <PreviewSection id="chargement" title="Chargement" background="muted">
        <Grid columns={2}>
          <Stack gap="3" align="start">
            <Spinner label="Chargement des formations" size="lg" />
            <Text size="sm" tone="muted">
              L’indicateur annonce son texte aux lecteurs d’écran et s’arrête si les animations sont
              réduites.
            </Text>
          </Stack>
          <Stack gap="3">
            <Stack direction="row" gap="3" align="center">
              <Skeleton shape="avatar" />
              <Skeleton shape="title" />
            </Stack>
            <Skeleton lines={3} />
          </Stack>
        </Grid>
      </PreviewSection>

      <PreviewSection id="fonds" title="Fonds de section">
        <Grid columns={3}>
          {(["surface", "muted", "primary"] as const).map((background) => (
            <Section
              key={background}
              as="div"
              background={background}
              spacing="sm"
              className="rounded-lg px-6"
            >
              <Stack gap="3" align="start">
                <Eyebrow tone={background === "primary" ? "inherit" : "primary"}>
                  Fond {background}
                </Eyebrow>
                <Text>Le texte prend la couleur lisible sur ce fond.</Text>
                <Button variant="secondary" size="sm">
                  Action
                </Button>
              </Stack>
            </Section>
          ))}
        </Grid>
      </PreviewSection>

      <FormsPreview />
    </main>
  );
}

const SAMPLE_COURSES = [
  {
    id: "carte-web",
    title: "Développement web",
    level: "Débutant",
    badgeTone: "success",
    summary: "Douze semaines pour construire ses premiers sites, du HTML au déploiement.",
  },
  {
    id: "carte-donnees",
    title: "Analyse de données",
    level: "Intermédiaire",
    badgeTone: "info",
    summary: "Nettoyer, explorer et présenter des données avec des outils ouverts.",
  },
  {
    id: "carte-cyber",
    title: "Cybersécurité",
    level: "Avancé",
    badgeTone: "warning",
    summary: "Comprendre les attaques courantes et protéger un système d’information.",
  },
] as const;
