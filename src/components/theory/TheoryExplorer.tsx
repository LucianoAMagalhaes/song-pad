"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DEFAULT_THEORY_PREFERENCES,
  loadTheoryPreferences,
  saveTheoryPreferences,
  type TheoryPreferences,
} from "@/lib/theoryPreferences";
import {
  getIntervalMap,
  getNoteMap,
  getScaleMap,
  INTERVAL_CHOICES,
  NOTE_CHOICES,
  SCALE_CHOICES,
  type NotePosition,
} from "@/lib/theory";
import { Button } from "@/components/ui/Button";
import { Fretboard } from "./Fretboard";
import { PositionComparison } from "./PositionComparison";
import styles from "./theory.module.css";

function positionLabel({ string, fret }: NotePosition): string {
  return `${string}.ª corda · casa ${fret}${fret === 0 ? " (solta)" : ""}`;
}

/** Coordinates exploration using the real, browser-independent music core. */
export function TheoryExplorer() {
  const { user } = useAuth();
  // A new account gets a fresh session, including all transient selections.
  return <TheorySession key={user ? `user:${user.uid}` : "signed-out"} uid={user?.uid ?? null} />;
}

function TheorySession({ uid }: { uid: string | null }) {
  const [preferences, setPreferences] = useState<TheoryPreferences>({
    ...DEFAULT_THEORY_PREFERENCES,
  });
  useEffect(() => {
    if (uid) {
      // Restore browser storage after mounting, keeping SSR and hydration identical.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreferences(loadTheoryPreferences(uid));
    }
  }, [uid]);

  function updatePreferences(update: Partial<TheoryPreferences>) {
    const next = { ...preferences, ...update };
    setPreferences(next);
    if (uid) saveTheoryPreferences(uid, next);
  }

  const { mode, reading: scaleReading } = preferences;
  const reference = NOTE_CHOICES.find(({ name }) => name === preferences.tonic)!;
  const family = SCALE_CHOICES.find(({ id }) => id === preferences.family)!;
  const [interval, setInterval] = useState(INTERVAL_CHOICES.find(({ short }) => short === "5J")!);
  const [reading, setReading] = useState("relative");
  const [origin, setOrigin] = useState({ string: 2, fret: 1 });
  const [choosingReference, setChoosingReference] = useState(false);
  const [showOtherNotes, setShowOtherNotes] = useState(false);
  const [selection, setSelection] = useState({ string: 2, fret: 1 });
  const relation = getIntervalMap(reference.spelling, interval);
  const scale = mode === "scales" ? getScaleMap(reference.spelling, family.id) : null;
  const map = scale ?? (mode === "intervals" ? relation : getNoteMap(reference.spelling));
  const isComparing = mode === "intervals" && reading === "positions";
  const positions = isComparing
    ? map.positions.map((position) => ({
        ...position,
        isReference: position.string === origin.string && position.fret === origin.fret,
        isTarget: position.string === selection.string && position.fret === selection.fret,
      }))
    : map.positions;
  const selected = positions.find(
    ({ string, fret }) => string === selection.string && fret === selection.fret,
  )!;
  const referencePosition = positions.find(
    ({ string, fret }) => string === origin.string && fret === origin.fret,
  )!;
  const samePitch = positions.filter(
    (position) => position.pitch.semitones === selected.pitch.semitones && position !== selected,
  );
  const pitchLabel = `${selected.pitch.name}${selected.pitch.register}`;
  const selectedScaleNote =
    scale?.notes.find(({ pitchClass }) => pitchClass === selected.pitch.pitchClass) ?? null;

  function selectPosition(position: NotePosition) {
    if (choosingReference) {
      setOrigin(position);
      setChoosingReference(false);
    } else {
      setSelection(position);
    }
  }

  return (
    <>
      <section aria-labelledby="notes-title" className="mb-8">
        <h2 id="notes-title" className="sr-only">
          {mode === "notes" ? "Notas" : mode === "intervals" ? "Intervalos" : "Escalas"}
        </h2>
        <div
          role="group"
          aria-label="Modo de exploração"
          className="mb-5 flex w-fit max-w-full flex-wrap gap-1 rounded-xl border border-neutral-700 bg-surface p-1"
        >
          <Button
            type="button"
            variant={mode === "notes" ? "primary" : "ghost"}
            aria-pressed={mode === "notes"}
            onClick={() => {
              updatePreferences({ mode: "notes" });
              setChoosingReference(false);
            }}
            className="rounded-lg"
          >
            <span aria-hidden="true">●</span> Notas
          </Button>
          <Button
            type="button"
            variant={mode === "intervals" ? "primary" : "ghost"}
            aria-pressed={mode === "intervals"}
            onClick={() => {
              updatePreferences({ mode: "intervals" });
              setChoosingReference(false);
            }}
            className="rounded-lg"
          >
            <span aria-hidden="true">↔</span> Intervalos
          </Button>
          <Button
            type="button"
            variant={mode === "scales" ? "primary" : "ghost"}
            aria-pressed={mode === "scales"}
            onClick={() => {
              updatePreferences({ mode: "scales" });
              setChoosingReference(false);
            }}
            className="rounded-lg"
          >
            <span aria-hidden="true">♮</span> Escalas
          </Button>
        </div>
        <div className="flex flex-wrap gap-4">
          {!isComparing && (
            <div>
              <label htmlFor="note-reference" className="mb-2 block text-xs text-muted">
                {mode === "scales" ? "Tónica" : "Nota de referência"}
              </label>
              <select
                id="note-reference"
                value={reference.name}
                onChange={(event) => updatePreferences({ tonic: event.target.value })}
                className="h-11 w-full rounded-lg border border-neutral-600 bg-surface px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-40"
              >
                {NOTE_CHOICES.map(({ name }) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {scale && (
            <>
              <div>
                <label htmlFor="scale-family" className="mb-2 block text-xs text-muted">
                  Família
                </label>
                <select
                  id="scale-family"
                  className={styles.select}
                  value={family.id}
                  onChange={(event) =>
                    updatePreferences({
                      family: SCALE_CHOICES.find(({ id }) => id === event.target.value)!.id,
                    })
                  }
                >
                  {SCALE_CHOICES.map(({ id, name }) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="scale-reading" className="mb-2 block text-xs text-muted">
                  Leitura
                </label>
                <select
                  id="scale-reading"
                  className={styles.select}
                  value={scaleReading}
                  onChange={(event) =>
                    updatePreferences({
                      reading: event.target.value === "degrees" ? "degrees" : "notes",
                    })
                  }
                >
                  <option value="notes">Notas</option>
                  <option value="degrees">Graus</option>
                </select>
              </div>
            </>
          )}
          {mode === "intervals" && (
            <>
              <div>
                <label htmlFor="interval-reading" className="mb-2 block text-xs text-muted">
                  Leitura
                </label>
                <select
                  id="interval-reading"
                  className={styles.select}
                  value={reading}
                  onChange={(event) => {
                    setReading(event.target.value);
                    setChoosingReference(false);
                  }}
                >
                  <option value="relative">Relação com a referência</option>
                  <option value="positions">Comparar posições</option>
                </select>
              </div>
              {!isComparing && (
                <div>
                  <label htmlFor="interval-choice" className="mb-2 block text-xs text-muted">
                    Intervalo
                  </label>
                  <select
                    id="interval-choice"
                    className={styles.select}
                    value={interval.short}
                    onChange={(event) =>
                      setInterval(
                        INTERVAL_CHOICES.find(({ short }) => short === event.target.value)!,
                      )
                    }
                  >
                    {INTERVAL_CHOICES.map(({ short, name }) => (
                      <option key={short} value={short}>
                        {short} · {name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {isComparing && (
                <Button
                  type="button"
                  variant="secondary"
                  className="self-end"
                  aria-pressed={choosingReference}
                  onClick={() => setChoosingReference(!choosingReference)}
                >
                  {choosingReference
                    ? "Escolhe a referência no braço…"
                    : `Alterar referência · ${referencePosition.pitch.name}${referencePosition.pitch.register}`}
                </Button>
              )}
            </>
          )}
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
            {scale
              ? `${scale.reference.name} · ${scale.name}`
              : mode === "notes"
                ? `Encontra ${map.reference.name}`
                : isComparing
                  ? "De uma posição para outra"
                  : `${map.reference.name} → ${relation.target.name}`}
          </h2>
          <p className="mt-3 text-xs text-muted">
            {scale
              ? scale.notes
                  .map((note) => (scaleReading === "degrees" ? note.degree : note.name))
                  .join(" · ")
              : mode === "notes"
                ? "A mesma classe de altura, em várias posições e oitavas."
                : isComparing
                  ? choosingReference
                    ? "Escolhe a referência; depois escolhe o alvo. Com as setas, percorre o braço e confirma com Enter ou Espaço."
                    : "Escolhe o alvo no braço. A altura real determina a distância e a direcção."
                  : `${interval.name} · ${interval.semitones} semitons na relação.`}
          </p>
        </div>
        <Fretboard
          positions={positions}
          selected={choosingReference ? referencePosition : selected}
          onSelect={selectPosition}
          onNavigate={choosingReference ? setOrigin : setSelection}
          showOtherNotes={showOtherNotes}
          targetLabel={mode === "intervals" ? (isComparing ? "Alvo" : interval.short) : undefined}
          scaleReading={scale ? scaleReading : undefined}
        />
        <p id="fretboard-help" className="px-5 pb-4 text-xs leading-6 text-muted">
          1.ª corda aguda em cima · 6.ª corda grave em baixo · Afinação padrão (destro).
          <br />
          Tab entra no braço; as setas percorrem as posições. Em ecrãs pequenos, desliza na
          horizontal.
        </p>
        <div className={styles.legend}>
          <span>
            <b className={styles.referenceSymbol}>{scale ? "T" : "R"}</b>{" "}
            {scale ? "Tónica" : "Referência"}
          </span>
          {scale && <span>● Nota da escala · número = grau</span>}
          {mode === "intervals" && (
            <span>
              {isComparing ? "Alvo = posição de chegada" : `${interval.short} = ${interval.name}`}
            </span>
          )}
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
          {scale && !selectedScaleNote && (
            <p className="mt-5 text-sm">{selected.pitch.name} não pertence à escala escolhida.</p>
          )}
          {mode === "intervals" && !isComparing && (
            <div className="mt-5 border-l-2 border-accent pl-4 text-sm leading-6">
              <p>
                {selected.pitch.pitchClass === relation.target.pitchClass
                  ? `${selected.pitch.name}: ${interval.name} de ${map.reference.name} · ${interval.semitones} semitons na relação.`
                  : selected.isReference
                    ? `${selected.pitch.name} é a referência.`
                    : `${selected.pitch.name} não pertence à relação escolhida.`}
              </p>
              <p className="mt-2 text-muted">
                A relação repete-se entre oitavas. Para medir a distância entre alturas concretas,
                escolhe “Comparar posições”.
              </p>
            </div>
          )}
          <dl className={styles.pitchDetails}>
            <div>
              <dt>Classe de altura</dt>
              <dd>{selected.pitch.name}</dd>
            </div>
            <div>
              <dt>Registo (oitava)</dt>
              <dd>{selected.pitch.register}</dd>
            </div>
            {scale && selectedScaleNote && (
              <>
                <div>
                  <dt>Grau</dt>
                  <dd>
                    {selectedScaleNote.degree}
                    {selected.isReference ? " · Tónica" : ""}
                  </dd>
                </div>
                <div>
                  <dt>Intervalo na fórmula</dt>
                  <dd>
                    {selectedScaleNote.interval.name} · {selectedScaleNote.interval.semitones}{" "}
                    semitons
                  </dd>
                </div>
              </>
            )}
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
      {isComparing && <PositionComparison reference={referencePosition} target={selected} />}
    </>
  );
}
