"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouteId } from "@/hooks/useRouteId";
import { SetlistPlayer } from "@/components/SetlistPlayer";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { setlistRepository } from "@/repositories/setlistRepository";
import type { Setlist } from "@/models/setlist";

type LoadState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "ready"; setlist: Setlist };

/**
 * Setlist player (stage view). Reads the `id` from the real browser URL via
 * `useRouteId()` so it works under static export, where the real id only
 * exists in the URL (see the page wrapper for the rationale).
 */
export function SetlistPlay() {
  const id = useRouteId();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setlistRepository.getById(id).then((setlist) => {
      if (cancelled) return;
      setState(setlist ? { status: "ready", setlist } : { status: "not-found" });
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

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
          <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold text-foreground">{state.setlist.name}</h1>
              <p className="text-muted text-sm">
                {state.setlist.songIds.length === 1
                  ? "1 música"
                  : `${state.setlist.songIds.length} músicas`}
              </p>
            </div>

            <LinkButton href={`/setlists/${state.setlist.id}/edit`} variant="secondary">
              Editar
            </LinkButton>
          </header>

          <SetlistPlayer setlist={state.setlist} />
        </>
      )}
    </main>
  );
}
