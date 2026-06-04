import { describe, expect, it } from "vitest";
import { lookupChordPositions, hasChordDiagram } from "@/lib/guitarChords";
import { extractChords } from "@/lib/chordProParser";

describe("lookupChordPositions", () => {
  it("resolves plain major and minor triads", () => {
    expect(lookupChordPositions("G")).not.toBeNull();
    expect(lookupChordPositions("Am")).not.toBeNull();
  });

  it("normalises enharmonic roots to the dataset spelling", () => {
    // Db is stored as C#, D# as Eb.
    expect(lookupChordPositions("Db")).toEqual(lookupChordPositions("C#"));
    expect(lookupChordPositions("D#m")).toEqual(lookupChordPositions("Ebm"));
  });

  it("maps common quality aliases", () => {
    expect(lookupChordPositions("Cmaj7")).not.toBeNull();
    expect(lookupChordPositions("Am7")).not.toBeNull();
    expect(lookupChordPositions("F#m7b5")).not.toBeNull();
    expect(lookupChordPositions("Dsus4")).not.toBeNull();
  });

  it("does not treat maj7 as a minor chord", () => {
    // "Cmaj7" starts with "m" but must resolve to the major-7, not the minor triad.
    expect(lookupChordPositions("Cmaj7")).not.toEqual(lookupChordPositions("Cm"));
  });

  it("resolves slash chords, falling back to the base triad when needed", () => {
    expect(lookupChordPositions("G/B")).not.toBeNull();
    // Unknown bass falls back to the base chord shape.
    expect(lookupChordPositions("C/Zz")).toEqual(lookupChordPositions("C"));
  });

  it("falls back to a bare triad for unknown qualities", () => {
    expect(lookupChordPositions("Gxyz")).toEqual(lookupChordPositions("G"));
    expect(lookupChordPositions("Amxyz")).toEqual(lookupChordPositions("Am"));
  });

  it("returns null when the root is unparseable", () => {
    expect(lookupChordPositions("N.C.")).toBeNull();
    expect(lookupChordPositions("")).toBeNull();
    expect(hasChordDiagram("H7")).toBe(false);
  });
});

describe("extractChords", () => {
  it("returns unique chords in order of first appearance", () => {
    const content = "[G]Imagine there's no [C]heaven\n[G]It's easy if you [Am]try";
    expect(extractChords(content)).toEqual(["G", "C", "Am"]);
  });

  it("returns an empty array for content without chords", () => {
    expect(extractChords("just lyrics, no chords")).toEqual([]);
  });
});
