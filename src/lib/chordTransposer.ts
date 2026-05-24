/**
 * Chord transposition for ChordPro content.
 *
 * `transposeChord` shifts a single chord token by a number of semitones,
 * preserving the suffix (m, 7, sus4, maj7, m7b5, ...) and handling slash
 * chords (C/E) on both sides. `transposeContent` applies the same shift to
 * every bracketed chord inside a ChordPro string, leaving lyrics untouched.
 */

export interface TransposeOptions {
  /**
   * When true, accidentals in the output use flats (Db, Eb, Gb, Ab, Bb).
   * Defaults to false, which favours sharps (C#, D#, F#, G#, A#).
   */
  preferFlats?: boolean;
}

const SHARP_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
const FLAT_NOTES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"] as const;

const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

const CHORD_TOKEN = /^([A-G][#b]?)([^/]*)(?:\/([A-G][#b]?))?$/;

/** Transpose a single chord token (e.g. "Cmaj7", "F#m", "C/E") by the given number of semitones. */
export function transposeChord(chord: string, semitones: number, opts?: TransposeOptions): string {
  const match = chord.match(CHORD_TOKEN);
  if (!match) {
    throw new Error(`Invalid chord: "${chord}"`);
  }
  const [, root, suffix, bass] = match;
  const preferFlats = opts?.preferFlats ?? false;
  const newRoot = shiftNote(root, semitones, preferFlats);
  if (bass === undefined) {
    return newRoot + suffix;
  }
  return `${newRoot}${suffix}/${shiftNote(bass, semitones, preferFlats)}`;
}

const CHORD_IN_BRACKETS = /\[([^\]]+)\]/g;

/** Transpose every bracketed chord inside a ChordPro content string. Lyrics are left untouched. */
export function transposeContent(
  content: string,
  semitones: number,
  opts?: TransposeOptions,
): string {
  return content.replace(
    CHORD_IN_BRACKETS,
    (_, chord: string) => `[${transposeChord(chord, semitones, opts)}]`,
  );
}

function shiftNote(note: string, semitones: number, preferFlats: boolean): string {
  const semitone = NOTE_TO_SEMITONE[note];
  if (semitone === undefined) {
    throw new Error(`Invalid note: "${note}"`);
  }
  const shifted = (((semitone + semitones) % 12) + 12) % 12;
  return (preferFlats ? FLAT_NOTES : SHARP_NOTES)[shifted];
}
