/**
 * Maps a chord name (as written in ChordPro, e.g. "Am7", "G/B", "F#m7b5") to a
 * guitar fingering taken from the bundled `@tombatossals/chords-db` dataset.
 *
 * The dataset is plain JSON (~230 KB) imported statically so chord diagrams keep
 * working offline. All logic here is pure and React-free so it can be unit-tested.
 */
import guitar from "@tombatossals/chords-db/lib/guitar.json";

/** A single fretting of a chord, mirroring the chords-db `position` shape. */
export interface ChordPosition {
  /** Fret per string (low→high). -1 = muted, 0 = open, n = fret within the window. */
  frets: number[];
  /** Finger per string (1–4), 0 = none. */
  fingers: number[];
  /** First visible fret. > 1 means the window is shifted up the neck. */
  baseFret: number;
  /** Fret values (within the window) that carry a barre. */
  barres: number[];
}

/** Instrument metadata used by the renderer. */
export const GUITAR = {
  strings: guitar.main.strings,
  fretsOnChord: guitar.main.fretsOnChord,
} as const;

type RawChord = { key: string; suffix: string; positions: ChordPosition[] };
const chordsByNote = guitar.chords as Record<string, RawChord[]>;

/**
 * Canonical note for every enharmonic spelling, matching the dataset's keys
 * (sharps for C#/F#, flats for Eb/Ab/Bb).
 */
const NOTE_TO_KEY: Record<string, string> = {
  "B#": "C",
  C: "C",
  "C#": "C#",
  Db: "C#",
  D: "D",
  "D#": "Eb",
  Eb: "Eb",
  E: "E",
  Fb: "E",
  "E#": "F",
  F: "F",
  "F#": "F#",
  Gb: "F#",
  G: "G",
  "G#": "Ab",
  Ab: "Ab",
  A: "A",
  "A#": "Bb",
  Bb: "Bb",
  B: "B",
  Cb: "B",
};

/** Dataset key (e.g. "C#") → object key under `chords` (e.g. "Csharp"). */
function noteObjectKey(key: string): string {
  if (key === "C#") return "Csharp";
  if (key === "F#") return "Fsharp";
  return key;
}

/**
 * Translate a chord quality (everything after the root) into a chords-db suffix.
 * Returns `undefined` when we don't recognise it, so callers can fall back.
 */
const SUFFIX_ALIASES: Record<string, string> = {
  "": "major",
  M: "major",
  maj: "major",
  m: "minor",
  min: "minor",
  "-": "minor",
  dim: "dim",
  "°": "dim",
  dim7: "dim7",
  "°7": "dim7",
  sus: "sus4",
  sus2: "sus2",
  sus4: "sus4",
  "7sus4": "7sus4",
  "7sus": "7sus4",
  aug: "aug",
  "+": "aug",
  "6": "6",
  "6/9": "69",
  "69": "69",
  "7": "7",
  "7b5": "7b5",
  aug7: "aug7",
  "7#5": "aug7",
  "9": "9",
  "9b5": "9b5",
  aug9: "aug9",
  "7b9": "7b9",
  "7#9": "7#9",
  "11": "11",
  "9#11": "9#11",
  "13": "13",
  maj7: "maj7",
  M7: "maj7",
  Δ: "maj7",
  maj7b5: "maj7b5",
  "maj7#5": "maj7#5",
  maj9: "maj9",
  maj11: "maj11",
  maj13: "maj13",
  m6: "m6",
  m69: "m69",
  m7: "m7",
  min7: "m7",
  m7b5: "m7b5",
  ø: "m7b5",
  m9: "m9",
  m11: "m11",
  mmaj7: "mmaj7",
  mM7: "mmaj7",
  add9: "add9",
  madd9: "madd9",
};

const ROOT_PATTERN = /^([A-G][#b]?)(.*)$/;

function findChord(key: string, suffix: string): ChordPosition[] | null {
  const list = chordsByNote[noteObjectKey(key)];
  if (!list) return null;
  const chord = list.find((c) => c.suffix === suffix);
  return chord ? chord.positions : null;
}

/**
 * Resolve a chord name to its available fingerings. Tries an exact suffix match,
 * then a slash-chord (key + "/bass"), then falls back to the bare major/minor
 * triad so something useful still shows. Returns `null` if even the root is
 * unparseable (e.g. "N.C.").
 */
export function lookupChordPositions(name: string): ChordPosition[] | null {
  const match = ROOT_PATTERN.exec(name.trim());
  if (!match) return null;

  const key = NOTE_TO_KEY[match[1]];
  if (!key) return null;

  const rest = match[2];
  const [quality, bass] = rest.split("/", 2);
  // Minor when it starts with lowercase "m" (but not "maj"), "min" or "-".
  // So "m7"/"madd9"/"mmaj7" are minor, while "maj7"/"M7" are not.
  const isMinor = /^(min|m(?!aj)|-)/.test(quality);

  // 1. Exact quality match (no bass note).
  const exact = SUFFIX_ALIASES[quality];
  if (exact && bass === undefined) {
    const positions = findChord(key, exact);
    if (positions) return positions;
  }

  // 2. Slash chord: key + "/bass" or "m/bass".
  if (bass !== undefined) {
    const normalizedBass = canonicalBass(bass);
    if (normalizedBass) {
      const slashSuffix = `${isMinor ? "m" : ""}/${normalizedBass}`;
      const positions = findChord(key, slashSuffix);
      if (positions) return positions;
    }
  }

  // 3. Fall back to the bare triad so a diagram still renders.
  return findChord(key, isMinor ? "minor" : "major");
}

/** Bass-note spellings used by the dataset's slash suffixes (sharps, not flats). */
const BASS_SHARP: Record<string, string> = {
  C: "C",
  "C#": "C#",
  Db: "C#",
  D: "D",
  "D#": "D#",
  Eb: "D#",
  E: "E",
  F: "F",
  "F#": "F#",
  Gb: "F#",
  G: "G",
  "G#": "G#",
  Ab: "G#",
  A: "A",
  "A#": "Bb",
  Bb: "Bb",
  B: "B",
};

function canonicalBass(bass: string): string | null {
  return BASS_SHARP[bass.trim()] ?? null;
}

/** Whether a chord name has any guitar fingering we can render. */
export function hasChordDiagram(name: string): boolean {
  return lookupChordPositions(name) !== null;
}
