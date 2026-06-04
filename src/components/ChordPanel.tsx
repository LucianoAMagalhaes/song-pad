"use client";

import { useState } from "react";
import { extractChords } from "@/lib/chordProParser";
import { ChordDiagram } from "@/components/ChordDiagram";
import { ChordSwapTrigger } from "@/components/ChordSwapTrigger";

interface ChordPanelProps {
  /** ChordPro content, already transposed to the displayed key (for diagrams). */
  content: string;
  /** Stored content in the original key — what substitutions are applied to. */
  originalContent: string;
  /** Semitones the content is transposed by, so variant names show transposed. */
  semitones: number;
  /** Whether transposed names should prefer flats. */
  preferFlats: boolean;
  /**
   * Persist a substitution: replace all occurrences of the original chord
   * `from` with `to` (both in the stored, original key). When omitted, the
   * diagrams are not tappable.
   */
  onSwapChord?: (from: string, to: string) => void;
}

const STORAGE_KEY = "songpad:show-chords";

/**
 * Collapsible strip of guitar chord diagrams for every unique chord in the song.
 * The open/closed choice is remembered across sessions in `localStorage`.
 *
 * Tapping a diagram (when `onSwapChord` is provided) opens the same variation
 * popover used above the lyrics, so picking e.g. Am → Am7 swaps every occurrence
 * in the song. Diagrams and variant names follow transposition while the
 * substitution is applied to the stored original-key content.
 *
 * This panel only ever mounts on the client (after the song loads), so reading
 * the remembered preference straight from `localStorage` is safe — open unless
 * it was explicitly closed before.
 */
export function ChordPanel({
  content,
  originalContent,
  semitones,
  preferFlats,
  onSwapChord,
}: ChordPanelProps) {
  const [open, setOpen] = useState<boolean>(
    () => typeof window === "undefined" || window.localStorage.getItem(STORAGE_KEY) !== "false",
  );

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  // extractChords keeps order, so the transposed and original lists line up.
  const displays = extractChords(content);
  const originals = extractChords(originalContent);
  if (displays.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-surface">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-foreground"
      >
        <span>Acordes ({displays.length})</span>
        <span className="text-muted" aria-hidden="true">
          {open ? "Esconder ▴" : "Mostrar ▾"}
        </span>
      </button>

      {open ? (
        <div className="flex flex-wrap gap-x-4 gap-y-3 border-t border-border px-4 py-4">
          {displays.map((chord, index) => {
            const original = originals[index] ?? chord;
            if (!onSwapChord) return <ChordDiagram key={original} name={chord} />;
            return (
              <ChordSwapTrigger
                key={original}
                original={original}
                semitones={semitones}
                preferFlats={preferFlats}
                onSwap={onSwapChord}
                className="rounded-lg p-1 transition-colors hover:bg-surface-hover"
              >
                <ChordDiagram name={chord} />
              </ChordSwapTrigger>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
