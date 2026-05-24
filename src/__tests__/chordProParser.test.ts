import { describe, expect, it } from "vitest";
import { parse, serialize } from "@/lib/chordProParser";

describe("chordProParser.parse", () => {
  it("parses a single chord followed by text", () => {
    expect(parse("[G]Hello")).toEqual([{ segments: [{ chord: "G", text: "Hello" }] }]);
  });

  it("parses leading text before the first chord", () => {
    expect(parse("Hello [G]world")).toEqual([
      {
        segments: [{ text: "Hello " }, { chord: "G", text: "world" }],
      },
    ]);
  });

  it("parses multiple chords on the same line", () => {
    expect(parse("[G]Imagine there's no [C]heaven")).toEqual([
      {
        segments: [
          { chord: "G", text: "Imagine there's no " },
          { chord: "C", text: "heaven" },
        ],
      },
    ]);
  });

  it("parses consecutive chords with no text between them", () => {
    expect(parse("[G][C]Hello")).toEqual([
      {
        segments: [
          { chord: "G", text: "" },
          { chord: "C", text: "Hello" },
        ],
      },
    ]);
  });

  it("parses a chord at the end of the line with no trailing lyric", () => {
    expect(parse("Hello[G]")).toEqual([
      {
        segments: [{ text: "Hello" }, { chord: "G", text: "" }],
      },
    ]);
  });

  it("parses plain lyrics with no chords", () => {
    expect(parse("just lyrics here")).toEqual([{ segments: [{ text: "just lyrics here" }] }]);
  });

  it("preserves empty lines as empty segment arrays", () => {
    expect(parse("[G]line one\n\n[C]line three")).toEqual([
      { segments: [{ chord: "G", text: "line one" }] },
      { segments: [] },
      { segments: [{ chord: "C", text: "line three" }] },
    ]);
  });

  it("returns an empty-segment line for an empty input", () => {
    expect(parse("")).toEqual([{ segments: [] }]);
  });

  it("supports complex chord names with sharps, flats and modifiers", () => {
    expect(parse("[F#m7]riff [Bbmaj7]riff [C/E]end")).toEqual([
      {
        segments: [
          { chord: "F#m7", text: "riff " },
          { chord: "Bbmaj7", text: "riff " },
          { chord: "C/E", text: "end" },
        ],
      },
    ]);
  });
});

describe("chordProParser.serialize", () => {
  it("is the inverse of parse for representative ChordPro content", () => {
    const inputs = [
      "[G]Hello",
      "Hello [G]world",
      "[G]Imagine there's no [C]heaven\n[G]It's easy if you [C]try",
      "[G][C]Hello",
      "Hello[G]",
      "just lyrics here",
      "[G]line one\n\n[C]line three",
      "",
    ];

    for (const input of inputs) {
      expect(serialize(parse(input))).toBe(input);
    }
  });
});
