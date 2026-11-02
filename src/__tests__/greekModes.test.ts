import { describe, expect, it } from "vitest";
import {
  getModeComparison,
  getModeMap,
  getScaleMap,
  GREEK_MODE_CHOICES,
  NOTE_CHOICES,
  parseNoteSpelling,
  type GreekMode,
} from "@/lib/theory";

describe("Greek modes with contextual spelling", () => {
  const examples: { mode: GreekMode; names: string[]; degrees: string[] }[] = [
    {
      mode: "ionian",
      names: ["D", "E", "F#", "G", "A", "B", "C#"],
      degrees: ["1", "2", "3", "4", "5", "6", "7"],
    },
    {
      mode: "dorian",
      names: ["D", "E", "F", "G", "A", "B", "C"],
      degrees: ["1", "2", "b3", "4", "5", "6", "b7"],
    },
    {
      mode: "phrygian",
      names: ["D", "Eb", "F", "G", "A", "Bb", "C"],
      degrees: ["1", "b2", "b3", "4", "5", "b6", "b7"],
    },
    {
      mode: "lydian",
      names: ["D", "E", "F#", "G#", "A", "B", "C#"],
      degrees: ["1", "2", "3", "#4", "5", "6", "7"],
    },
    {
      mode: "mixolydian",
      names: ["D", "E", "F#", "G", "A", "B", "C"],
      degrees: ["1", "2", "3", "4", "5", "6", "b7"],
    },
    {
      mode: "aeolian",
      names: ["D", "E", "F", "G", "A", "Bb", "C"],
      degrees: ["1", "2", "b3", "4", "5", "b6", "b7"],
    },
    {
      mode: "locrian",
      names: ["D", "Eb", "F", "G", "Ab", "Bb", "C"],
      degrees: ["1", "b2", "b3", "4", "b5", "b6", "b7"],
    },
  ];
  it.each(examples)("builds D $mode and its own diatonic degrees", ({ mode, names, degrees }) => {
    const map = getModeMap({ letter: "D", accidental: 0 }, mode);
    expect(map.notes.map((note) => note.name)).toEqual(names);
    expect(map.notes.map((note) => note.degree)).toEqual(degrees);
    expect(map.positions).toHaveLength(150);
    expect(map.positions.find(({ string, fret }) => string === 4 && fret === 0)).toMatchObject({
      isReference: true,
      scaleNote: { name: "D", degree: "1" },
    });
  });

  it("covers every available tonic, all frets and seven relative modes without changing the collection", () => {
    for (const tonic of NOTE_CHOICES) {
      for (const { id } of GREEK_MODE_CHOICES) {
        const map = getModeMap(tonic.spelling, id);
        const names = map.notes.map((note) => note.name).sort();
        const classes = map.notes.map((note) => note.pitchClass);
        expect(new Set(classes).size).toBe(7);
        for (const position of map.positions) {
          expect(Boolean(position.scaleNote)).toBe(classes.includes(position.pitch.pitchClass));
          expect(position.isReference).toBe(position.pitch.pitchClass === classes[0]);
          if (position.scaleNote) expect(position.pitch.name).toBe(position.scaleNote.name);
        }
        const { rows } = getModeComparison(tonic.spelling, id, "relative");
        expect(new Set(rows.map((row) => row.tonic.name)).size).toBe(7);
        for (const row of rows) {
          expect(row.notes.map((note) => note.name).sort()).toEqual(names);
          expect(row.notes[0]).toMatchObject({ degree: "1", name: row.tonic.name });
          expect(row.differences).toEqual([]);
        }
      }
      expect(getModeMap(tonic.spelling, "ionian").positions).toEqual(
        getScaleMap(tonic.spelling, "major").positions,
      );
      expect(getModeMap(tonic.spelling, "aeolian").notes).toEqual(
        getScaleMap(tonic.spelling, "natural-minor").notes,
      );
    }
  });

  it("compares any parallel reference by written degree, without changing the scale in study", () => {
    const { rows } = getModeComparison(
      { letter: "D", accidental: 0 },
      "dorian",
      "parallel",
      "aeolian",
    );
    expect(rows.every((row) => row.tonic.name === "D")).toBe(true);
    expect(rows.find((row) => row.mode === "dorian")!.differences).toMatchObject([
      { note: { name: "B", degree: "6" }, referenceNote: { name: "Bb", degree: "b6" } },
    ]);
    expect(rows.find((row) => row.mode === "aeolian")!.differences).toEqual([]);
    const changedReference = getModeComparison(
      { letter: "D", accidental: 0 },
      "dorian",
      "parallel",
      "ionian",
    );
    expect(changedReference.rows.find((row) => row.mode === "dorian")!.notes).toEqual(
      rows.find((row) => row.mode === "dorian")!.notes,
    );
  });

  it("retains uncommon relative tonics and augmented/diminished interval names", () => {
    const { rows } = getModeComparison({ letter: "C", accidental: 1 }, "ionian", "relative");
    const phrygian = rows.find((row) => row.mode === "phrygian")!;
    expect(phrygian.tonic.name).toBe("E#");
    const map = getModeMap(phrygian.tonic.spelling, phrygian.mode);
    expect(map.notes.map((note) => note.name)).toEqual(["E#", "F#", "G#", "A#", "B#", "C#", "D#"]);
    expect(map.positions.find(({ string, fret }) => string === 1 && fret === 1)).toMatchObject({
      pitch: { name: "E#", register: 4 },
      isReference: true,
    });
    expect(getModeMap({ letter: "D", accidental: 1 }, "lydian").notes[3]).toMatchObject({
      name: "G##",
      degree: "#4",
      interval: { name: "Quarta aumentada" },
    });
    expect(getModeMap({ letter: "D", accidental: 0 }, "locrian").notes[4].interval.name).toBe(
      "Quinta diminuta",
    );
  });

  it("parses contextual tonics and rejects malformed note names", () => {
    expect(parseNoteSpelling("E#")).toEqual({ letter: "E", accidental: 1 });
    expect(parseNoteSpelling("Bbb")).toEqual({ letter: "B", accidental: -2 });
    for (const name of ["H", "", "C#b", " c", "C4", "C\n"])
      expect(parseNoteSpelling(name)).toBeNull();
  });
});
