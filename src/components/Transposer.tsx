"use client";

import { Button } from "@/components/ui/Button";

interface TransposerProps {
  semitones: number;
  /** Original key as stored on the song. May be empty when the song has no key. */
  originalKey?: string;
  /** Target key after applying `semitones`. Caller computes it to choose sharp/flat spelling. */
  targetKey?: string;
  onChange: (semitones: number) => void;
}

/**
 * Stage-friendly transpose control: `−` / `+` step by one semitone, the
 * reset arrow snaps back to the original key. The middle label shows the
 * key change so the musician sees the new tonality at a glance.
 */
export function Transposer({ semitones, originalKey, targetKey, onChange }: TransposerProps) {
  const isShifted = semitones !== 0;
  const offsetLabel = semitones > 0 ? `+${semitones}` : `${semitones}`;

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-2 py-1"
      role="group"
      aria-label="Transposição"
    >
      <Button
        variant="ghost"
        className="h-9 w-9 px-0 text-lg"
        onClick={() => onChange(semitones - 1)}
        aria-label="Descer um semitom"
      >
        −
      </Button>

      <div className="flex flex-col items-center justify-center min-w-[6rem] px-2 leading-tight">
        {originalKey && targetKey ? (
          <span className="text-sm font-semibold text-foreground">
            {isShifted ? (
              <>
                {originalKey} <span className="text-muted">→</span> {targetKey}
              </>
            ) : (
              originalKey
            )}
          </span>
        ) : (
          <span className="text-sm font-semibold text-muted">{isShifted ? offsetLabel : "—"}</span>
        )}
        {isShifted ? <span className="text-[10px] text-muted">{offsetLabel} st</span> : null}
      </div>

      <Button
        variant="ghost"
        className="h-9 w-9 px-0 text-lg"
        onClick={() => onChange(semitones + 1)}
        aria-label="Subir um semitom"
      >
        +
      </Button>

      <Button
        variant="ghost"
        className="h-9 w-9 px-0 text-base"
        onClick={() => onChange(0)}
        disabled={!isShifted}
        aria-label="Repor tom original"
        title="Repor tom original"
      >
        ↻
      </Button>
    </div>
  );
}
