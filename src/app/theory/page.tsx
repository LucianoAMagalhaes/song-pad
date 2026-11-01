import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/Button";
import { TheoryExplorer } from "@/components/theory/TheoryExplorer";

export const metadata: Metadata = { title: "Teoria" };

export default function TheoryPage() {
  return (
    <main className="mx-auto w-full min-w-0 max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
      <nav aria-label="Biblioteca" className="mb-8 flex flex-wrap gap-2 text-sm text-muted">
        <LinkButton href="/songs" variant="ghost">
          ← Músicas
        </LinkButton>
        <LinkButton href="/setlists" variant="ghost">
          Setlists
        </LinkButton>
      </nav>
      <header className="mb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
          Teoria / Explorar
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">O braço, por inteiro.</h1>
        <p className="mt-4 text-sm text-muted">
          Encontra notas e explora relações entre posições no braço.
        </p>
      </header>
      <TheoryExplorer />
    </main>
  );
}
