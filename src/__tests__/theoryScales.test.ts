import { describe, expect, it } from "vitest";
import { getScaleMap, NOTE_CHOICES, type ScaleFamily } from "@/lib/theory";

describe("scale maps", () => {
  const families: { family: ScaleFamily; offsets: number[]; degrees: string[] }[] = [
    {
      family: "major",
      offsets: [0, 2, 4, 5, 7, 9, 11],
      degrees: ["1", "2", "3", "4", "5", "6", "7"],
    },
    {
      family: "natural-minor",
      offsets: [0, 2, 3, 5, 7, 8, 10],
      degrees: ["1", "2", "b3", "4", "5", "b6", "b7"],
    },
    { family: "major-pentatonic", offsets: [0, 2, 4, 7, 9], degrees: ["1", "2", "3", "5", "6"] },
    { family: "minor-pentatonic", offsets: [0, 3, 5, 7, 10], degrees: ["1", "b3", "4", "5", "b7"] },
  ];
  describe.each(families)(
    "$family in all twelve tonic classes and their usual spellings",
    ({ family, offsets, degrees }) => {
      it.each(NOTE_CHOICES)(
        "preserves musical functions from $name across the complete map",
        ({ spelling, name }) => {
          const map = getScaleMap(spelling, family);
          expect(map.reference.name).toBe(name);
          expect(map.notes[0]).toMatchObject({ name, spelling, degree: "1" });
          expect(map.notes.map(({ degree }) => degree)).toEqual(degrees);
          expect(new Set(map.notes.map(({ pitchClass }) => pitchClass)).size).toBe(offsets.length);
          expect(
            map.notes.map(({ pitchClass }) => (pitchClass - map.reference.pitchClass + 12) % 12),
          ).toEqual(offsets);
          expect(map.positions).toHaveLength(150);
          for (const position of map.positions) {
            const offset = (position.pitch.pitchClass - map.reference.pitchClass + 12) % 12;
            expect(Boolean(position.scaleNote)).toBe(offsets.includes(offset));
            expect(position.isReference).toBe(offset === 0);
            if (position.scaleNote) {
              expect(position.scaleNote.degree).toBe(degrees[offsets.indexOf(offset)]);
              expect(position.pitch.name).toBe(position.scaleNote.name);
              expect(position.pitch.spelling).toEqual(position.scaleNote.spelling);
            }
          }
        },
      );
    },
  );

  it("keeps pentatonic functions between octaves instead of using list indices or real distances", () => {
    const major = getScaleMap({ letter: "C", accidental: 0 }, "major-pentatonic");
    const minor = getScaleMap({ letter: "C", accidental: 0 }, "minor-pentatonic");
    expect(
      major.positions
        .filter(({ string, fret }) => string === 3 && [0, 12, 24].includes(fret))
        .map(({ pitch, scaleNote }) => [
          pitch.name,
          pitch.register,
          scaleNote?.degree,
          scaleNote?.interval.name,
          scaleNote?.interval.semitones,
        ]),
    ).toEqual([
      ["G", 3, "5", "Quinta justa", 7],
      ["G", 4, "5", "Quinta justa", 7],
      ["G", 5, "5", "Quinta justa", 7],
    ]);
    expect(
      minor.positions
        .filter(({ string, fret }) => string === 4 && [1, 13].includes(fret))
        .map(({ pitch, scaleNote }) => [
          pitch.name,
          pitch.register,
          scaleNote?.degree,
          scaleNote?.interval.name,
        ]),
    ).toEqual([
      ["Eb", 3, "b3", "Terça menor"],
      ["Eb", 4, "b3", "Terça menor"],
    ]);
  });

  it("retains C# major spelling, including written registers of E# and B#", () => {
    const sharp = getScaleMap({ letter: "C", accidental: 1 }, "major");
    const flat = getScaleMap({ letter: "D", accidental: -1 }, "major");
    expect(sharp.notes.map(({ name }) => name)).toEqual(["C#", "D#", "E#", "F#", "G#", "A#", "B#"]);
    expect(flat.notes.map(({ name }) => name)).toEqual(["Db", "Eb", "F", "Gb", "Ab", "Bb", "C"]);
    expect(sharp.positions.find(({ string, fret }) => string === 1 && fret === 1)).toMatchObject({
      pitch: { name: "E#", register: 4, semitones: 65 },
      scaleNote: { degree: "3", interval: { name: "Terça maior" } },
    });
    expect(sharp.positions.find(({ string, fret }) => string === 2 && fret === 1)).toMatchObject({
      pitch: { name: "B#", register: 3, semitones: 60 },
      scaleNote: { degree: "7", interval: { name: "Sétima maior" } },
    });
    expect(sharp.positions.map(({ pitch }) => pitch.semitones)).toEqual(
      flat.positions.map(({ pitch }) => pitch.semitones),
    );
    expect(sharp.positions.map(({ scaleNote }) => scaleNote?.degree)).toEqual(
      flat.positions.map(({ scaleNote }) => scaleNote?.degree),
    );
    expect(
      getScaleMap({ letter: "D", accidental: 1 }, "major").notes.map(({ name }) => name),
    ).toEqual(["D#", "E#", "F##", "G#", "A#", "B#", "C##"]);
  });

  it.each([
    [
      "natural-minor",
      ["C", "D", "Eb", "F", "G", "Ab", "Bb"],
      ["1", "2", "b3", "4", "5", "b6", "b7"],
      [0, 2, 3, 5, 7, 8, 10],
    ],
    ["major-pentatonic", ["C", "D", "E", "G", "A"], ["1", "2", "3", "5", "6"], [0, 2, 4, 7, 9]],
    [
      "minor-pentatonic",
      ["C", "Eb", "F", "G", "Bb"],
      ["1", "b3", "4", "5", "b7"],
      [0, 3, 5, 7, 10],
    ],
  ] as const)(
    "builds the explicit C %s formula without renumbering pentatonic degrees",
    (family, names, degrees, semitones) => {
      const map = getScaleMap({ letter: "C", accidental: 0 }, family);
      expect(map.notes.map(({ name }) => name)).toEqual(names);
      expect(map.notes.map(({ degree }) => degree)).toEqual(degrees);
      expect(map.notes.map(({ interval }) => interval.semitones)).toEqual(semitones);
      if (family === "minor-pentatonic") {
        expect(map.notes[1].interval.name).toBe("Terça menor");
      }
      if (family === "major-pentatonic") {
        expect(map.notes[3].interval.name).toBe("Quinta justa");
      }
    },
  );
  it("builds C major with its diatonic degrees and simple formula intervals", () => {
    const map = getScaleMap({ letter: "C", accidental: 0 }, "major");
    expect(
      map.notes.map(({ name, degree, interval }) => [
        name,
        degree,
        interval.name,
        interval.semitones,
      ]),
    ).toEqual([
      ["C", "1", "Uníssono", 0],
      ["D", "2", "Segunda maior", 2],
      ["E", "3", "Terça maior", 4],
      ["F", "4", "Quarta justa", 5],
      ["G", "5", "Quinta justa", 7],
      ["A", "6", "Sexta maior", 9],
      ["B", "7", "Sétima maior", 11],
    ]);
    expect(map.positions).toHaveLength(150);
    expect(map.positions.find(({ string, fret }) => string === 3 && fret === 0)).toMatchObject({
      isReference: false,
      scaleNote: { name: "G", degree: "5" },
      pitch: { name: "G", register: 3 },
    });
    expect(map.positions.find(({ string, fret }) => string === 2 && fret === 1)).toMatchObject({
      isReference: true,
      scaleNote: { name: "C", degree: "1" },
      pitch: { name: "C", register: 4 },
    });
    expect(
      map.positions.find(({ string, fret }) => string === 1 && fret === 2)!.scaleNote,
    ).toBeNull();
  });
});
