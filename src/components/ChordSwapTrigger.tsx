"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { transposeChord } from "@/lib/chordTransposer";
import { chordVariants } from "@/lib/chordSwap";

interface ChordSwapTriggerProps {
  /** Stored (original-key) chord this trigger swaps, e.g. "Am". */
  original: string;
  /** Semitones the song is transposed by, so variant names show transposed. */
  semitones: number;
  /** Whether transposed names should prefer flats. */
  preferFlats: boolean;
  /** Replace every occurrence of `from` with `to` (original key). */
  onSwap: (from: string, to: string) => void;
  /** The clickable content (a chord label or a diagram). */
  children: ReactNode;
  /** Extra classes for the trigger button. */
  className?: string;
}

const MENU_WIDTH = 260;

/**
 * Wraps a chord (inline above the lyrics, or a diagram in the panel) and opens a
 * popover of same-root variations next to it on click. The popover is rendered
 * in a portal with fixed positioning so it escapes the lyrics' horizontal-scroll
 * clipping. Picking a variation swaps every occurrence in the song.
 */
export function ChordSwapTrigger({
  original,
  semitones,
  preferFlats,
  onSwap,
  children,
  className = "",
}: ChordSwapTriggerProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const isOpen = coords !== null;

  function display(chord: string): string {
    try {
      return transposeChord(chord, semitones, { preferFlats });
    } catch {
      return chord;
    }
  }

  function open() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - MENU_WIDTH - 8));
    setCoords({ top: rect.bottom + 6, left });
  }

  function close() {
    setCoords(null);
  }

  // Dismiss on outside click or when the page scrolls (fixed coords go stale).
  useEffect(() => {
    if (!isOpen) return;
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      close();
    }
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [isOpen]);

  function pick(variant: string) {
    close();
    if (variant !== original) onSwap(original, variant);
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (isOpen ? close() : open())}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={className}
      >
        {children}
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{ position: "fixed", top: coords.top, left: coords.left, width: MENU_WIDTH }}
              className="z-50 rounded-xl border border-border bg-surface p-3 shadow-xl"
            >
              <p className="mb-2 text-xs text-muted">
                Trocar <span className="font-semibold text-foreground">{display(original)}</span>{" "}
                (toda a música) por:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {chordVariants(original).map((variant) => {
                  const isCurrent = variant === original;
                  return (
                    <button
                      key={variant}
                      type="button"
                      role="menuitem"
                      onClick={() => pick(variant)}
                      aria-current={isCurrent}
                      className={`h-8 rounded-full border px-2.5 text-xs font-semibold transition-colors ${
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
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
