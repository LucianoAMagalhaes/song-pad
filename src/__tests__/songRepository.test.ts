import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { songRepository } from "@/repositories/songRepository";
import type { SongInput } from "@/models/song";

const baseInput: SongInput = {
  title: "Imagine",
  artist: "John Lennon",
  content: "[C]Imagine there's no [F]heaven",
  key: "C",
  bpm: 75,
};

beforeEach(async () => {
  await db.songs.clear();
  await db.setlists.clear();
});

afterEach(async () => {
  await db.songs.clear();
  await db.setlists.clear();
});

describe("songRepository", () => {
  it("creates a song with id and timestamps", async () => {
    const song = await songRepository.create(baseInput);

    expect(song.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(song.title).toBe(baseInput.title);
    expect(song.createdAt).toBeInstanceOf(Date);
    expect(song.updatedAt).toBeInstanceOf(Date);
    expect(song.createdAt.getTime()).toBe(song.updatedAt.getTime());
  });

  it("retrieves a song by id", async () => {
    const created = await songRepository.create(baseInput);
    const fetched = await songRepository.getById(created.id);

    expect(fetched).toEqual(created);
  });

  it("returns undefined for unknown id", async () => {
    expect(await songRepository.getById("missing")).toBeUndefined();
  });

  it("lists songs ordered by updatedAt descending", async () => {
    const first = await songRepository.create({ ...baseInput, title: "A" });
    await new Promise((r) => setTimeout(r, 5));
    const second = await songRepository.create({ ...baseInput, title: "B" });

    const all = await songRepository.list();
    expect(all.map((s) => s.id)).toEqual([second.id, first.id]);
  });

  it("updates a song and refreshes updatedAt", async () => {
    const created = await songRepository.create(baseInput);
    await new Promise((r) => setTimeout(r, 5));

    const updated = await songRepository.update(created.id, { title: "Imagine (live)" });

    expect(updated.title).toBe("Imagine (live)");
    expect(updated.createdAt.getTime()).toBe(created.createdAt.getTime());
    expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
  });

  it("throws when updating a missing song", async () => {
    await expect(songRepository.update("missing", { title: "x" })).rejects.toThrow(
      /Song not found/,
    );
  });

  it("removes a song", async () => {
    const created = await songRepository.create(baseInput);
    await songRepository.remove(created.id);
    expect(await songRepository.getById(created.id)).toBeUndefined();
  });

  it("searches by title and artist (case-insensitive substring)", async () => {
    await songRepository.create({ ...baseInput, title: "Imagine", artist: "John Lennon" });
    await songRepository.create({ ...baseInput, title: "Hey Jude", artist: "The Beatles" });
    await songRepository.create({ ...baseInput, title: "Yesterday", artist: "Paul McCartney" });

    const byTitle = await songRepository.search("imagi");
    expect(byTitle.map((s) => s.title)).toEqual(["Imagine"]);

    const byArtist = await songRepository.search("beatles");
    expect(byArtist.map((s) => s.title)).toEqual(["Hey Jude"]);

    const empty = await songRepository.search("   ");
    expect(empty).toHaveLength(3);
  });
});
