import { NOTE_CHOICES, SCALE_CHOICES, type ScaleFamily } from "./theory";

export interface TheoryPreferences {
  mode: "notes" | "intervals" | "scales" | "greek-modes";
  tonic: string;
  family: ScaleFamily;
  reading: "notes" | "degrees";
}

export const DEFAULT_THEORY_PREFERENCES: Readonly<TheoryPreferences> = {
  mode: "notes",
  tonic: "C",
  family: "major",
  reading: "notes",
};

/** Reads device-local exploration settings for one account. */
export function loadTheoryPreferences(uid: string): TheoryPreferences {
  try {
    const raw = localStorage.getItem(`songpad:theory:${encodeURIComponent(uid)}`);
    const data: unknown = raw ? JSON.parse(raw) : null;
    if (typeof data === "object" && data !== null) {
      const stored = data as Record<string, unknown>;
      const tonic = NOTE_CHOICES.find(({ name }) => name === stored.tonic);
      const family = SCALE_CHOICES.find(({ id }) => id === stored.family);
      if (
        stored.version === 1 &&
        (stored.mode === "notes" ||
          stored.mode === "intervals" ||
          stored.mode === "scales" ||
          stored.mode === "greek-modes") &&
        tonic &&
        family &&
        (stored.reading === "notes" || stored.reading === "degrees")
      ) {
        return { mode: stored.mode, tonic: tonic.name, family: family.id, reading: stored.reading };
      }
    }
  } catch {
    // Corrupt data and blocked browser storage both fall back to in-memory defaults.
  }
  return { ...DEFAULT_THEORY_PREFERENCES };
}

/** Saves only durable settings; positions and comparisons remain in memory. */
export function saveTheoryPreferences(uid: string, preferences: TheoryPreferences): void {
  try {
    localStorage.setItem(
      `songpad:theory:${encodeURIComponent(uid)}`,
      JSON.stringify({
        version: 1,
        mode: preferences.mode,
        tonic: preferences.tonic,
        family: preferences.family,
        reading: preferences.reading,
      }),
    );
  } catch {
    // Exploration remains usable in memory when storage is blocked or full.
  }
}
