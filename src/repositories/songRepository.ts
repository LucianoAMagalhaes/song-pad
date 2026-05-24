import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import type { Song, SongInput, SongPatch } from "@/models/song";

async function create(input: SongInput): Promise<Song> {
  const now = new Date();
  const song: Song = {
    ...input,
    id: uuid(),
    createdAt: now,
    updatedAt: now,
  };
  await db.songs.add(song);
  return song;
}

async function getById(id: string): Promise<Song | undefined> {
  return db.songs.get(id);
}

async function list(): Promise<Song[]> {
  return db.songs.orderBy("updatedAt").reverse().toArray();
}

async function update(id: string, patch: SongPatch): Promise<Song> {
  const existing = await db.songs.get(id);
  if (!existing) {
    throw new Error(`Song not found: ${id}`);
  }
  const updated: Song = {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date(),
  };
  await db.songs.put(updated);
  return updated;
}

async function remove(id: string): Promise<void> {
  await db.songs.delete(id);
}

async function search(query: string): Promise<Song[]> {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return list();
  }
  const all = await list();
  return all.filter(
    (song) =>
      song.title.toLowerCase().includes(needle) || song.artist.toLowerCase().includes(needle),
  );
}

export const songRepository = {
  create,
  getById,
  list,
  update,
  remove,
  search,
};
