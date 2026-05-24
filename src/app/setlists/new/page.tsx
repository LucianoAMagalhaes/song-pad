"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { SetlistForm } from "@/components/SetlistForm";
import { setlistRepository } from "@/repositories/setlistRepository";
import type { SetlistInput } from "@/models/setlist";

export default function NewSetlistPage() {
  const router = useRouter();

  async function handleSubmit(input: SetlistInput) {
    await setlistRepository.create(input);
    router.push("/setlists");
    router.refresh();
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
      <nav className="mb-6">
        <Link
          href="/setlists"
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          ← Voltar às setlists
        </Link>
      </nav>

      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Nova setlist</h1>
        <p className="text-muted mt-1">Agrupa músicas para um ensaio ou actuação.</p>
      </header>

      <SetlistForm submitLabel="Guardar" onSubmit={handleSubmit} />
    </main>
  );
}
