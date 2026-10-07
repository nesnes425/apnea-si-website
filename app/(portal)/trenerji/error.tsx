"use client";
import { Button } from "@/components/ui/button";
export default function PortalError({ reset }: { reset: () => void }) {
  return (
    <main className="portal-shell">
      <section className="portal-card">
        <h1>Pregleda ni mogoče naložiti</h1>
        <p>
          Preverite povezavo in poskusite ponovno. Če ste ravno zaključili
          trening, najprej preverite, ali je evidenca že shranjena.
        </p>
        <Button onClick={reset}>Poskusi ponovno</Button>
      </section>
    </main>
  );
}
