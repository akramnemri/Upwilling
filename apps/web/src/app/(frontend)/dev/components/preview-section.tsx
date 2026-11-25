import { Container, Heading, Section, Stack } from "@upwilling/design-system/react";
import type { ReactNode } from "react";

/** One titled band of the component preview; `id` is its heading's id (the section's name). */
export function PreviewSection({
  id,
  title,
  background = "surface",
  children,
}: Readonly<{
  id: string;
  title: string;
  background?: "surface" | "muted";
  children: ReactNode;
}>) {
  return (
    <Section background={background} spacing="sm" aria-labelledby={id}>
      <Container>
        <Stack gap="6">
          <Heading level={2} id={id}>
            {title}
          </Heading>
          {children}
        </Stack>
      </Container>
    </Section>
  );
}
