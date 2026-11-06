"use client"; // Error boundaries must be Client Components.

// Replaces the root layout when the layout itself fails, so it renders its own <html> and <body>.
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="fr">
      <body>
        <main>
          <h1>Le site est momentanément indisponible</h1>
          <p>Merci de réessayer dans quelques instants.</p>
          {error.digest !== undefined && <p>Référence : {error.digest}</p>}
          <button type="button" onClick={() => retry()}>
            Réessayer
          </button>
        </main>
      </body>
    </html>
  );
}
