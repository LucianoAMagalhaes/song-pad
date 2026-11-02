import {
  GREEK_MODE_CHOICES,
  parseNoteSpelling,
  type GreekMode,
  type ModeComparisonKind,
} from "./theory";

export interface GreekModePreferences {
  tonic: string;
  musicalMode: GreekMode;
  reading: "notes" | "degrees";
  comparison: ModeComparisonKind;
  referenceMode: GreekMode;
}

export const DEFAULT_GREEK_MODE_PREFERENCES: Readonly<GreekModePreferences> = {
  tonic: "C",
  musicalMode: "ionian",
  reading: "notes",
  comparison: "parallel",
  referenceMode: "ionian",
};

/** Reads modal choices independently of the existing scale preferences. */
export function loadGreekModePreferences(uid: string): GreekModePreferences {
  try {
    const raw = localStorage.getItem(`songpad:greek-modes:${encodeURIComponent(uid)}`);
    const data: unknown = raw ? JSON.parse(raw) : null;
    if (typeof data === "object" && data !== null) {
      const stored = data as Record<string, unknown>;
      const musicalMode = GREEK_MODE_CHOICES.find(({ id }) => id === stored.musicalMode);
      const referenceMode = GREEK_MODE_CHOICES.find(({ id }) => id === stored.referenceMode);
      if (
        stored.version === 1 &&
        typeof stored.tonic === "string" &&
        parseNoteSpelling(stored.tonic) &&
        musicalMode &&
        referenceMode &&
        (stored.reading === "notes" || stored.reading === "degrees") &&
        (stored.comparison === "parallel" || stored.comparison === "relative")
      ) {
        return {
          tonic: stored.tonic,
          musicalMode: musicalMode.id,
          reading: stored.reading,
          comparison: stored.comparison,
          referenceMode: referenceMode.id,
        };
      }
    }
  } catch {
    // Invalid data or unavailable storage must not prevent exploration.
  }
  return { ...DEFAULT_GREEK_MODE_PREFERENCES };
}

/** Persists only durable modal choices, keeping positions transient. */
export function saveGreekModePreferences(uid: string, preferences: GreekModePreferences): void {
  try {
    localStorage.setItem(
      `songpad:greek-modes:${encodeURIComponent(uid)}`,
      JSON.stringify({
        version: 1,
        tonic: preferences.tonic,
        musicalMode: preferences.musicalMode,
        reading: preferences.reading,
        comparison: preferences.comparison,
        referenceMode: preferences.referenceMode,
      }),
    );
  } catch {
    // Quota and access failures leave the current in-memory session usable.
  }
}
