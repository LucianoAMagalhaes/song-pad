export interface NoteSpelling {
  letter: "A" | "B" | "C" | "D" | "E" | "F" | "G";
  accidental: number;
}

export interface Pitch {
  spelling: NoteSpelling;
  name: string;
  register: number;
  /** Integer semitones with C4 = 60; independent of spelling. */
  semitones: number;
  pitchClass: number;
  equivalents: string[];
}

export interface NotePosition {
  /** Right-handed standard tuning: string 1 is the high E. */
  string: number;
  /** Zero denotes an open string. */
  fret: number;
  pitch: Pitch;
  isReference: boolean;
}

export interface SimpleInterval {
  degree: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  semitones: number;
}

export interface IntervalPosition extends NotePosition {
  isTarget: boolean;
}

export type ScaleFamily = "major" | "natural-minor" | "major-pentatonic" | "minor-pentatonic";

export interface ScaleNote {
  name: string;
  spelling: NoteSpelling;
  pitchClass: number;
  degree: string;
  interval: SimpleInterval & { name: string };
}

export interface ScalePosition extends NotePosition {
  /** Null for positions outside the chosen scale. */
  scaleNote: ScaleNote | null;
}

export interface IntervalComparison {
  name: string;
  direction: "ascending" | "descending" | "same";
  semitones: number;
  degree: number | null;
  isCompound: boolean;
}

const NATURAL_CLASSES: Record<NoteSpelling["letter"], number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};
const USUAL_SPELLINGS: readonly (readonly NoteSpelling[])[] = [
  [{ letter: "C", accidental: 0 }],
  [
    { letter: "C", accidental: 1 },
    { letter: "D", accidental: -1 },
  ],
  [{ letter: "D", accidental: 0 }],
  [
    { letter: "D", accidental: 1 },
    { letter: "E", accidental: -1 },
  ],
  [{ letter: "E", accidental: 0 }],
  [{ letter: "F", accidental: 0 }],
  [
    { letter: "F", accidental: 1 },
    { letter: "G", accidental: -1 },
  ],
  [{ letter: "G", accidental: 0 }],
  [
    { letter: "G", accidental: 1 },
    { letter: "A", accidental: -1 },
  ],
  [{ letter: "A", accidental: 0 }],
  [
    { letter: "A", accidental: 1 },
    { letter: "B", accidental: -1 },
  ],
  [{ letter: "B", accidental: 0 }],
];
const OPEN_STRING_SEMITONES = [64, 59, 55, 50, 45, 40];
const LETTERS: readonly NoteSpelling["letter"][] = ["C", "D", "E", "F", "G", "A", "B"];
const MAJOR_SEMITONES = [0, 2, 4, 5, 7, 9, 11, 12];
const INTERVAL_NAMES = [
  "Uníssono",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sétima",
  "Oitava",
];

function intervalName(degree: number, semitones: number): string {
  const difference = semitones - MAJOR_SEMITONES[degree - 1];
  const perfect = [1, 4, 5, 8].includes(degree);
  const name = INTERVAL_NAMES[degree - 1];
  if (difference === 0) return degree === 1 ? name : `${name} ${perfect ? "justa" : "maior"}`;
  if (!perfect && difference === -1) return `${name} menor`;
  const alterations = difference > 0 ? difference : -difference - (perfect ? 0 : 1);
  const quality =
    degree === 1
      ? difference > 0
        ? "aumentado"
        : "diminuto"
      : difference > 0
        ? "aumentada"
        : "diminuta";
  const prefix =
    alterations === 1 ? "" : alterations === 2 ? "duplamente " : `${alterations} vezes `;
  return `${name} ${prefix}${quality}`;
}

/** Simple relations retain distinct diatonic functions even at the same distance. */
export const INTERVAL_CHOICES = (
  [
    { short: "1J", degree: 1, semitones: 0 },
    { short: "2m", degree: 2, semitones: 1 },
    { short: "2M", degree: 2, semitones: 2 },
    { short: "3m", degree: 3, semitones: 3 },
    { short: "3M", degree: 3, semitones: 4 },
    { short: "4J", degree: 4, semitones: 5 },
    { short: "4A", degree: 4, semitones: 6 },
    { short: "5d", degree: 5, semitones: 6 },
    { short: "5J", degree: 5, semitones: 7 },
    { short: "6m", degree: 6, semitones: 8 },
    { short: "6M", degree: 6, semitones: 9 },
    { short: "7m", degree: 7, semitones: 10 },
    { short: "7M", degree: 7, semitones: 11 },
    { short: "8J", degree: 8, semitones: 12 },
  ] satisfies (SimpleInterval & { short: string })[]
).map((interval) => ({ ...interval, name: intervalName(interval.degree, interval.semitones) }));

/** Describes the directed distance between concrete pitches, using their written letters. */
export function describeInterval(from: Pitch, to: Pitch): IntervalComparison {
  const difference = to.semitones - from.semitones;
  const semitones = Math.abs(difference);
  const direction = difference > 0 ? "ascending" : difference < 0 ? "descending" : "same";
  if (semitones > 12) {
    return { name: "Mais de uma oitava", direction, semitones, degree: null, isCompound: true };
  }
  const fromStep = from.register * 7 + LETTERS.indexOf(from.spelling.letter);
  const toStep = to.register * 7 + LETTERS.indexOf(to.spelling.letter);
  const degree = Math.abs(toStep - fromStep) + 1;
  if (degree > 8) {
    return {
      name: "Fora dos intervalos simples",
      direction,
      semitones,
      degree: null,
      isCompound: true,
    };
  }
  return {
    name: intervalName(degree, semitones),
    direction,
    semitones,
    degree,
    isCompound: false,
  };
}

function pitchClass(semitones: number): number {
  return ((semitones % 12) + 12) % 12;
}

function noteName({ letter, accidental }: NoteSpelling): string {
  return letter + (accidental < 0 ? "b".repeat(-accidental) : "#".repeat(accidental));
}

/** Common free-exploration spellings; enharmonic choices remain distinct. */
export const NOTE_CHOICES = USUAL_SPELLINGS.flat().map((spelling) => ({
  name: noteName(spelling),
  spelling: { ...spelling },
}));

function register(semitones: number, spelling: NoteSpelling): number {
  return (semitones - NATURAL_CLASSES[spelling.letter] - spelling.accidental) / 12 - 1;
}

function buildPitch(semitones: number, spelling: NoteSpelling): Pitch {
  const noteClass = pitchClass(semitones);
  return {
    spelling: { ...spelling },
    name: noteName(spelling),
    register: register(semitones, spelling),
    semitones,
    pitchClass: noteClass,
    equivalents: Array.from(
      new Set(
        [...USUAL_SPELLINGS[noteClass], spelling].map(
          (equivalent) => `${noteName(equivalent)}${register(semitones, equivalent)}`,
        ),
      ),
    ),
  };
}

function spellInterval(reference: NoteSpelling, interval: SimpleInterval) {
  const referenceIndex = LETTERS.indexOf(reference.letter);
  const targetIndex = referenceIndex + interval.degree - 1;
  const letter = LETTERS[targetIndex % 7];
  const targetNatural = NATURAL_CLASSES[letter] + Math.floor(targetIndex / 7) * 12;
  const accidental =
    NATURAL_CLASSES[reference.letter] + reference.accidental + interval.semitones - targetNatural;
  const spelling = { letter, accidental };
  return { name: noteName(spelling), spelling, pitchClass: pitchClass(targetNatural + accidental) };
}

/** Builds a relative map across all registers; this is not a distance between two positions. */
export function getIntervalMap(reference: NoteSpelling, interval: SimpleInterval) {
  const map = getNoteMap(reference);
  const target = spellInterval(reference, interval);
  const positions: IntervalPosition[] = map.positions.map((position) => {
    const isTarget = position.pitch.pitchClass === target.pitchClass;
    return {
      ...position,
      isTarget,
      pitch: isTarget ? buildPitch(position.pitch.semitones, target.spelling) : position.pitch,
    };
  });
  return {
    ...map,
    target,
    interval: { ...interval, name: intervalName(interval.degree, interval.semitones) },
    positions,
  };
}

/** Builds the complete 0–24 note map locally, preserving the reference spelling. */
export function getNoteMap(reference: NoteSpelling = { letter: "C", accidental: 0 }) {
  const referenceClass = pitchClass(NATURAL_CLASSES[reference.letter] + reference.accidental);
  const positions: NotePosition[] = OPEN_STRING_SEMITONES.flatMap((open, stringIndex) =>
    Array.from({ length: 25 }, (_, fret) => {
      const semitones = open + fret;
      const noteClass = pitchClass(semitones);
      const isReference = noteClass === referenceClass;
      const spelling = isReference ? reference : USUAL_SPELLINGS[noteClass][0];
      return {
        string: stringIndex + 1,
        fret,
        isReference,
        pitch: buildPitch(semitones, spelling),
      };
    }),
  );
  return { reference: { name: noteName(reference), pitchClass: referenceClass }, positions };
}

/** The four approved scale families, with diatonic rather than sequential degrees. */
export const SCALE_CHOICES = [
  {
    id: "major",
    name: "Maior",
    formula: [
      { degree: 1, semitones: 0 },
      { degree: 2, semitones: 2 },
      { degree: 3, semitones: 4 },
      { degree: 4, semitones: 5 },
      { degree: 5, semitones: 7 },
      { degree: 6, semitones: 9 },
      { degree: 7, semitones: 11 },
    ],
  },
  {
    id: "natural-minor",
    name: "Menor natural",
    formula: [
      { degree: 1, semitones: 0 },
      { degree: 2, semitones: 2 },
      { degree: 3, semitones: 3 },
      { degree: 4, semitones: 5 },
      { degree: 5, semitones: 7 },
      { degree: 6, semitones: 8 },
      { degree: 7, semitones: 10 },
    ],
  },
  {
    id: "major-pentatonic",
    name: "Pentatónica maior",
    formula: [
      { degree: 1, semitones: 0 },
      { degree: 2, semitones: 2 },
      { degree: 3, semitones: 4 },
      { degree: 5, semitones: 7 },
      { degree: 6, semitones: 9 },
    ],
  },
  {
    id: "minor-pentatonic",
    name: "Pentatónica menor",
    formula: [
      { degree: 1, semitones: 0 },
      { degree: 3, semitones: 3 },
      { degree: 4, semitones: 5 },
      { degree: 5, semitones: 7 },
      { degree: 7, semitones: 10 },
    ],
  },
] as const satisfies readonly {
  id: ScaleFamily;
  name: string;
  formula: readonly SimpleInterval[];
}[];

/** Builds scale functions across all registers, reusing contextual interval spelling. */
export function getScaleMap(tonic: NoteSpelling, family: ScaleFamily) {
  const map = getNoteMap(tonic);
  const scale = SCALE_CHOICES.find(({ id }) => id === family)!;
  const notes: ScaleNote[] = scale.formula.map((interval) => {
    const target = spellInterval(tonic, interval);
    const alteration = interval.semitones - MAJOR_SEMITONES[interval.degree - 1];
    const prefix = alteration < 0 ? "b".repeat(-alteration) : "#".repeat(alteration);
    return {
      ...target,
      degree: `${prefix}${interval.degree}`,
      interval: { ...interval, name: intervalName(interval.degree, interval.semitones) },
    };
  });
  const positions: ScalePosition[] = map.positions.map((position) => {
    const scaleNote = notes.find((note) => note.pitchClass === position.pitch.pitchClass) ?? null;
    return {
      ...position,
      scaleNote,
      pitch: scaleNote ? buildPitch(position.pitch.semitones, scaleNote.spelling) : position.pitch,
    };
  });
  return { ...map, family, name: scale.name, notes, positions };
}
