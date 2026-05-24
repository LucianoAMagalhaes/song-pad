import { transposeChord } from "@/lib/chordTransposer";

const FLAT_TARGET_ROOTS = new Set(["Db", "Eb", "F", "Gb", "Ab", "Bb"]);
const SHARP_TO_FLAT: Record<string, string> = {
  "C#": "Db",
  "D#": "Eb",
  "F#": "Gb",
  "G#": "Ab",
  "A#": "Bb",
};

/**
 * Pick sharp vs flat spelling based on the *target* key. Flat-tradition keys
 * (F, Bb, Eb, Ab, Db, Gb) get flat accidentals; everything else gets sharps.
 * Returns false when we can't make sense of the key so the default (sharps)
 * stays in charge.
 */
export function shouldUseFlats(originalKey: string, semitones: number): boolean {
  if (!originalKey) return false;
  try {
    const targetSharp = transposeChord(originalKey, semitones, { preferFlats: false });
    const root = targetSharp.match(/^([A-G][#b]?)/)?.[1];
    if (!root) return false;
    const candidate = SHARP_TO_FLAT[root] ?? root;
    return FLAT_TARGET_ROOTS.has(candidate);
  } catch {
    return false;
  }
}

/** Safely transpose a key string, falling back to the original on parser errors. */
export function safeTransposeKey(
  originalKey: string,
  semitones: number,
  preferFlats: boolean,
): string {
  if (!originalKey) return "";
  try {
    return transposeChord(originalKey, semitones, { preferFlats });
  } catch {
    return originalKey;
  }
}
