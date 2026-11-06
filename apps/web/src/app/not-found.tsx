import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main>
      <h1>Page introuvable</h1>
      <p>La page demandée n&apos;existe pas ou a été déplacée.</p>
      <Link href="/">Retour à l&apos;accueil</Link>
    </main>
  );
}
