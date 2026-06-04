"use client";

import { useState } from "react";
import { extractChords } from "@/lib/chordProParser";
import { transposeChord } from "@/lib/chordTransposer";
import { chordVariants } from "@/lib/chordSwap";
import { ChordDiagram } from "@/components/ChordDiagram";

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
   * panel is read-only.
   */
  onSwapChord?: (from: string, to: string) => void;
}

const STORAGE_KEY = "songpad:show-chords";

/**
 * Collapsible strip of guitar chord diagrams for every unique chord in the song.
 * The open/closed choice is remembered across sessions in `localStorage`.
 *
 * Tapping a chord (when `onSwapChord` is provided) reveals a tray of variations
 * that share the same root (e.g. Am → Am7 → Am9); picking one swaps every
 * occurrence in the song. Diagrams and variant names follow transposition while
 * substitutions are applied to the stored original-key content.
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
  /** Original-key chord whose substitution tray is open, or null. */
  const [selected, setSelected] = useState<string | null>(null);

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

  function display(originalChord: string): string {
    try {
      return transposeChord(originalChord, semitones, { preferFlats });
    } catch {
      return originalChord;
    }
  }

  function applySwap(from: string, to: string) {
    setSelected(null);
    if (from !== to) onSwapChord?.(from, to);
  }

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
        <>
          <div className="flex flex-wrap gap-x-4 gap-y-3 border-t border-border px-4 py-4">
            {displays.map((chord, index) => {
              const original = originals[index] ?? chord;
              if (!onSwapChord) return <ChordDiagram key={original} name={chord} />;
              return (
                <button
                  key={original}
                  type="button"
                  onClick={() => setSelected((cur) => (cur === original ? null : original))}
                  aria-pressed={selected === original}
                  className={`rounded-lg p-1 transition-colors hover:bg-surface-hover ${
                    selected === original ? "bg-surface-hover" : ""
                  }`}
                >
                  <ChordDiagram name={chord} />
                </button>
              );
            })}
          </div>

          {selected !== null && onSwapChord ? (
            <div className="border-t border-border px-4 py-4">
              <p className="mb-3 text-sm text-muted">
                Trocar <span className="font-semibold text-foreground">{display(selected)}</span>{" "}
                (em toda a música) por:
              </p>
              <div className="flex flex-wrap gap-2">
                {chordVariants(selected).map((variant) => {
                  const isCurrent = variant === selected;
                  return (
                    <button
                      key={variant}
                      type="button"
                      onClick={() => applySwap(selected, variant)}
                      aria-current={isCurrent}
                      className={`rounded-full border px-3 h-9 text-sm font-semibold transition-colors ${
                        isCurrent
                          ? "border-accent text-accent"
                          : "border-border text-foreground hover:bg-surface-hover"
                      }`}
                    >
                      {display(variant)}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
