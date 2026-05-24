import { describe, expect, it } from "vitest";
import { transposeChord, transposeContent } from "@/lib/chordTransposer";

describe("transposeChord", () => {
  it("shifts natural notes by positive semitones", () => {
    expect(transposeChord("C", 2)).toBe("D");
    expect(transposeChord("G", 1)).toBe("G#");
    expect(transposeChord("E", 5)).toBe("A");
  });

  it("shifts by negative semitones", () => {
    expect(transposeChord("D", -2)).toBe("C");
    expect(transposeChord("A", -2)).toBe("G");
    expect(transposeChord("C", -1)).toBe("B");
  });

  it("wraps around the octave", () => {
    expect(transposeChord("G", 5)).toBe("C");
    expect(transposeChord("B", 1)).toBe("C");
    expect(transposeChord("C", 12)).toBe("C");
    expect(transposeChord("C", 13)).toBe("C#");
  });

  it("returns the chord unchanged when semitones is zero", () => {
    expect(transposeChord("Am", 0)).toBe("Am");
    expect(transposeChord("F#m7", 0)).toBe("F#m7");
    expect(transposeChord("C/E", 0)).toBe("C/E");
  });

  it("preserves common modifiers (m, 7, maj7, sus4, m7b5)", () => {
    expect(transposeChord("Am", 2)).toBe("Bm");
    expect(transposeChord("C7", 5)).toBe("F7");
    expect(transposeChord("Cmaj7", 2)).toBe("Dmaj7");
    expect(transposeChord("Dsus4", 2)).toBe("Esus4");
    expect(transposeChord("Bm7b5", 1)).toBe("Cm7b5");
  });

  it("handles sharp and flat input notes", () => {
    expect(transposeChord("F#m", 1)).toBe("Gm");
    expect(transposeChord("Bb", 2)).toBe("C");
    expect(transposeChord("Db", -1)).toBe("C");
  });

  it("transposes both sides of a slash chord", () => {
    expect(transposeChord("C/E", 2)).toBe("D/F#");
    expect(transposeChord("G/B", 5)).toBe("C/E");
    expect(transposeChord("Am/C", 2)).toBe("Bm/D");
  });

  it("emits flats when preferFlats is true", () => {
    expect(transposeChord("C", 1, { preferFlats: true })).toBe("Db");
    expect(transposeChord("F", 1, { preferFlats: true })).toBe("Gb");
    expect(transposeChord("A", 1, { preferFlats: true })).toBe("Bb");
  });

  it("emits sharps by default", () => {
    expect(transposeChord("C", 1)).toBe("C#");
    expect(transposeChord("F", 1)).toBe("F#");
    expect(transposeChord("A", 1)).toBe("A#");
  });

  it("throws on invalid chord tokens", () => {
    expect(() => transposeChord("XYZ", 1)).toThrow(/Invalid chord/);
    expect(() => transposeChord("", 1)).toThrow(/Invalid chord/);
    expect(() => transposeChord("H", 1)).toThrow(/Invalid chord/);
  });
});

describe("transposeContent", () => {
  it("transposes every bracketed chord and leaves lyrics untouched", () => {
    expect(transposeContent("[C]hello [G]world", 2)).toBe("[D]hello [A]world");
  });

  it("works across multiple lines", () => {
    const input = "[G]Imagine there's no [C]heaven\n[G]It's easy if you [C]try";
    const expected = "[A]Imagine there's no [D]heaven\n[A]It's easy if you [D]try";
    expect(transposeContent(input, 2)).toBe(expected);
  });

  it("returns plain text unchanged when there are no chords", () => {
    expect(transposeContent("plain lyrics without chords", 5)).toBe("plain lyrics without chords");
  });

  it("respects preferFlats option for every chord", () => {
    expect(transposeContent("[C]a [F]b", 1, { preferFlats: true })).toBe("[Db]a [Gb]b");
  });

  it("preserves complex chords (suffixes and slash)", () => {
    expect(transposeContent("[Cmaj7]intro [G/B]turn [Am7]around", 2)).toBe(
      "[Dmaj7]intro [A/C#]turn [Bm7]around",
    );
  });
});
