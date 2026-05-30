import { describe, expect, it } from "vitest";
import { filterSongs } from "@/repositories/songRepository";
import type { Song } from "@/models/song";

function makeSong(overrides: Partial<Song> = {}): Song {
  const now = new Date("2026-05-01T10:00:00.000Z");
  return {
    id: overrides.id ?? "song-1",
    title: overrides.title ?? "Imagine",
    artist: overrides.artist ?? "John Lennon",
    content: overrides.content ?? "[C]Imagine there's no [F]heaven",
    key: overrides.key ?? "C",
    bpm: overrides.bpm ?? 75,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

describe("filterSongs", () => {
  const songs = [
    makeSong({ id: "1", title: "Imagine", artist: "John Lennon" }),
    makeSong({ id: "2", title: "Hey Jude", artist: "The Beatles" }),
    makeSong({ id: "3", title: "Yesterday", artist: "The Beatles" }),
  ];

  it("returns all songs for an empty query", () => {
    expect(filterSongs(songs, "")).toEqual(songs);
    expect(filterSongs(songs, "   ")).toEqual(songs);
  });

  it("matches on title, case-insensitively", () => {
    expect(filterSongs(songs, "imag").map((s) => s.id)).toEqual(["1"]);
  });

  it("matches on artist", () => {
    expect(filterSongs(songs, "beatles").map((s) => s.id)).toEqual(["2", "3"]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterSongs(songs, "zzz")).toEqual([]);
  });
});
