"use client";

import { useState } from "react";
import { getNoteMap, NOTE_CHOICES, type NotePosition } from "@/lib/theory";
import { Fretboard } from "./Fretboard";
import styles from "./theory.module.css";

function positionLabel({ string, fret }: NotePosition): string {
  return `${string}.ª corda · casa ${fret}${fret === 0 ? " (solta)" : ""}`;
}

/** Coordinates note exploration using the real, browser-independent music core. */
export function TheoryExplorer() {
  const [reference, setReference] = useState(NOTE_CHOICES[0]);
  const [showOtherNotes, setShowOtherNotes] = useState(false);
  const [selection, setSelection] = useState({ string: 2, fret: 1 });
  const map = getNoteMap(reference.spelling);
  const selected = map.positions.find(
    ({ string, fret }) => string === selection.string && fret === selection.fret,
  )!;
  const samePitch = map.positions.filter(
    (position) => position.pitch.semitones === selected.pitch.semitones && position !== selected,
  );
  const pitchLabel = `${selected.pitch.name}${selected.pitch.register}`;

  return (
    <>
      <section aria-labelledby="notes-title" className="mb-8">
        <h2
          id="notes-title"
          className="mb-5 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-black"
        >
          <span aria-hidden="true">●</span> Notas
        </h2>
        <div>
          <label htmlFor="note-reference" className="mb-2 block text-xs text-muted">
            Nota de referência
          </label>
          <select
            id="note-reference"
            value={reference.name}
            onChange={(event) =>
              setReference(NOTE_CHOICES.find(({ name }) => name === event.target.value)!)
            }
            className="h-11 w-full rounded-lg border border-neutral-600 bg-surface px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-40"
          >
            {NOTE_CHOICES.map(({ name }) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <label className="mt-3 flex min-h-11 w-fit items-center gap-3 text-xs text-muted">
          <input
            type="checkbox"
            checked={showOtherNotes}
            onChange={(event) => setShowOtherNotes(event.target.checked)}
            className="h-4 w-4 accent-accent"
          />
          Mostrar também as outras notas
        </label>
      </section>

      <section aria-labelledby="map-title" className={styles.panel}>
        <div className={styles.panelHeading}>
          <h2 id="map-title" className="text-2xl font-bold">
            Encontra {map.reference.name}
          </h2>
          <p className="mt-3 text-xs text-muted">
            A mesma classe de altura, em várias posições e oitavas.
          </p>
        </div>
        <Fretboard
          positions={map.positions}
          selected={selected}
          onSelect={setSelection}
          showOtherNotes={showOtherNotes}
        />
        <p id="fretboard-help" className="px-5 pb-4 text-xs leading-6 text-muted">
          1.ª corda aguda em cima · 6.ª corda grave em baixo · Afinação padrão (destro).
          <br />
          Tab entra no braço; as setas percorrem as posições. Em ecrãs pequenos, desliza na
          horizontal.
        </p>
        <div className={styles.legend}>
          <span>
            <b className={styles.referenceSymbol}>R</b> Referência
          </span>
          <span>◎ Posição seleccionada</span>
          <span>0 = corda solta · casas 1–24</span>
        </div>
      </section>

      <section aria-labelledby="position-title" className={`${styles.panel} ${styles.details}`}>
        <h2
          id="position-title"
          className="text-xs font-semibold uppercase tracking-widest text-muted"
        >
          Posição seleccionada
        </h2>
        <div aria-live="polite" aria-atomic="true">
          <p className="mt-5 text-4xl font-bold">{pitchLabel}</p>
          <p className="mt-2 text-sm">{positionLabel(selected)}</p>
          <dl className={styles.pitchDetails}>
            <div>
              <dt>Classe de altura</dt>
              <dd>{selected.pitch.name}</dd>
            </div>
            <div>
              <dt>Registo (oitava)</dt>
              <dd>{selected.pitch.register}</dd>
            </div>
          </dl>
          {selected.pitch.equivalents.length > 1 && (
            <p className="mt-4 text-sm">
              Equivalências enarmónicas: {selected.pitch.equivalents.join(" = ")}
            </p>
          )}
          {samePitch.length > 0 && (
            <div className="mt-5 border-l-2 border-accent pl-4 text-sm">
              <p className="font-semibold">A mesma altura noutras posições</p>
              <ul className="mt-2 space-y-1 text-muted">
                {samePitch.map((position) => (
                  <li key={`${position.string}:${position.fret}`}>{positionLabel(position)}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-5 text-xs leading-6 text-muted">
            A corda e a casa identificam a posição. O número em {pitchLabel} identifica a oitava; o
            mesmo nome noutra oitava pertence à mesma classe de altura.
          </p>
        </div>
      </section>
    </>
  );
}
