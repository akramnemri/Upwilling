"use client";

import { Alert, Field, Input, Stack, SubmitButton } from "@upwilling/design-system/react";
import { useActionState } from "react";

// Client Component: the form action below runs in the browser and only waits, so the preview shows
// the pending state without posting anything (no server action on a /dev page).

const SIMULATED_DELAY_MS = 1500;

async function simulateSubmission(sentCount: number): Promise<number> {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));
  return sentCount + 1;
}

/** A form whose submission takes 1.5 s: spinner, announcement, no double submit, focus kept. */
export function PendingFormDemo() {
  const [sentCount, submit] = useActionState(simulateSubmission, 0);
  return (
    <form action={submit}>
      <Stack gap="4" align="start">
        <Field label="Votre prénom" help="Exemple fictif : rien n’est envoyé.">
          {(control) => <Input name="prenom" autoComplete="given-name" {...control} />}
        </Field>
        <SubmitButton pendingLabel="Envoi en cours">Envoyer la demande</SubmitButton>
        {/* On the page from the start, so the confirmation is announced when it appears. */}
        <div role="status">
          {sentCount > 0 && (
            <Alert tone="success" title="Demande envoyée">
              Envois simulés : {sentCount}.
            </Alert>
          )}
        </div>
      </Stack>
    </form>
  );
}
