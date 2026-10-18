import { BRANDS } from "@upwilling/design-system";

// Temporary scaffold page (Task 0.2). Replaced by the tenant page in Task 0.3.
export default function HomePage() {
  return (
    <main>
      <h1>UpWilling — en construction</h1>
      <p>Le socle technique de la plateforme est en place.</p>
      <p>Marques déclarées dans le design system : {BRANDS.join(", ")}.</p>
    </main>
  );
}
