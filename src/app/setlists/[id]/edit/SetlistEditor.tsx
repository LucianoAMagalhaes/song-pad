"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SetlistForm } from "@/components/SetlistForm";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { setlistRepository } from "@/repositories/setlistRepository";
import type { Setlist, SetlistInput } from "@/models/setlist";

type LoadState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "ready"; setlist: Setlist };

/**
 * Setlist editor UI. Reads the `id` from the route at runtime via
 * `useParams()` so it works under static export, where the real id only
 * exists in the browser URL (see the page wrapper for the rationale).
 */
export function SetlistEditor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setlistRepository.getById(id).then((setlist) => {
      if (cancelled) return;
      setState(setlist ? { status: "ready", setlist } : { status: "not-found" });
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleSubmit(input: SetlistInput) {
    await setlistRepository.update(id, input);
    router.push("/setlists");
    router.refresh();
  }

  async function handleDelete() {
    await setlistRepository.remove(id);
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

      {state.status === "loading" ? (
        <div className="text-muted text-sm py-8 text-center">A carregar...</div>
      ) : state.status === "not-found" ? (
        <EmptyState
          title="Setlist não encontrada"
          description="Esta setlist pode ter sido apagada ou o link está inválido."
          action={<LinkButton href="/setlists">Voltar às setlists</LinkButton>}
        />
      ) : (
        <>
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Editar setlist</h1>
            <p className="text-muted mt-1">Actualiza o nome ou a ordem das músicas.</p>
          </header>

          <SetlistForm
            initialSetlist={state.setlist}
            submitLabel="Guardar alterações"
            onSubmit={handleSubmit}
            onDelete={handleDelete}
          />
        </>
      )}
    </main>
  );
}
