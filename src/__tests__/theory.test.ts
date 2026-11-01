import { describe, expect, it } from "vitest";
import { getNoteMap, NOTE_CHOICES, type NoteSpelling } from "@/lib/theory";

describe("note map", () => {
  it("covers all six standard strings from open through frets 12 and 24", () => {
    const map = getNoteMap();
    expect(map.reference).toMatchObject({ name: "C", pitchClass: 0 });
    expect(map.positions).toHaveLength(150);
    expect(new Set(map.positions.map(({ string, fret }) => `${string}:${fret}`)).size).toBe(150);
    expect(map.positions.every(({ fret }) => fret >= 0 && fret <= 24)).toBe(true);
    const boundaries = map.positions
      .filter(({ fret }) => [0, 12, 24].includes(fret))
      .map(({ string, fret, pitch }) => [
        string,
        fret,
        pitch.name,
        pitch.register,
        pitch.semitones,
      ]);
    expect(boundaries).toEqual([
      [1, 0, "E", 4, 64],
      [1, 12, "E", 5, 76],
      [1, 24, "E", 6, 88],
      [2, 0, "B", 3, 59],
      [2, 12, "B", 4, 71],
      [2, 24, "B", 5, 83],
      [3, 0, "G", 3, 55],
      [3, 12, "G", 4, 67],
      [3, 24, "G", 5, 79],
      [4, 0, "D", 3, 50],
      [4, 12, "D", 4, 62],
      [4, 24, "D", 5, 74],
      [5, 0, "A", 2, 45],
      [5, 12, "A", 3, 57],
      [5, 24, "A", 4, 69],
      [6, 0, "E", 2, 40],
      [6, 12, "E", 3, 52],
      [6, 24, "E", 4, 64],
    ]);
  });

  it("locates the same A2 at two distinct positions", () => {
    const map = getNoteMap({ letter: "A", accidental: 0 });
    const openA = map.positions.find(({ string, fret }) => string === 5 && fret === 0)!;
    const frettedA = map.positions.find(({ string, fret }) => string === 6 && fret === 5)!;

    expect(openA.pitch).toMatchObject({ name: "A", register: 2, semitones: 45, pitchClass: 9 });
    expect(frettedA.pitch).toEqual(openA.pitch);
    expect(openA.isReference).toBe(true);
    expect(frettedA.isReference).toBe(true);
    expect(openA).not.toEqual(frettedA);
  });

  it("accounts for the major third between the G and B strings", () => {
    const map = getNoteMap({ letter: "B", accidental: 0 });
    const openB = map.positions.find(({ string, fret }) => string === 2 && fret === 0)!;
    const frettedB = map.positions.find(({ string, fret }) => string === 3 && fret === 4)!;
    expect(openB.pitch).toMatchObject({ name: "B", register: 3, semitones: 59 });
    expect(frettedB.pitch).toEqual(openB.pitch);
  });

  it("preserves an enharmonic reference while retaining pitch identity", () => {
    const sharp = getNoteMap({ letter: "C", accidental: 1 });
    const flat = getNoteMap({ letter: "D", accidental: -1 });
    const sharpPosition = sharp.positions.find(({ string, fret }) => string === 2 && fret === 2)!;
    const flatPosition = flat.positions.find(({ string, fret }) => string === 2 && fret === 2)!;
    expect(sharpPosition.pitch).toMatchObject({
      name: "C#",
      register: 4,
      semitones: 61,
      pitchClass: 1,
    });
    expect(flatPosition.pitch).toMatchObject({
      name: "Db",
      register: 4,
      semitones: 61,
      pitchClass: 1,
    });
    expect(flatPosition.pitch.equivalents).toEqual(["C#4", "Db4"]);
    expect(
      sharp.positions
        .filter(({ isReference }) => isReference)
        .map(({ string, fret }) => [string, fret]),
    ).toEqual(
      flat.positions
        .filter(({ isReference }) => isReference)
        .map(({ string, fret }) => [string, fret]),
    );
  });

  it("uses the written letter to determine the register across B/C", () => {
    const map = getNoteMap({ letter: "C", accidental: -1 });
    const openB = map.positions.find(({ string, fret }) => string === 2 && fret === 0)!;
    expect(openB.pitch).toMatchObject({ name: "Cb", register: 4, semitones: 59, pitchClass: 11 });
    expect(openB.pitch.equivalents).toEqual(["B3", "Cb4"]);
  });

  it("keeps later maps and the caller's reference independent of returned spellings", () => {
    const firstMap = getNoteMap();
    firstMap.positions[0].pitch.spelling.accidental = 1;
    expect(getNoteMap().positions[0].pitch).toMatchObject({
      spelling: { letter: "E", accidental: 0 },
      name: "E",
      register: 4,
    });

    const reference: NoteSpelling = { letter: "A", accidental: 0 };
    const map = getNoteMap(reference);
    map.positions.find(
      ({ string, fret }) => string === 5 && fret === 0,
    )!.pitch.spelling.accidental = 1;
    expect(reference).toEqual({ letter: "A", accidental: 0 });

    const choice = NOTE_CHOICES.find(({ name }) => name === "E")!;
    const originalAccidental = choice.spelling.accidental;
    try {
      choice.spelling.accidental = 1;
      expect(getNoteMap().positions[0].pitch).toMatchObject({
        spelling: { letter: "E", accidental: 0 },
        name: "E",
        register: 4,
      });
    } finally {
      choice.spelling.accidental = originalAccidental;
    }
  });
});
