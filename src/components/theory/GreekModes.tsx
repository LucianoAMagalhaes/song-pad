import {
  getModeComparison,
  GREEK_MODE_CHOICES,
  NOTE_CHOICES,
  parseNoteSpelling,
} from "@/lib/theory";
import type { GreekModePreferences } from "@/lib/greekModePreferences";
import { Button } from "@/components/ui/Button";
import styles from "./theory.module.css";

interface GreekModesProps {
  preferences: GreekModePreferences;
  onChange: (update: Partial<GreekModePreferences>) => void;
}

/** Modal controls keep the musical mode distinct from the exploration area. */
export function GreekModeControls({ preferences, onChange }: GreekModesProps) {
  const { tonic, musicalMode, reading, comparison, referenceMode } = preferences;
  // Relative modes can introduce contextual tonics absent from the usual free choices.
  const tonicNames = NOTE_CHOICES.map(({ name }) => name);
  if (!tonicNames.includes(tonic)) tonicNames.push(tonic);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div>
          <label htmlFor="modal-tonic" className="mb-2 block text-xs text-muted">
            Tónica
          </label>
          <select
            id="modal-tonic"
            className={styles.select}
            value={tonic}
            onChange={(event) => onChange({ tonic: event.target.value })}
          >
            {tonicNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="musical-mode" className="mb-2 block text-xs text-muted">
            Modo musical
          </label>
          <select
            id="musical-mode"
            className={styles.select}
            value={musicalMode}
            onChange={(event) =>
              onChange({
                musicalMode: GREEK_MODE_CHOICES.find(({ id }) => id === event.target.value)!.id,
              })
            }
          >
            {GREEK_MODE_CHOICES.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="modal-reading" className="mb-2 block text-xs text-muted">
            Leitura
          </label>
          <select
            id="modal-reading"
            className={styles.select}
            value={reading}
            onChange={(event) =>
              onChange({ reading: event.target.value === "degrees" ? "degrees" : "notes" })
            }
          >
            <option value="notes">Notas</option>
            <option value="degrees">Graus</option>
          </select>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <p className="mb-2 text-xs text-muted">Comparação</p>
          <div role="group" aria-label="Vista de comparação" className="flex flex-wrap gap-2">
            {[
              { id: "parallel", name: "Mesma tónica" },
              { id: "relative", name: "Mesmas notas" },
            ].map(({ id, name }) => (
              <Button
                key={id}
                type="button"
                variant={comparison === id ? "primary" : "secondary"}
                aria-pressed={comparison === id}
                onClick={() =>
                  onChange({ comparison: id === "parallel" ? "parallel" : "relative" })
                }
              >
                {name}
              </Button>
            ))}
          </div>
        </div>
        {comparison === "parallel" && (
          <div>
            <label htmlFor="modal-reference" className="mb-2 block text-xs text-muted">
              Modo de referência
            </label>
            <select
              id="modal-reference"
              className={styles.select}
              value={referenceMode}
              onChange={(event) =>
                onChange({
                  referenceMode: GREEK_MODE_CHOICES.find(({ id }) => id === event.target.value)!.id,
                })
              }
            >
              {GREEK_MODE_CHOICES.map(({ id, name }) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

/** One compact comparison table drives the shared fretboard, including on narrow screens. */
export function GreekModeComparison({ preferences, onChange }: GreekModesProps) {
  const { tonic, musicalMode, comparison, referenceMode } = preferences;
  const { rows, parentTonic } = getModeComparison(
    parseNoteSpelling(tonic)!,
    musicalMode,
    comparison,
    referenceMode,
  );
  const referenceName = GREEK_MODE_CHOICES.find(({ id }) => id === referenceMode)!.name;

  return (
    <section aria-labelledby="modal-comparison-title" className={`${styles.panel} mt-6`}>
      <div className={styles.panelHeading}>
        <h2 id="modal-comparison-title" className="text-xl font-bold">
          Comparar modos
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          {comparison === "parallel"
            ? `Mesma tónica: ${tonic}. Diferenças em relação a ${tonic} · ${referenceName}.`
            : `Mesmas notas de ${parentTonic.name} maior; cada modo tem a sua tónica e os seus graus.`}{" "}
          Selecciona um modo para o explorar no braço.
        </p>
        {comparison === "relative" && (
          <p className="mt-2 text-xs leading-6 text-muted">
            O centro musical distingue os modos. Começar a tocar noutra nota, por si só, não muda
            esse centro.
          </p>
        )}
      </div>
      <table className={styles.comparisonTable}>
        <caption className="sr-only">
          {comparison === "parallel" ? "Modos com a mesma tónica" : "Modos com as mesmas notas"}
        </caption>
        <thead>
          <tr>
            <th scope="col">Modo</th>
            <th scope="col">Notas, graus e comparação</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.mode} data-selected={row.mode === musicalMode}>
              <th scope="row">
                <button
                  type="button"
                  aria-label={`Explorar ${row.tonic.name} · ${row.name}`}
                  aria-pressed={row.mode === musicalMode}
                  className={styles.modeChoice}
                  onClick={() => onChange({ tonic: row.tonic.name, musicalMode: row.mode })}
                >
                  <span>
                    {row.tonic.name} · {row.name}
                  </span>
                  {row.mode === musicalMode && <small>Em estudo</small>}
                </button>
              </th>
              <td>
                <div className={styles.modeNotes}>
                  {row.notes.map((note) => {
                    const changed = row.differences.some((difference) => difference.note === note);
                    return (
                      <span key={note.degree} data-changed={changed}>
                        <b>{note.name}</b>
                        <small>{note.degree}</small>
                      </span>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs leading-6 text-muted">
                  {comparison === "relative"
                    ? `Tónica: ${row.tonic.name} · 1. Mesmas notas; graus relativos a esta tónica.`
                    : row.differences.length === 0
                      ? "Sem diferenças em relação à referência."
                      : `Diferenças: ${row.differences
                          .map(
                            ({ note, referenceNote }) =>
                              `${note.name}/${note.degree} em vez de ${referenceNote.name}/${referenceNote.degree}`,
                          )
                          .join("; ")}.`}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
