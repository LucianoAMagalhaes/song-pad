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
        pitch: {
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
        },
      };
    }),
  );
  return { reference: { name: noteName(reference), pitchClass: referenceClass }, positions };
}
