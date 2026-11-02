import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_GREEK_MODE_PREFERENCES,
  loadGreekModePreferences,
  saveGreekModePreferences,
} from "@/lib/greekModePreferences";
import { loadTheoryPreferences, saveTheoryPreferences } from "@/lib/theoryPreferences";

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("local modal preferences", () => {
  const preferences = {
    tonic: "E#",
    musicalMode: "phrygian",
    reading: "degrees",
    comparison: "relative",
    referenceMode: "aeolian",
  } as const;
  it("restores contextual tonics and durable choices independently of existing scale settings and other accounts", () => {
    const old = {
      version: 1,
      mode: "scales",
      tonic: "Db",
      family: "minor-pentatonic",
      reading: "degrees",
    };
    localStorage.setItem("songpad:theory:musician", JSON.stringify(old));
    const exploration = {
      ...preferences,
      selection: { string: 6, fret: 24 },
    };
    saveGreekModePreferences("musician", exploration);
    expect(loadGreekModePreferences("musician")).toEqual(preferences);
    expect(loadGreekModePreferences("second")).toEqual(DEFAULT_GREEK_MODE_PREFERENCES);
    expect(loadTheoryPreferences("musician")).toEqual({
      mode: "scales",
      tonic: "Db",
      family: "minor-pentatonic",
      reading: "degrees",
    });
    expect(JSON.parse(localStorage.getItem("songpad:greek-modes:musician")!)).toEqual({
      version: 1,
      ...preferences,
    });
    saveTheoryPreferences("musician", {
      ...loadTheoryPreferences("musician"),
      mode: "greek-modes",
    });
    expect(loadTheoryPreferences("musician").mode).toBe("greek-modes");
  });

  it.each([
    "bad-json",
    "null",
    "[]",
    JSON.stringify({ ...preferences, version: 2 }),
    JSON.stringify({ ...preferences, version: 1, tonic: "H" }),
    JSON.stringify({ ...preferences, version: 1, musicalMode: "blues" }),
    JSON.stringify({ ...preferences, version: 1, reading: "positions" }),
    JSON.stringify({ ...preferences, version: 1, comparison: "unknown" }),
    JSON.stringify({ ...preferences, version: 1, referenceMode: null }),
  ])("recovers invalid modal data safely: %s", (raw) => {
    localStorage.setItem("songpad:greek-modes:musician", raw);
    expect(loadGreekModePreferences("musician")).toEqual(DEFAULT_GREEK_MODE_PREFERENCES);
  });

  it("continues in memory when access, reads or writes are unavailable", () => {
    const fail = () => {
      throw new DOMException("Blocked", "SecurityError");
    };
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(fail);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(fail);
    expect(loadGreekModePreferences("musician")).toEqual(DEFAULT_GREEK_MODE_PREFERENCES);
    expect(() => saveGreekModePreferences("musician", preferences)).not.toThrow();
    vi.spyOn(window, "localStorage", "get").mockImplementation(fail);
    expect(loadGreekModePreferences("musician")).toEqual(DEFAULT_GREEK_MODE_PREFERENCES);
    expect(() => saveGreekModePreferences("musician", preferences)).not.toThrow();
  });
});
