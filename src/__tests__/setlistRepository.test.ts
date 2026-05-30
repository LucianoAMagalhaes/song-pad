import { describe, expect, it } from "vitest";
import { filterSetlists } from "@/repositories/setlistRepository";
import type { Setlist } from "@/models/setlist";

function makeSetlist(overrides: Partial<Setlist> = {}): Setlist {
  return {
    id: overrides.id ?? "setlist-1",
    name: overrides.name ?? "Ensaio",
    songIds: overrides.songIds ?? [],
    createdAt: overrides.createdAt ?? new Date("2026-05-01T10:00:00.000Z"),
  };
}

describe("filterSetlists", () => {
  const setlists = [
    makeSetlist({ id: "1", name: "Ensaio Sábado" }),
    makeSetlist({ id: "2", name: "Culto Domingo" }),
    makeSetlist({ id: "3", name: "Ensaio Geral" }),
  ];

  it("returns all setlists for an empty query", () => {
    expect(filterSetlists(setlists, "")).toEqual(setlists);
    expect(filterSetlists(setlists, "   ")).toEqual(setlists);
  });

  it("matches on name, case-insensitively", () => {
    expect(filterSetlists(setlists, "ensaio").map((s) => s.id)).toEqual(["1", "3"]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterSetlists(setlists, "zzz")).toEqual([]);
  });
});
