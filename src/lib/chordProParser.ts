/**
 * Parser for the ChordPro inline-chord format.
 *
 * A song is stored as plain text where chords appear between square brackets
 * immediately before the syllable they should sit above:
 *
 *   [G]Imagine there's no [C]heaven
 *
 * Lines are independent. Empty lines are preserved as empty segment arrays so
 * the renderer can keep vertical spacing intact.
 */

export interface Segment {
  /** Chord that sits above the start of `text`. Absent for leading lyric text without a chord. */
  chord?: string;
  /** Lyric text that follows the chord (or stands alone). May be the empty string. */
  text: string;
}

export interface Line {
  segments: Segment[];
}

const CHORD_PATTERN = /\[([^\]]+)\]/g;

/** Parse a ChordPro string into a line-by-line structure. */
export function parse(content: string): Line[] {
  return content.split("\n").map(parseLine);
}

function parseLine(line: string): Line {
  if (line.length === 0) {
    return { segments: [] };
  }

  const segments: Segment[] = [];
  let lastIndex = 0;
  let pendingChord: string | undefined;
  const regex = new RegExp(CHORD_PATTERN.source, "g");
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    const textBefore = line.slice(lastIndex, match.index);
    if (pendingChord !== undefined) {
      segments.push({ chord: pendingChord, text: textBefore });
    } else if (textBefore.length > 0) {
      segments.push({ text: textBefore });
    }
    pendingChord = match[1];
    lastIndex = match.index + match[0].length;
  }

  const trailing = line.slice(lastIndex);
  if (pendingChord !== undefined) {
    segments.push({ chord: pendingChord, text: trailing });
  } else if (trailing.length > 0) {
    segments.push({ text: trailing });
  }

  return { segments };
}

/**
 * Collect the unique chords used in a ChordPro string, in order of first
 * appearance. Useful for rendering a summary panel (e.g. chord diagrams).
 */
export function extractChords(content: string): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const line of parse(content)) {
    for (const segment of line.segments) {
      const chord = segment.chord?.trim();
      if (chord && !seen.has(chord)) {
        seen.add(chord);
        ordered.push(chord);
      }
    }
  }
  return ordered;
}

/** Convert a parsed structure back into the original ChordPro string (round-trip safe). */
export function serialize(lines: Line[]): string {
  return lines.map(serializeLine).join("\n");
}

function serializeLine(line: Line): string {
  return line.segments
    .map((segment) =>
      segment.chord !== undefined ? `[${segment.chord}]${segment.text}` : segment.text,
    )
    .join("");
}
