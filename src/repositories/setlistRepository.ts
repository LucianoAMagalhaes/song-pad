import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import type { Setlist, SetlistInput, SetlistPatch } from "@/models/setlist";

async function create(input: SetlistInput): Promise<Setlist> {
  const setlist: Setlist = {
    ...input,
    id: uuid(),
    createdAt: new Date(),
  };
  await db.setlists.add(setlist);
  return setlist;
}

async function getById(id: string): Promise<Setlist | undefined> {
  return db.setlists.get(id);
}

async function list(): Promise<Setlist[]> {
  return db.setlists.orderBy("createdAt").reverse().toArray();
}

async function update(id: string, patch: SetlistPatch): Promise<Setlist> {
  const existing = await db.setlists.get(id);
  if (!existing) {
    throw new Error(`Setlist not found: ${id}`);
  }
  const updated: Setlist = {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
  };
  await db.setlists.put(updated);
  return updated;
}

async function remove(id: string): Promise<void> {
  await db.setlists.delete(id);
}

export const setlistRepository = {
  create,
  getById,
  list,
  update,
  remove,
};
