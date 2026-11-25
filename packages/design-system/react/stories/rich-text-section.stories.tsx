import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RichTextSection } from "../sections.tsx";

// The children stand for the CMS's rich text rendered by the app: plain elements, no classes.
const meta = {
  title: "Sections/RichTextSection",
  component: RichTextSection,
  parameters: { layout: "fullscreen" },
  args: {
    eyebrow: "L’association",
    title: "Notre mission (exemple)",
    children: (
      <>
        <p>
          Un premier paragraphe d’exemple, assez long pour passer sur plusieurs lignes et montrer
          l’interligne du texte courant. Le contenu réel viendra du CMS.
        </p>
        <h3>Un intertitre d’exemple</h3>
        <p>
          Un paragraphe avec un <a href="#lien">lien d’exemple</a> et un passage en{" "}
          <strong>gras</strong>.
        </p>
        <ul>
          <li>Premier point d’exemple</li>
          <li>Deuxième point d’exemple</li>
          <li>Troisième point d’exemple</li>
        </ul>
        <blockquote>
          <p>Une citation d’exemple, mise en retrait.</p>
        </blockquote>
        <ol>
          <li>Première étape d’exemple</li>
          <li>Deuxième étape d’exemple</li>
        </ol>
      </>
    ),
  },
} satisfies Meta<typeof RichTextSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** On a muted band. */
export const Muted: Story = { args: { background: "muted" } };
