"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChordRenderer } from "@/components/ChordRenderer";
import { Transposer } from "@/components/Transposer";
import { Button, LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { transposeContent } from "@/lib/chordTransposer";
import { safeTransposeKey, shouldUseFlats } from "@/lib/keyDisplay";
import { songRepository } from "@/repositories/songRepository";
import type { Song } from "@/models/song";

type LoadState = { status: "loading" } | { status: "not-found" } | { status: "ready"; song: Song };

/**
 * Song viewer UI. Reads the `id` from the route at runtime via `useParams()`
 * so it works under static export (`output: "export"`), where the page shell
 * is generated from a placeholder param and the real id only exists in the
 * browser URL.
 */
export function SongView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [semitones, setSemitones] = useState(0);

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

  const song = state.status === "ready" ? state.song : null;

  const preferFlats = useMemo(
    () => (song ? shouldUseFlats(song.key, semitones) : false),
    [song, semitones],
  );

  const transposedContent = useMemo(
    () => (song ? transposeContent(song.content, semitones, { preferFlats }) : ""),
    [song, semitones, preferFlats],
  );

  const targetKey = useMemo(
    () => (song ? safeTransposeKey(song.key, semitones, preferFlats) : ""),
    [song, semitones, preferFlats],
  );

  async function handleDelete() {
    if (!song) return;
    const confirmed = window.confirm(
      `Eliminar "${song.title}"? Esta acção não pode ser revertida.`,
    );
    if (!confirmed) return;
    await songRepository.remove(song.id);
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
        <article className="flex flex-col gap-6">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold text-foreground">{state.song.title}</h1>
              {state.song.artist ? <p className="text-muted">{state.song.artist}</p> : null}
              <div className="flex gap-4 text-xs text-muted mt-2">
                {state.song.key ? <span>Tom: {state.song.key}</span> : null}
                {state.song.bpm > 0 ? <span>{state.song.bpm} BPM</span> : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <LinkButton href={`/songs/${state.song.id}/edit`} variant="secondary">
                Editar
              </LinkButton>
              <Button variant="ghost" onClick={handleDelete} className="text-red-400">
                Eliminar
              </Button>
            </div>
          </header>

          <div className="flex justify-start">
            <Transposer
              semitones={semitones}
              originalKey={state.song.key}
              targetKey={targetKey}
              onChange={setSemitones}
            />
          </div>

          <section className="rounded-2xl border border-border bg-surface p-4 sm:p-6 overflow-x-auto">
            {state.song.content.trim() === "" ? (
              <p className="text-muted text-sm italic">Esta música ainda não tem conteúdo.</p>
            ) : (
              <ChordRenderer content={transposedContent} />
            )}
          </section>
        </article>
      )}
    </main>
  );
}
