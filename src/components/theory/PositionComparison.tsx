import { describeInterval, type NotePosition } from "@/lib/theory";
import styles from "./theory.module.css";

interface PositionComparisonProps {
  reference: NotePosition;
  target: NotePosition;
}

const DIRECTIONS = { ascending: "Ascendente", descending: "Descendente", same: "Mesma altura" };

/** Presents real pitch distance separately from the octave-independent relative map. */
export function PositionComparison({ reference, target }: PositionComparisonProps) {
  const comparison = describeInterval(reference.pitch, target.pitch);
  return (
    <section aria-label="Comparação entre posições" className={`${styles.panel} ${styles.details}`}>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
        Comparação entre posições
      </h2>
      <div aria-live="polite" aria-atomic="true" className="mt-5 space-y-3">
        <p className="text-2xl font-bold">
          {reference.pitch.name}
          {reference.pitch.register} → {target.pitch.name}
          {target.pitch.register}
        </p>
        <p className="text-sm">
          Referência: {reference.string}.ª corda · casa {reference.fret}
          {reference.fret === 0 ? " (solta)" : ""}
        </p>
        <p className="text-sm">
          Alvo: {target.string}.ª corda · casa {target.fret}
          {target.fret === 0 ? " (solta)" : ""}
        </p>
        <p className="text-2xl font-bold text-accent">{comparison.name}</p>
        <p className="text-sm">
          {comparison.semitones} semitons · {DIRECTIONS[comparison.direction]}
        </p>
        <p className="text-xs leading-6 text-muted">
          {comparison.semitones === 0
            ? "A altura é igual, mesmo que a posição no braço mude."
            : comparison.semitones > 12
              ? "A distância ultrapassa uma oitava."
              : comparison.isCompound
                ? "A grafia abrange mais de uma oitava diatónica; consulta a distância em semitons."
                : "Esta leitura compara alturas concretas, com direcção e distância em semitons."}
        </p>
      </div>
    </section>
  );
}
