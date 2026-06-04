import { describe, expect, it } from "vitest";
import {
  COMMON_SUFFIXES,
  chordVariants,
  parseChord,
  replaceChord,
  withSuffix,
} from "@/lib/chordSwap";

describe("parseChord", () => {
  it("splits root, suffix and bass", () => {
    expect(parseChord("Am7")).toEqual({ root: "A", suffix: "m7", bass: undefined });
    expect(parseChord("F#")).toEqual({ root: "F#", suffix: "", bass: undefined });
    expect(parseChord("G/B")).toEqual({ root: "G", suffix: "", bass: "B" });
    expect(parseChord("Am/C")).toEqual({ root: "A", suffix: "m", bass: "C" });
  });

  it("returns null for unparseable input", () => {
    expect(parseChord("N.C.")).toBeNull();
    expect(parseChord("")).toBeNull();
  });
});

describe("withSuffix", () => {
  it("keeps the root (and bass) but swaps the suffix", () => {
    expect(withSuffix("Am", "m7")).toBe("Am7");
    expect(withSuffix("Am7", "m9")).toBe("Am9");
    expect(withSuffix("G/B", "7")).toBe("G7/B");
  });
});

describe("chordVariants", () => {
  it("offers the common suffixes on the same root", () => {
    const variants = chordVariants("Am");
    expect(variants).toContain("A"); // major
    expect(variants).toContain("Am7");
    expect(variants).toContain("Am9");
    expect(variants).toHaveLength(COMMON_SUFFIXES.length);
  });

  it("preserves a slash bass across variants", () => {
    expect(chordVariants("G/B")).toContain("Gm7/B");
  });

  it("includes the chord's own uncommon suffix", () => {
    const variants = chordVariants("Am7b9");
    expect(variants[0]).toBe("Am7b9");
    expect(variants).toHaveLength(COMMON_SUFFIXES.length + 1);
  });
});

describe("replaceChord", () => {
  it("replaces every occurrence of the exact chord token", () => {
    const content = "[Am]one [Am]two [G]three";
    expect(replaceChord(content, "Am", "Am7")).toBe("[Am7]one [Am7]two [G]three");
  });

  it("does not touch chords that merely start the same", () => {
    expect(replaceChord("[Am]a [Am7]b", "Am", "Am9")).toBe("[Am9]a [Am7]b");
  });

  it("is a no-op when from equals to", () => {
    const content = "[Am]x";
    expect(replaceChord(content, "Am", "Am")).toBe(content);
  });
});
