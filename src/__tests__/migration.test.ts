import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the repositories so migration writes never touch Firestore.
vi.mock("@/repositories/songRepository", () => ({
  songRepository: { upsert: vi.fn(async () => {}) },
}));
vi.mock("@/repositories/setlistRepository", () => ({
  setlistRepository: { upsert: vi.fn(async () => {}) },
}));

import { db } from "@/lib/db";
import { songRepository } from "@/repositories/songRepository";
import { setlistRepository } from "@/repositories/setlistRepository";
import { countLocalData, hasMigrated, migrateLocalData } from "@/lib/migration";

const songUpsert = vi.mocked(songRepository.upsert);
const setlistUpsert = vi.mocked(setlistRepository.upsert);

const UID = "user-1";

function makeSong(id: string) {
  const now = new Date("2026-05-01T10:00:00.000Z");
  return {
    id,
    title: `Song ${id}`,
    artist: "Artist",
    content: "",
    key: "C",
    bpm: 0,
    createdAt: now,
    updatedAt: now,
  };
}

beforeEach(async () => {
  await db.songs.clear();
  await db.setlists.clear();
  localStorage.clear();
  songUpsert.mockClear();
  setlistUpsert.mockClear();
});

afterEach(async () => {
  await db.songs.clear();
  await db.setlists.clear();
  localStorage.clear();
});

describe("migrateLocalData", () => {
  it("upserts every local song and setlist into the cloud", async () => {
    await db.songs.bulkAdd([makeSong("a"), makeSong("b")]);
    await db.setlists.add({
      id: "s1",
      name: "Ensaio",
      songIds: ["a"],
      createdAt: new Date("2026-05-02T10:00:00.000Z"),
    });

    const result = await migrateLocalData(UID);

    expect(result).toEqual({ songs: 2, setlists: 1 });
    expect(songUpsert).toHaveBeenCalledTimes(2);
    expect(setlistUpsert).toHaveBeenCalledTimes(1);
    expect(hasMigrated(UID)).toBe(true);
  });

  it("reports zero and still marks done when there is no local data", async () => {
    const result = await migrateLocalData(UID);

    expect(result).toEqual({ songs: 0, setlists: 0 });
    expect(songUpsert).not.toHaveBeenCalled();
    expect(hasMigrated(UID)).toBe(true);
  });

  it("does not flag migration as done before it runs", async () => {
    expect(hasMigrated(UID)).toBe(false);
  });
});

describe("countLocalData", () => {
  it("counts the local songs and setlists", async () => {
    await db.songs.bulkAdd([makeSong("a"), makeSong("b"), makeSong("c")]);
    await expect(countLocalData()).resolves.toEqual({ songs: 3, setlists: 0 });
  });
});
