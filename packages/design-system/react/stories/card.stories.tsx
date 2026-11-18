import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ButtonLink } from "../actions.tsx";
import { Badge, Card, CardBody, CardFooter, CardHeader, CardMedia, Chip } from "../content.tsx";
import { Skeleton } from "../feedback.tsx";
import { Grid } from "../layout.tsx";
import { Heading, Text } from "../typography.tsx";

const meta = {
  title: "Content/Card",
  component: Card,
  subcomponents: { CardMedia, CardHeader, CardBody, CardFooter },
  args: { className: "max-w-md" },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

const header = (
  <CardHeader>
    <Badge tone="success">Places disponibles</Badge>
    <Heading level={3} size="xl">
      Initiation au développement web
    </Heading>
  </CardHeader>
);

const body = (
  <CardBody>
    <Text tone="muted">
      Cinq jours pour construire une première page accessible, du HTML au déploiement.
    </Text>
  </CardBody>
);

const footer = (
  <CardFooter>
    <Chip>HTML</Chip>
    <Chip>CSS</Chip>
    <ButtonLink href="/formations/initiation-web" size="sm" variant="secondary">
      Voir le programme
    </ButtonLink>
  </CardFooter>
);

export const HeaderBodyFooter: Story = {
  render: (args) => (
    <Card {...args}>
      {header}
      {body}
      {footer}
    </Card>
  ),
};

/** The media slot takes an image with its own size and alt text (a placeholder block here). */
export const WithMedia: Story = {
  render: (args) => (
    <Card {...args}>
      <CardMedia>
        <Skeleton shape="block" className="rounded-none" />
      </CardMedia>
      {header}
      {body}
      {footer}
    </Card>
  ),
};

export const BodyOnly: Story = {
  render: (args) => (
    <Card {...args}>
      <CardBody>
        <Text>Une carte simple, sans en-tête ni pied.</Text>
      </CardBody>
    </Card>
  ),
};

/** `as="li"` inside a list (a grid rendered as `ul`). */
export const ListOfCards: Story = {
  render: () => (
    <Grid as="ul" columns={3}>
      {["Débutant", "Intermédiaire", "Avancé"].map((level) => (
        <Card key={level} as="li">
          <CardHeader>
            <Badge>{level}</Badge>
            <Heading level={3} size="lg">
              Parcours {level.toLowerCase()}
            </Heading>
          </CardHeader>
          {body}
        </Card>
      ))}
    </Grid>
  ),
};
