import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { setlistRepository } from "@/repositories/setlistRepository";
import type { SetlistInput } from "@/models/setlist";

const baseInput: SetlistInput = {
  name: "Ensaio quinta",
  songIds: [],
};

beforeEach(async () => {
  await db.songs.clear();
  await db.setlists.clear();
});

afterEach(async () => {
  await db.songs.clear();
  await db.setlists.clear();
});

describe("setlistRepository", () => {
  it("creates a setlist with id and createdAt", async () => {
    const setlist = await setlistRepository.create(baseInput);

    expect(setlist.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(setlist.name).toBe(baseInput.name);
    expect(setlist.songIds).toEqual([]);
    expect(setlist.createdAt).toBeInstanceOf(Date);
  });

  it("retrieves a setlist by id", async () => {
    const created = await setlistRepository.create(baseInput);
    expect(await setlistRepository.getById(created.id)).toEqual(created);
  });

  it("lists setlists ordered by createdAt descending", async () => {
    const first = await setlistRepository.create({ ...baseInput, name: "First" });
    await new Promise((r) => setTimeout(r, 5));
    const second = await setlistRepository.create({ ...baseInput, name: "Second" });

    const all = await setlistRepository.list();
    expect(all.map((s) => s.id)).toEqual([second.id, first.id]);
  });

  it("updates name and songIds, preserves createdAt", async () => {
    const created = await setlistRepository.create(baseInput);
    const newSongIds = ["song-a", "song-b"];

    const updated = await setlistRepository.update(created.id, {
      name: "Concerto sábado",
      songIds: newSongIds,
    });

    expect(updated.name).toBe("Concerto sábado");
    expect(updated.songIds).toEqual(newSongIds);
    expect(updated.createdAt.getTime()).toBe(created.createdAt.getTime());
  });

  it("throws when updating a missing setlist", async () => {
    await expect(setlistRepository.update("missing", { name: "x" })).rejects.toThrow(
      /Setlist not found/,
    );
  });

  it("removes a setlist", async () => {
    const created = await setlistRepository.create(baseInput);
    await setlistRepository.remove(created.id);
    expect(await setlistRepository.getById(created.id)).toBeUndefined();
  });
});
