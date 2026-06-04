/**
 * Helpers for substituting a chord with a variation that keeps the same root
 * note but changes its quality/extension (e.g. Am → Am7 → Am9).
 *
 * Because only the suffix changes — never the root — substitutions are safe to
 * apply to the stored (original-key) content regardless of any transposition
 * currently shown on screen. All functions here are pure and React-free.
 */

const CHORD_TOKEN = /^([A-G][#b]?)([^/]*)(?:\/([A-G][#b]?))?$/;

export interface ParsedChord {
  /** Root note, e.g. "A", "F#", "Bb". */
  root: string;
  /** Quality/extension, e.g. "" (major), "m", "m7", "maj7". */
  suffix: string;
  /** Optional bass note for slash chords, e.g. the "C" in "Am/C". */
  bass?: string;
}

/** Split a chord token into root, suffix and optional bass. Null if unparseable. */
export function parseChord(chord: string): ParsedChord | null {
  const match = chord.trim().match(CHORD_TOKEN);
  if (!match) return null;
  return { root: match[1], suffix: match[2], bass: match[3] };
}

/**
 * Common chord qualities offered as one-tap substitutions. Ordered roughly from
 * the plain triads outward to richer extensions.
 */
export const COMMON_SUFFIXES = [
  "",
  "m",
  "6",
  "7",
  "maj7",
  "9",
  "m6",
  "m7",
  "m9",
  "mmaj7",
  "add9",
  "sus2",
  "sus4",
  "dim",
  "aug",
  "m7b5",
] as const;

/** Rebuild a chord keeping its root (and bass) but using a different suffix. */
export function withSuffix(chord: string, suffix: string): string | null {
  const parsed = parseChord(chord);
  if (!parsed) return null;
  return parsed.root + suffix + (parsed.bass ? `/${parsed.bass}` : "");
}

/**
 * Build the list of substitution candidates for a chord: the common suffixes
 * applied to its root, with the chord's own current suffix guaranteed to be
 * present (prepended when it isn't one of the common ones).
 */
export function chordVariants(chord: string): string[] {
  const parsed = parseChord(chord);
  if (!parsed) return [];
  const suffixes: string[] = [...COMMON_SUFFIXES];
  if (!suffixes.includes(parsed.suffix)) {
    suffixes.unshift(parsed.suffix);
  }
  return suffixes.map((suffix) => parsed.root + suffix + (parsed.bass ? `/${parsed.bass}` : ""));
}

/**
 * Replace every occurrence of the bracketed chord `from` with `to` in ChordPro
 * content. Matches the whole `[chord]` token, so swapping "Am" never touches
 * "Am7". A literal (non-regex) replacement, safe for chords containing "#"/"+".
 */
export function replaceChord(content: string, from: string, to: string): string {
  if (from === to) return content;
  return content.split(`[${from}]`).join(`[${to}]`);
}
