import { describe, expect, it } from "vitest";
import {
  BACKUP_VERSION,
  buildBackup,
  parseBackup,
  summarizeImport,
  type Backup,
} from "@/lib/backup";
import type { Setlist } from "@/models/setlist";
import type { Song } from "@/models/song";

function makeSong(overrides: Partial<Song> = {}): Song {
  const now = new Date("2026-05-01T10:00:00.000Z");
  return {
    id: overrides.id ?? "song-1",
    title: "Imagine",
    artist: "John Lennon",
    content: "[G]Imagine",
    key: "G",
    bpm: 76,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeSetlist(overrides: Partial<Setlist> = {}): Setlist {
  return {
    id: overrides.id ?? "setlist-1",
    name: "Ensaio",
    songIds: ["song-1"],
    createdAt: new Date("2026-05-02T10:00:00.000Z"),
    ...overrides,
  };
}

describe("buildBackup", () => {
  it("includes the current version and a fresh timestamp", () => {
    const before = Date.now();
    const backup = buildBackup([makeSong()], [makeSetlist()]);
    const after = Date.now();
    expect(backup.version).toBe(BACKUP_VERSION);
    expect(backup.exportedAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(backup.exportedAt.getTime()).toBeLessThanOrEqual(after);
    expect(backup.songs).toHaveLength(1);
    expect(backup.setlists).toHaveLength(1);
  });
});

describe("parseBackup", () => {
  function roundtrip(backup: Backup): string {
    return JSON.stringify(backup);
  }

  it("rejects non-JSON input", () => {
    const result = parseBackup("{not json");
    expect(result.ok).toBe(false);
  });

  it("rejects unsupported versions", () => {
    const raw = JSON.stringify({ version: 999, exportedAt: new Date(), songs: [], setlists: [] });
    const result = parseBackup(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/[Vv]ers/);
    }
  });

  it("rejects missing songs array", () => {
    const raw = JSON.stringify({
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      setlists: [],
    });
    expect(parseBackup(raw).ok).toBe(false);
  });

  it("rejects invalid song shape", () => {
    const raw = JSON.stringify({
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      songs: [{ id: "x", title: 42 }],
      setlists: [],
    });
    const result = parseBackup(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/Música inválida/);
    }
  });

  it("rejects setlist with non-string songIds", () => {
    const raw = JSON.stringify({
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      songs: [],
      setlists: [
        {
          id: "s",
          name: "Bad",
          songIds: ["ok", 5],
          createdAt: new Date().toISOString(),
        },
      ],
    });
    expect(parseBackup(raw).ok).toBe(false);
  });

  it("accepts a roundtripped backup and revives dates", () => {
    const original = buildBackup([makeSong()], [makeSetlist()]);
    const result = parseBackup(roundtrip(original));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.backup.exportedAt).toBeInstanceOf(Date);
      expect(result.backup.songs[0].createdAt).toBeInstanceOf(Date);
      expect(result.backup.songs[0].updatedAt).toBeInstanceOf(Date);
      expect(result.backup.setlists[0].createdAt).toBeInstanceOf(Date);
      expect(result.backup.songs[0].id).toBe("song-1");
    }
  });
});

describe("summarizeImport", () => {
  it("counts additions vs replacements based on existing ids", () => {
    const backup = buildBackup(
      [makeSong({ id: "a" }), makeSong({ id: "b" }), makeSong({ id: "c" })],
      [makeSetlist({ id: "x" }), makeSetlist({ id: "y" })],
    );
    const summary = summarizeImport(
      backup,
      [makeSong({ id: "a" }), makeSong({ id: "z" })],
      [makeSetlist({ id: "x" })],
    );
    expect(summary).toEqual({
      songsAdded: 2,
      songsReplaced: 1,
      setlistsAdded: 1,
      setlistsReplaced: 1,
    });
  });

  it("returns zero counts for an empty backup", () => {
    const backup = buildBackup([], []);
    const summary = summarizeImport(backup, [makeSong()], [makeSetlist()]);
    expect(summary).toEqual({
      songsAdded: 0,
      songsReplaced: 0,
      setlistsAdded: 0,
      setlistsReplaced: 0,
    });
  });
});
