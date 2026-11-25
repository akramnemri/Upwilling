import {
  AnnouncementPill,
  AudienceTracks,
  Button,
  ButtonLink,
  CatalogueGrid,
  type CatalogueItem,
  ChoiceCards,
  Chip,
  ContactCta,
  DocumentList,
  FaqAccordion,
  FeatureBento,
  Field,
  Hero,
  HeroPanel,
  Input,
  LogoStrip,
  NewsGrid,
  PainPoints,
  PricingTiers,
  ProcessSteps,
  RichTextSection,
  StatsBand,
  Testimonials,
  Textarea,
} from "@upwilling/design-system/react";
import {
  BookOpen,
  CalendarCheck,
  CircleCheck,
  Clock,
  Compass,
  Cpu,
  FlaskConical,
  GitBranch,
  GraduationCap,
  HandHeart,
  LifeBuoy,
  MessageCircleQuestion,
  Puzzle,
  Terminal,
  Users,
} from "lucide-react";

// Demo home pages for the PO design review (Task 2.5c), one per brand, composed from the section
// patterns in the order of 04_DESIGN_SYSTEM.md §5. Every word is a synthetic placeholder and says
// so; the real copy comes from the CMS (Milestone 5). Section ids match the header's anchors
// (SITE_CHROME), so its links land on them.

const EXAMPLE_TEXT = "Texte d’exemple : le contenu réel viendra du CMS.";

/** The contact form, without an action: sending arrives with Task 5.4. */
function DemoContactForm({ subjects }: Readonly<{ subjects: readonly string[] }>) {
  return (
    <div className="flex flex-col gap-6">
      <ChoiceCards
        type="radio"
        name="sujet"
        legend="Votre demande"
        options={subjects.map((label, index) => ({ value: `sujet-${index + 1}`, label }))}
        defaultValue="sujet-1"
      />
      <Field label="Adresse e-mail" required requiredLabel="(obligatoire)">
        {(control) => <Input type="email" name="email" autoComplete="email" {...control} />}
      </Field>
      <Field label="Message" help="Formulaire d’exemple : l’envoi arrive avec la tâche 5.4.">
        {(control) => <Textarea name="message" rows={4} {...control} />}
      </Field>
      <Button>Envoyer (exemple)</Button>
    </div>
  );
}

const FAQ = [1, 2, 3, 4].map((index) => ({
  question: `Question d’exemple ${index} ?`,
  answer: `Réponse d’exemple ${index}, en une ou deux phrases. ${EXAMPLE_TEXT}`,
}));

const CONTACT_STEPS = [
  { title: "Nous lisons votre message", text: "Étape d’exemple : une première réponse rapide." },
  { title: "Nous en parlons ensemble", text: "Étape d’exemple : un échange pour préciser." },
  { title: "Vous recevez une proposition", text: "Étape d’exemple : une réponse écrite." },
];

function trainings(prefix: string): CatalogueItem[] {
  return [1, 2, 3].map((index) => ({
    title: `Formation d’exemple ${prefix}${index}`,
    href: `#formations`,
    summary: "Deux lignes d’exemple qui résument ce que la formation apporte.",
    badge: ["Débutant", "Intermédiaire", "Avancé"][index - 1] ?? "Débutant",
    chips: ["Thème A", "Thème B"],
    facts: [`${index + 1} jours`, index === 2 ? "En ligne" : "Présentiel"],
    price: index === 3 ? "Sur devis" : "Prix d’exemple",
  }));
}

/** The academy's home page (04 §5): announcement, hero, tech strip, pain points, two tracks,
 * catalogue preview, why us, process, formats, testimonials, FAQ, contact. */
export function AcademyDemo() {
  return (
    <>
      <Hero
        announcement={
          <AnnouncementPill tag="Nouveau" href="#formations">
            Session d’exemple ouverte aux inscriptions
          </AnnouncementPill>
        }
        title="Une promesse d’exemple, sur deux lignes"
        lead={`Un paragraphe d’exemple qui explique l’offre en une ou deux phrases. ${EXAMPLE_TEXT}`}
        actions={
          <>
            <ButtonLink href="#contact">Demander un devis</ButtonLink>
            <ButtonLink href="#formations" variant="secondary">
              Voir les formations
            </ButtonLink>
          </>
        }
        highlights={["Point de confiance A", "Point de confiance B", "Point de confiance C"]}
        visual={
          <HeroPanel
            label="Illustration d’exemple : une console avec deux cartes de statut"
            windowTitle="atelier-exemple — module 3"
            lines={[
              "$ make build",
              "Compilation de l’exemple… ok",
              "$ ./lancer --carte demo",
              "Prêt.",
            ]}
            cards={[
              { icon: CalendarCheck, title: "Session d’exemple", detail: "8 places (fictif)" },
              { icon: CircleCheck, title: "Module 3 terminé", detail: "Progression fictive" },
            ]}
          />
        }
      />
      <LogoStrip
        title="Technologies abordées (exemple)"
        hideTitle
        background="muted"
        pauseLabel="Mettre en pause le défilement"
        items={[
          { label: "Linux", icon: Terminal },
          { label: "C" },
          { label: "Yocto" },
          { label: "RTOS", icon: Cpu },
          { label: "Git", icon: GitBranch },
          { label: "Bash" },
        ]}
      />
      <PainPoints
        background="surface"
        eyebrow="Ça vous parle ?"
        title="Des situations d’exemple que le visiteur reconnaît"
        items={[
          { icon: Compass, title: "Situation d’exemple 1", text: EXAMPLE_TEXT },
          { icon: Clock, title: "Situation d’exemple 2", text: EXAMPLE_TEXT },
          { icon: Puzzle, title: "Situation d’exemple 3", text: EXAMPLE_TEXT },
          { icon: MessageCircleQuestion, title: "Situation d’exemple 4", text: EXAMPLE_TEXT },
        ]}
      />
      <AudienceTracks
        background="muted"
        eyebrow="Deux formats"
        title="E-learning ou sessions en direct (exemple)"
        tracks={[
          {
            label: "En ligne",
            title: "Parcours d’exemple en ligne",
            text: EXAMPLE_TEXT,
            points: ["Avantage d’exemple 1", "Avantage d’exemple 2", "Avantage d’exemple 3"],
            action: (
              <ButtonLink href="#formations" variant="secondary">
                Voir les parcours en ligne
              </ButtonLink>
            ),
          },
          {
            label: "En présentiel",
            title: "Sessions d’exemple inter et intra",
            text: EXAMPLE_TEXT,
            points: ["Avantage d’exemple 1", "Avantage d’exemple 2", "Avantage d’exemple 3"],
            action: (
              <ButtonLink href="#contact" variant="secondary">
                Demander une session
              </ButtonLink>
            ),
          },
        ]}
      />
      <CatalogueGrid
        id="formations"
        eyebrow="Catalogue"
        title="Des formations d’exemple"
        lead={EXAMPLE_TEXT}
        tabsLabel="Domaines de formation"
        categories={[
          { value: "toutes", label: "Toutes", items: [...trainings("A"), ...trainings("B")] },
          { value: "domaine-a", label: "Domaine A", items: trainings("A") },
          { value: "domaine-b", label: "Domaine B", items: trainings("B") },
        ]}
      />
      <FeatureBento
        background="muted"
        eyebrow="Pourquoi nous"
        title="Des avantages concrets (exemple)"
        items={[
          {
            icon: Users,
            title: "Avantage d’exemple 1",
            text: EXAMPLE_TEXT,
            size: "wide",
            visual: (
              <div className="flex flex-wrap gap-2">
                <Chip>Compétence A</Chip>
                <Chip>Compétence B</Chip>
              </div>
            ),
          },
          { icon: FlaskConical, title: "Avantage d’exemple 2", text: EXAMPLE_TEXT },
          { icon: GraduationCap, title: "Avantage d’exemple 3", text: EXAMPLE_TEXT },
          { icon: LifeBuoy, title: "Avantage d’exemple 4", text: EXAMPLE_TEXT, size: "wide" },
        ]}
      />
      <ProcessSteps
        id="methode"
        background="surface"
        eyebrow="Méthode"
        title="Une demande de formation, étape par étape (exemple)"
        deliverableLabel="Livrable :"
        steps={[
          { title: "Étape d’exemple 1", text: EXAMPLE_TEXT, deliverable: "Livrable d’exemple" },
          { title: "Étape d’exemple 2", text: EXAMPLE_TEXT, deliverable: "Livrable d’exemple" },
          { title: "Étape d’exemple 3", text: EXAMPLE_TEXT, deliverable: "Livrable d’exemple" },
          { title: "Étape d’exemple 4", text: EXAMPLE_TEXT, deliverable: "Livrable d’exemple" },
        ]}
      />
      <PricingTiers
        id="tarifs"
        eyebrow="Formats et tarifs"
        title="Des formules d’exemple"
        highlightLabel="Le plus choisi"
        note="Tarifs d’exemple, sans valeur réelle."
        tiers={[
          {
            name: "Formule d’exemple A",
            price: "00 €",
            period: "par personne",
            features: ["Avantage d’exemple 1", "Avantage d’exemple 2"],
            action: (
              <ButtonLink href="#contact" variant="secondary">
                Choisir A
              </ButtonLink>
            ),
          },
          {
            name: "Formule d’exemple B",
            price: "00 €",
            period: "par personne",
            features: ["Avantage d’exemple 1", "Avantage d’exemple 2", "Avantage d’exemple 3"],
            action: <ButtonLink href="#contact">Choisir B</ButtonLink>,
            highlighted: true,
          },
          {
            name: "Formule d’exemple C",
            price: "Sur devis",
            features: ["Avantage d’exemple 1", "Avantage d’exemple 4"],
            action: (
              <ButtonLink href="#contact" variant="secondary">
                Demander un devis
              </ButtonLink>
            ),
          },
        ]}
      />
      <Testimonials
        eyebrow="Témoignages"
        title="Ils en parlent (exemple)"
        note="Témoignages fictifs, pour l’exemple."
        items={[
          {
            quote: "Une citation d’exemple sur la formation.",
            name: "Prénom A.",
            role: "Rôle d’exemple",
          },
          { quote: "Une autre citation d’exemple.", name: "Prénom B.", role: "Rôle d’exemple" },
          { quote: "Une citation d’exemple, plus courte.", name: "Prénom C." },
        ]}
      />
      <FaqAccordion
        id="faq"
        background="muted"
        eyebrow="Questions fréquentes"
        title="Vos questions (exemple)"
        items={FAQ}
      />
      <ContactCta
        id="contact"
        background="surface"
        eyebrow="Contact"
        title="Parlons de votre projet (exemple)"
        lead={EXAMPLE_TEXT}
        stepsTitle="Et ensuite ?"
        steps={CONTACT_STEPS}
        form={<DemoContactForm subjects={["Une information", "Un devis intra-entreprise"]} />}
      />
    </>
  );
}

/** The association's home page (04 §5): mission, figures, actions and news, ways to get involved,
 * membership tiers, FAQ, contact; then two parts of the future "about" page (documents). */
export function CareerBoostDemo() {
  return (
    <>
      <Hero
        title="Une mission d’exemple, écrite sur deux lignes"
        lead={`Un paragraphe d’exemple sur la mission de l’association. ${EXAMPLE_TEXT}`}
        actions={
          <>
            <ButtonLink href="#adherer">Adhérer</ButtonLink>
            <ButtonLink href="#association" variant="secondary">
              Découvrir l’association
            </ButtonLink>
          </>
        }
      />
      <StatsBand
        title="L’association en chiffres (exemple)"
        note="Chiffres d’exemple, sans valeur réelle."
        items={[
          { value: "000", label: "Chiffre d’exemple A" },
          { value: "00", label: "Chiffre d’exemple B" },
          { value: "00", label: "Chiffre d’exemple C" },
        ]}
      />
      <RichTextSection id="association" eyebrow="L’association" title="Notre mission (exemple)">
        <p>
          Un premier paragraphe d’exemple sur la mission de l’association, assez long pour passer
          sur plusieurs lignes. {EXAMPLE_TEXT}
        </p>
        <ul>
          <li>Engagement d’exemple 1</li>
          <li>Engagement d’exemple 2</li>
          <li>Engagement d’exemple 3</li>
        </ul>
      </RichTextSection>
      <FeatureBento
        id="actions"
        background="muted"
        eyebrow="Nos actions"
        title="Ce que fait l’association (exemple)"
        items={[
          { icon: Users, title: "Action d’exemple 1", text: EXAMPLE_TEXT, size: "wide" },
          { icon: BookOpen, title: "Action d’exemple 2", text: EXAMPLE_TEXT },
          { icon: HandHeart, title: "Action d’exemple 3", text: EXAMPLE_TEXT },
          { icon: CalendarCheck, title: "Action d’exemple 4", text: EXAMPLE_TEXT, size: "wide" },
        ]}
      />
      <NewsGrid
        id="actualites"
        eyebrow="Actualités"
        title="Les dernières nouvelles (exemple)"
        items={[1, 2, 3].map((index) => ({
          title: `Actualité d’exemple ${index}`,
          href: "#actualites",
          date: `${index} mars 2027`,
          dateTime: `2027-03-0${index}`,
          excerpt: "Deux lignes d’exemple qui résument l’actualité.",
          ...(index === 1 ? { tag: "Événement" } : {}),
        }))}
      />
      <AudienceTracks
        background="muted"
        eyebrow="Nous rejoindre"
        title="Trois façons d’agir (exemple)"
        tracks={[
          {
            title: "Devenir membre",
            text: EXAMPLE_TEXT,
            points: ["Avantage d’exemple 1", "Avantage d’exemple 2"],
            action: <ButtonLink href="#adherer">Adhérer</ButtonLink>,
          },
          {
            title: "Faire un don",
            text: EXAMPLE_TEXT,
            points: ["Avantage d’exemple 1", "Avantage d’exemple 2"],
            action: (
              <ButtonLink href="#contact" variant="secondary">
                Donner (exemple)
              </ButtonLink>
            ),
          },
          {
            title: "Devenir bénévole",
            text: EXAMPLE_TEXT,
            points: ["Avantage d’exemple 1", "Avantage d’exemple 2"],
            action: (
              <ButtonLink href="#contact" variant="secondary">
                Proposer mon aide
              </ButtonLink>
            ),
          },
        ]}
      />
      <PricingTiers
        id="adherer"
        background="surface"
        eyebrow="Adhésion"
        title="Des cotisations d’exemple"
        highlightLabel="Le plus choisi"
        note="Montants d’exemple : les montants réels sont une décision du PO (CB-02)."
        tiers={[
          {
            name: "Catégorie d’exemple A",
            price: "00 €",
            period: "par an",
            features: ["Avantage d’exemple 1", "Avantage d’exemple 2"],
            action: (
              <ButtonLink href="#contact" variant="secondary">
                Choisir A
              </ButtonLink>
            ),
          },
          {
            name: "Catégorie d’exemple B",
            price: "00 €",
            period: "par an",
            features: ["Avantage d’exemple 1", "Avantage d’exemple 2", "Avantage d’exemple 3"],
            action: <ButtonLink href="#contact">Choisir B</ButtonLink>,
            highlighted: true,
          },
        ]}
      />
      <FaqAccordion
        id="faq"
        background="muted"
        eyebrow="Questions fréquentes"
        title="Vos questions (exemple)"
        items={FAQ}
      />
      <DocumentList
        id="documents"
        eyebrow="Transparence"
        title="Documents officiels (exemple)"
        lead="Partie d’exemple de la future page « À propos » (CB-08)."
        items={[
          { title: "Document d’exemple 1", href: "#documents", format: "PDF", size: "240 Ko" },
          { title: "Document d’exemple 2", href: "#documents", format: "PDF", size: "1,2 Mo" },
        ]}
      />
      <ContactCta
        id="contact"
        eyebrow="Contact"
        title="Écrivez-nous (exemple)"
        lead={EXAMPLE_TEXT}
        stepsTitle="Et ensuite ?"
        steps={CONTACT_STEPS}
        form={<DemoContactForm subjects={["Une question", "Devenir bénévole"]} />}
      />
    </>
  );
}
