import { db } from "@/lib/db";
import { songRepository } from "@/repositories/songRepository";
import { setlistRepository } from "@/repositories/setlistRepository";

/** Counts of records copied from the local store into Firestore. */
export interface MigrationResult {
  songs: number;
  setlists: number;
}

const FLAG_PREFIX = "songpad:migrated:";

/** Whether the one-time local→cloud migration has already completed for this user. */
export function hasMigrated(uid: string): boolean {
  try {
    return localStorage.getItem(FLAG_PREFIX + uid) === "true";
  } catch {
    return false;
  }
}

function markMigrated(uid: string): void {
  try {
    localStorage.setItem(FLAG_PREFIX + uid, "true");
  } catch {
    // Ignore storage failures (e.g. private mode); migration stays idempotent.
  }
}

/** Number of songs and setlists currently in the local (Dexie) store. */
export async function countLocalData(): Promise<MigrationResult> {
  const [songs, setlists] = await Promise.all([db.songs.count(), db.setlists.count()]);
  return { songs, setlists };
}

/**
 * Copies all songs and setlists from the local Dexie store into the signed-in
 * user's Firestore collections, then marks the migration done for `uid`.
 *
 * Idempotent: writes use `upsert` keyed by the record's existing id, so running
 * it again (or from multiple devices) merges rather than duplicates. The local
 * data is left untouched as a safety net.
 */
export async function migrateLocalData(uid: string): Promise<MigrationResult> {
  const [songs, setlists] = await Promise.all([db.songs.toArray(), db.setlists.toArray()]);

  for (const song of songs) {
    await songRepository.upsert(song);
  }
  for (const setlist of setlists) {
    await setlistRepository.upsert(setlist);
  }

  markMigrated(uid);
  return { songs: songs.length, setlists: setlists.length };
}
