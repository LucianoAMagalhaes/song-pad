"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SongForm } from "@/components/SongForm";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { songRepository } from "@/repositories/songRepository";
import type { Song, SongInput } from "@/models/song";

type LoadState = { status: "loading" } | { status: "not-found" } | { status: "ready"; song: Song };

/**
 * Song editor UI. Reads the `id` from the route at runtime via `useParams()`
 * so it works under static export, where the real id only exists in the
 * browser URL (see the page wrapper for the rationale).
 */
export function SongEditor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    songRepository.getById(id).then((song) => {
      if (cancelled) return;
      setState(song ? { status: "ready", song } : { status: "not-found" });
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleSubmit(input: SongInput) {
    await songRepository.update(id, input);
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

      {state.status === "loading" ? (
        <div className="text-muted text-sm py-8 text-center">A carregar...</div>
      ) : state.status === "not-found" ? (
        <EmptyState
          title="Música não encontrada"
          description="Esta música pode ter sido apagada ou o link está inválido."
          action={<LinkButton href="/songs">Voltar à biblioteca</LinkButton>}
        />
      ) : (
        <>
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Editar música</h1>
            <p className="text-muted mt-1">Actualiza os dados da cifra.</p>
          </header>

          <SongForm
            initialSong={state.song}
            submitLabel="Guardar alterações"
            onSubmit={handleSubmit}
          />
        </>
      )}
    </main>
  );
}
