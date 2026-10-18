"use client"; // Error boundaries must be Client Components.

// Shown when a page segment fails. The real error is logged server-side (instrumentation.ts);
// the visitor only gets a safe message and the digest to quote to support.
export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main>
      <h1>Une erreur est survenue</h1>
      <p>
        Nous n&apos;avons pas pu afficher cette page. Merci de réessayer dans quelques instants.
      </p>
      {error.digest !== undefined && <p>Référence : {error.digest}</p>}
      <button type="button" onClick={() => retry()}>
        Réessayer
      </button>
    </main>
  );
}
