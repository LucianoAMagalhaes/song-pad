"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { SongForm } from "@/components/SongForm";
import { songRepository } from "@/repositories/songRepository";
import type { SongInput } from "@/models/song";

export default function NewSongPage() {
  const router = useRouter();

  async function handleSubmit(input: SongInput) {
    await songRepository.create(input);
    router.push("/songs");
    router.refresh();
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
      <nav className="mb-6">
        <Link href="/songs" className="text-sm text-muted hover:text-foreground transition-colors">
          ← Voltar à biblioteca
        </Link>
      </nav>

      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Nova música</h1>
        <p className="text-muted mt-1">Adiciona uma cifra à tua biblioteca.</p>
      </header>

      <SongForm submitLabel="Guardar" onSubmit={handleSubmit} />
    </main>
  );
}
