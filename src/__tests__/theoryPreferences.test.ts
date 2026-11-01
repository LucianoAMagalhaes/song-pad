import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadTheoryPreferences, saveTheoryPreferences } from "@/lib/theoryPreferences";

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("local theory preferences", () => {
  it("writes a versioned record containing only the four durable fields", () => {
    const exploration = {
      mode: "intervals",
      tonic: "C#",
      family: "major",
      reading: "notes",
      selection: { string: 6, fret: 24 },
      interval: "7m",
    } as const;
    saveTheoryPreferences("musician", exploration);
    expect(JSON.parse(localStorage.getItem("songpad:theory:musician")!)).toEqual({
      version: 1,
      mode: "intervals",
      tonic: "C#",
      family: "major",
      reading: "notes",
    });
  });
  it("continues safely when reading, writing, or accessing storage is blocked", () => {
    const fail = () => {
      throw new DOMException("Blocked", "SecurityError");
    };
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(fail);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(fail);
    expect(loadTheoryPreferences("musician").mode).toBe("notes");
    expect(() =>
      saveTheoryPreferences("musician", {
        mode: "scales",
        tonic: "Eb",
        family: "major",
        reading: "degrees",
      }),
    ).not.toThrow();
    vi.spyOn(window, "localStorage", "get").mockImplementation(fail);
    expect(loadTheoryPreferences("musician").tonic).toBe("C");
    expect(() =>
      saveTheoryPreferences("musician", {
        mode: "notes",
        tonic: "A",
        family: "major",
        reading: "notes",
      }),
    ).not.toThrow();
  });
  it("restores the four preferences for their owner, preserving the chosen spelling", () => {
    const preferences = {
      mode: "scales",
      tonic: "Db",
      family: "minor-pentatonic",
      reading: "degrees",
    } as const;
    saveTheoryPreferences("musician", preferences);
    expect(loadTheoryPreferences("musician")).toEqual(preferences);
    expect(loadTheoryPreferences("another-musician")).toEqual({
      mode: "notes",
      tonic: "C",
      family: "major",
      reading: "notes",
    });
  });

  it.each([
    "not json",
    "null",
    "[]",
    JSON.stringify({
      version: 2,
      mode: "scales",
      tonic: "Db",
      family: "major",
      reading: "degrees",
    }),
    JSON.stringify({ version: 1, mode: "chords", tonic: "C", family: "major", reading: "notes" }),
    JSON.stringify({ version: 1, mode: "scales", tonic: "H", family: "major", reading: "notes" }),
    JSON.stringify({ version: 1, mode: "scales", tonic: "C", family: "blues", reading: "notes" }),
    JSON.stringify({
      version: 1,
      mode: "scales",
      tonic: "C",
      family: "major",
      reading: "positions",
    }),
    JSON.stringify({ version: 1, mode: "scales", tonic: "C", family: "major" }),
    JSON.stringify({ mode: "scales", tonic: "C", family: "major", reading: "degrees" }),
  ])("uses safe defaults for an incompatible or invalid record: %s", (raw) => {
    localStorage.setItem("songpad:theory:musician", raw);
    expect(loadTheoryPreferences("musician")).toEqual({
      mode: "notes",
      tonic: "C",
      family: "major",
      reading: "notes",
    });
  });
});
