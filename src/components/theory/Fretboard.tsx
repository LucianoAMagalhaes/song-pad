import type { KeyboardEvent } from "react";
import type { NotePosition, ScaleNote } from "@/lib/theory";
import styles from "./theory.module.css";

interface FretboardProps {
  positions: (NotePosition & { isTarget?: boolean; scaleNote?: ScaleNote | null })[];
  selected: NotePosition;
  onSelect: (position: NotePosition) => void;
  onNavigate?: (position: NotePosition) => void;
  showOtherNotes: boolean;
  targetLabel?: string;
  scaleReading?: "notes" | "degrees";
}

/** A continuous right-handed fretboard with one keyboard entry point. */
export function Fretboard({
  positions,
  selected,
  onSelect,
  onNavigate = onSelect,
  showOtherNotes,
  targetLabel,
  scaleReading,
}: FretboardProps) {
  function navigate(event: KeyboardEvent<HTMLButtonElement>, position: NotePosition) {
    let { string, fret } = position;
    switch (event.key) {
      case "ArrowLeft":
        fret = Math.max(0, fret - 1);
        break;
      case "ArrowRight":
        fret = Math.min(24, fret + 1);
        break;
      case "ArrowUp":
        string = Math.max(1, string - 1);
        break;
      case "ArrowDown":
        string = Math.min(6, string + 1);
        break;
      case "Home":
        fret = 0;
        break;
      case "End":
        fret = 24;
        break;
      default:
        return;
    }
    event.preventDefault();
    const next = positions.find(
      (candidate) => candidate.string === string && candidate.fret === fret,
    )!;
    onNavigate(next);
    event.currentTarget
      .closest("table")
      ?.querySelector<HTMLButtonElement>(`button[data-string="${string}"][data-fret="${fret}"]`)
      ?.focus();
  }

  return (
    <div className={styles.scroll}>
      <table
        role="grid"
        aria-label="Braço da guitarra"
        aria-describedby="fretboard-help"
        className={styles.fretboard}
      >
        <thead>
          <tr>
            <th scope="col" className={styles.stringLabel}>
              Corda
            </th>
            {Array.from({ length: 25 }, (_, fret) => (
              <th scope="col" key={fret}>
                {fret}
                {[12, 24].includes(fret) ? " ◇" : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }, (_, index) => index + 1).map((string) => {
            const row = positions.filter((position) => position.string === string);
            return (
              <tr key={string}>
                <th scope="row" className={styles.stringLabel}>
                  {string}.ª {["E", "B", "G", "D", "A", "E"][string - 1]}
                </th>
                {row.map((position) => {
                  const isSelected =
                    position.string === selected.string && position.fret === selected.fret;
                  const { scaleNote } = position;
                  const functions = [
                    position.isReference ? (scaleReading ? "tónica" : "referência") : "",
                    position.isTarget ? targetLabel : "",
                    scaleReading ? (scaleNote ? `grau ${scaleNote.degree}` : "fora da escala") : "",
                  ].filter(Boolean);
                  const symbols = [
                    position.isReference ? (scaleReading ? "T" : "R") : "",
                    position.isTarget ? targetLabel : "",
                    scaleReading === "notes" ? scaleNote?.degree : "",
                  ]
                    .filter(Boolean)
                    .join("/");
                  const showName =
                    position.isReference ||
                    position.isTarget ||
                    scaleNote ||
                    showOtherNotes ||
                    isSelected;
                  const label =
                    scaleReading === "degrees" && scaleNote
                      ? scaleNote.degree
                      : showName
                        ? position.pitch.name
                        : "·";
                  return (
                    <td
                      key={position.fret}
                      aria-selected={isSelected}
                      className={position.fret === 0 ? styles.openString : undefined}
                    >
                      <button
                        type="button"
                        data-string={position.string}
                        data-fret={position.fret}
                        aria-label={`${position.pitch.name}${position.pitch.register}, ${string}.ª corda, casa ${position.fret}${position.fret === 0 ? ", corda solta" : ""}${functions.length ? `, ${functions.join(", ")}` : ""}`}
                        aria-pressed={isSelected}
                        tabIndex={isSelected ? 0 : -1}
                        onClick={() => onSelect(position)}
                        onKeyDown={(event) => navigate(event, position)}
                        className={styles.position}
                      >
                        <span
                          aria-hidden="true"
                          className={`${styles.marker} ${position.isTarget ? styles.target : ""} ${position.scaleNote ? styles.scaleMember : ""} ${position.isReference ? styles.reference : ""} ${isSelected ? styles.selected : ""}`}
                        >
                          {label}
                          {symbols && <small>{symbols}</small>}
                        </span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
