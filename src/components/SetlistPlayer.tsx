"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChordRenderer } from "@/components/ChordRenderer";
import { Transposer } from "@/components/Transposer";
import { Button, LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { transposeContent } from "@/lib/chordTransposer";
import { safeTransposeKey, shouldUseFlats } from "@/lib/keyDisplay";
import { songRepository } from "@/repositories/songRepository";
import type { Setlist } from "@/models/setlist";
import type { Song } from "@/models/song";

interface SetlistPlayerProps {
  setlist: Setlist;
}

/**
 * Stage view for a setlist: one song at a time, prev/next navigation, and
 * per-song transposition that persists in memory while the player is mounted.
 * Songs are loaded once and indexed by id; the rendered slide is derived from
 * `currentIndex` and the song lookup.
 */
export function SetlistPlayer({ setlist }: SetlistPlayerProps) {
  const [songsById, setSongsById] = useState<Map<string, Song> | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  /** songId → semitones, kept alive during the session. */
  const [transpositions, setTranspositions] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all(setlist.songIds.map((id) => songRepository.getById(id))).then((results) => {
      if (cancelled) return;
      const map = new Map<string, Song>();
      for (const song of results) {
        if (song) map.set(song.id, song);
      }
      setSongsById(map);
    });
    return () => {
      cancelled = true;
    };
  }, [setlist.songIds]);

  const total = setlist.songIds.length;
  const clampedIndex = Math.min(currentIndex, Math.max(total - 1, 0));
  const currentSongId = setlist.songIds[clampedIndex];
  const currentSong = currentSongId ? (songsById?.get(currentSongId) ?? null) : null;
  const semitones = currentSongId ? (transpositions[currentSongId] ?? 0) : 0;

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(total - 1, i + 1));
  }, [total]);

  useEffect(() => {
    function isEditableTarget(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goPrev, goNext]);

  const preferFlats = useMemo(
    () => (currentSong ? shouldUseFlats(currentSong.key, semitones) : false),
    [currentSong, semitones],
  );

  const transposedContent = useMemo(
    () => (currentSong ? transposeContent(currentSong.content, semitones, { preferFlats }) : ""),
    [currentSong, semitones, preferFlats],
  );

  const targetKey = useMemo(
    () => (currentSong ? safeTransposeKey(currentSong.key, semitones, preferFlats) : ""),
    [currentSong, semitones, preferFlats],
  );

  function handleTranspose(next: number) {
    if (!currentSongId) return;
    setTranspositions((prev) => ({ ...prev, [currentSongId]: next }));
  }

  if (total === 0) {
    return (
      <EmptyState
        title="Esta setlist está vazia"
        description="Adiciona músicas para começar a tocar."
        action={<LinkButton href={`/setlists/${setlist.id}/edit`}>Editar setlist</LinkButton>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <nav
        className="flex items-center justify-between gap-3"
        role="group"
        aria-label="Navegação da setlist"
      >
        <Button
          variant="secondary"
          onClick={goPrev}
          disabled={clampedIndex === 0}
          aria-label="Música anterior"
        >
          ← Anterior
        </Button>

        <div className="flex flex-col items-center text-center">
          <span className="text-xs font-mono text-muted">
            {clampedIndex + 1} / {total}
          </span>
          {currentSong ? (
            <span className="text-sm font-semibold text-foreground truncate max-w-[16rem]">
              {currentSong.title}
            </span>
          ) : null}
        </div>

        <Button
          variant="secondary"
          onClick={goNext}
          disabled={clampedIndex >= total - 1}
          aria-label="Próxima música"
        >
          Seguinte →
        </Button>
      </nav>

      {songsById === null ? (
        <div className="text-muted text-sm py-8 text-center">A carregar...</div>
      ) : !currentSong ? (
        <section className="rounded-2xl border border-border bg-surface p-6 text-center">
          <p className="text-foreground font-semibold mb-1">Música indisponível</p>
          <p className="text-sm text-muted">
            Esta entrada da setlist aponta para uma música que já não existe na biblioteca.
          </p>
        </section>
      ) : (
        <article className="flex flex-col gap-4">
          <header className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-foreground">{currentSong.title}</h2>
            {currentSong.artist ? <p className="text-muted">{currentSong.artist}</p> : null}
            <div className="flex gap-4 text-xs text-muted mt-1">
              {currentSong.key ? <span>Tom: {currentSong.key}</span> : null}
              {currentSong.bpm > 0 ? <span>{currentSong.bpm} BPM</span> : null}
            </div>
          </header>

          <div className="flex justify-start">
            <Transposer
              semitones={semitones}
              originalKey={currentSong.key}
              targetKey={targetKey}
              onChange={handleTranspose}
            />
          </div>

          <section className="rounded-2xl border border-border bg-surface p-4 sm:p-6 overflow-x-auto">
            {currentSong.content.trim() === "" ? (
              <p className="text-muted text-sm italic">Esta música ainda não tem conteúdo.</p>
            ) : (
              <ChordRenderer content={transposedContent} />
            )}
          </section>
        </article>
      )}

      <p className="text-xs text-muted text-center">
        Dica: usa <kbd className="font-mono">←</kbd> e <kbd className="font-mono">→</kbd> para
        navegar entre músicas.
      </p>
    </div>
  );
}
