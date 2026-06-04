"use client";

import { useState } from "react";
import { extractChords } from "@/lib/chordProParser";
import { ChordDiagram } from "@/components/ChordDiagram";

interface ChordPanelProps {
  /** ChordPro content, already transposed to the displayed key. */
  content: string;
}

const STORAGE_KEY = "songpad:show-chords";

/**
 * Collapsible strip of guitar chord diagrams for every unique chord in the song.
 * The open/closed choice is remembered across sessions in `localStorage`.
 * Diagrams follow transposition because the caller passes the transposed content.
 *
 * This panel only ever mounts on the client (after the song loads), so reading
 * the remembered preference straight from `localStorage` is safe — open unless
 * it was explicitly closed before.
 */
export function ChordPanel({ content }: ChordPanelProps) {
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

  const chords = extractChords(content);
  if (chords.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-surface">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-foreground"
      >
        <span>Acordes ({chords.length})</span>
        <span className="text-muted" aria-hidden="true">
          {open ? "Esconder ▴" : "Mostrar ▾"}
        </span>
      </button>

      {open ? (
        <div className="flex flex-wrap gap-x-4 gap-y-3 border-t border-border px-4 py-4">
          {chords.map((chord) => (
            <ChordDiagram key={chord} name={chord} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
