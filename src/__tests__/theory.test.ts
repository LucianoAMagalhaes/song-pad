import { describe, expect, it } from "vitest";
import {
  describeInterval,
  getIntervalMap,
  getNoteMap,
  INTERVAL_CHOICES,
  NOTE_CHOICES,
  type NoteSpelling,
} from "@/lib/theory";

describe("relative intervals", () => {
  it.each([
    ["1J", "C", "Uníssono", 0],
    ["2m", "Db", "Segunda menor", 1],
    ["2M", "D", "Segunda maior", 2],
    ["3m", "Eb", "Terça menor", 3],
    ["3M", "E", "Terça maior", 4],
    ["4J", "F", "Quarta justa", 5],
    ["4A", "F#", "Quarta aumentada", 6],
    ["5d", "Gb", "Quinta diminuta", 6],
    ["5J", "G", "Quinta justa", 7],
    ["6m", "Ab", "Sexta menor", 8],
    ["6M", "A", "Sexta maior", 9],
    ["7m", "Bb", "Sétima menor", 10],
    ["7M", "B", "Sétima maior", 11],
    ["8J", "C", "Oitava justa", 12],
  ])("maps %s from C across the full fretboard", (short, name, intervalName, semitones) => {
    const map = getIntervalMap(
      { letter: "C", accidental: 0 },
      INTERVAL_CHOICES.find((choice) => choice.short === short)!,
    );
    expect(map.positions).toHaveLength(150);
    expect(map.interval).toMatchObject({ name: intervalName, semitones });
    expect(map.target.name).toBe(name);
    const targets = map.positions.filter(({ isTarget }) => isTarget);
    expect(targets.length).toBeGreaterThanOrEqual(12);
    expect(targets.every(({ pitch }) => pitch.name === name)).toBe(true);
    expect(new Set(targets.map(({ pitch }) => pitch.register)).size).toBeGreaterThanOrEqual(4);
    if (short === "1J" || short === "8J") {
      expect(targets.every(({ isReference }) => isReference)).toBe(true);
      expect(targets.find(({ string, fret }) => string === 2 && fret === 1)!.pitch.register).toBe(
        4,
      );
    }
  });

  it.each([
    ["C#", "3M", "E#", 4, 65, { letter: "E", accidental: 1 }],
    ["D#", "3M", "F##", 4, 67, { letter: "F", accidental: 2 }],
    ["G#", "3M", "B#", 3, 60, { letter: "B", accidental: 1 }],
    ["Db", "7m", "Cb", 4, 59, { letter: "C", accidental: -1 }],
  ] as const)(
    "preserves contextual spelling and register from %s via %s",
    (root, short, name, register, semitones, spelling) => {
      const map = getIntervalMap(
        NOTE_CHOICES.find((choice) => choice.name === root)!.spelling,
        INTERVAL_CHOICES.find((choice) => choice.short === short)!,
      );
      const target = map.positions.find(({ pitch }) => pitch.semitones === semitones)!;
      expect(target.pitch).toMatchObject({ name, register, semitones, spelling });
      expect(target.isTarget).toBe(true);
    },
  );

  it("spells the augmented fourth and diminished fifth separately at the same positions", () => {
    const augmented = getIntervalMap(
      { letter: "C", accidental: 0 },
      INTERVAL_CHOICES.find(({ short }) => short === "4A")!,
    );
    const diminished = getIntervalMap(
      { letter: "C", accidental: 0 },
      INTERVAL_CHOICES.find(({ short }) => short === "5d")!,
    );
    expect(augmented.target).toEqual({
      name: "F#",
      spelling: { letter: "F", accidental: 1 },
      pitchClass: 6,
    });
    expect(diminished.target).toEqual({
      name: "Gb",
      spelling: { letter: "G", accidental: -1 },
      pitchClass: 6,
    });
    const sharp = augmented.positions.find(({ string, fret }) => string === 1 && fret === 2)!;
    const flat = diminished.positions.find(({ string, fret }) => string === 1 && fret === 2)!;
    expect(sharp).toMatchObject({
      isTarget: true,
      isReference: false,
      pitch: { name: "F#", register: 4, semitones: 66 },
    });
    expect(flat).toMatchObject({
      isTarget: true,
      isReference: false,
      pitch: { name: "Gb", register: 4, semitones: 66 },
    });
    const c4 = augmented.positions.find(({ string, fret }) => string === 2 && fret === 1)!.pitch;
    expect(describeInterval(c4, sharp.pitch)).toMatchObject({
      name: "Quarta aumentada",
      semitones: 6,
      degree: 4,
    });
    expect(describeInterval(c4, flat.pitch)).toMatchObject({
      name: "Quinta diminuta",
      semitones: 6,
      degree: 5,
    });
    expect(
      augmented.positions
        .filter(({ isTarget }) => isTarget)
        .map(({ string, fret }) => [string, fret]),
    ).toEqual(
      diminished.positions
        .filter(({ isTarget }) => isTarget)
        .map(({ string, fret }) => [string, fret]),
    );
  });
});

describe("intervals between concrete pitches", () => {
  it("keeps a written compound interval generic even when its chromatic distance is below twelve", () => {
    const map = getIntervalMap(
      { letter: "D", accidental: -1 },
      INTERVAL_CHOICES.find(({ short }) => short === "2m")!,
    );
    const from = map.positions.find(({ pitch }) => pitch.semitones === 74)!.pitch;
    const to = map.positions.find(({ pitch }) => pitch.semitones === 63)!.pitch;
    expect(from).toMatchObject({ name: "Ebb", register: 5 });
    expect(to).toMatchObject({ name: "D#", register: 4 });
    expect(describeInterval(from, to)).toEqual({
      name: "Fora dos intervalos simples",
      direction: "descending",
      semitones: 11,
      degree: null,
      isCompound: true,
    });
  });
  it("recognizes unison at different positions, octaves, and distances beyond an octave", () => {
    const positions = getNoteMap().positions;
    const at = (stringNumber: number, fretNumber: number) =>
      positions.find(({ string, fret }) => string === stringNumber && fret === fretNumber)!.pitch;
    expect(describeInterval(at(5, 0), at(6, 5))).toEqual({
      name: "Uníssono",
      direction: "same",
      semitones: 0,
      degree: 1,
      isCompound: false,
    });
    expect(describeInterval(at(6, 0), at(6, 12))).toEqual({
      name: "Oitava justa",
      direction: "ascending",
      semitones: 12,
      degree: 8,
      isCompound: false,
    });
    expect(describeInterval(at(5, 3), at(1, 0))).toEqual({
      name: "Mais de uma oitava",
      direction: "ascending",
      semitones: 16,
      degree: null,
      isCompound: true,
    });
    expect(describeInterval(at(1, 0), at(5, 3))).toMatchObject({
      name: "Mais de uma oitava",
      direction: "descending",
      semitones: 16,
      isCompound: true,
    });
  });
  it("distinguishes an ascending fifth from a descending fourth starting at C4", () => {
    const positions = getNoteMap().positions;
    const c4 = positions.find(({ string, fret }) => string === 2 && fret === 1)!.pitch;
    const g4 = positions.find(({ string, fret }) => string === 1 && fret === 3)!.pitch;
    const g3 = positions.find(({ string, fret }) => string === 3 && fret === 0)!.pitch;
    expect(describeInterval(c4, g4)).toEqual({
      name: "Quinta justa",
      direction: "ascending",
      semitones: 7,
      degree: 5,
      isCompound: false,
    });
    expect(describeInterval(c4, g3)).toEqual({
      name: "Quarta justa",
      direction: "descending",
      semitones: 5,
      degree: 4,
      isCompound: false,
    });
  });
});

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
