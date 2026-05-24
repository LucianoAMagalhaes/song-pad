import Dexie, { type Table } from "dexie";
import type { Song } from "@/models/song";
import type { Setlist } from "@/models/setlist";

export class SongPadDB extends Dexie {
  songs!: Table<Song, string>;
  setlists!: Table<Setlist, string>;

  constructor() {
    super("songpad");

    this.version(1).stores({
      songs: "id, title, artist, updatedAt",
      setlists: "id, name, createdAt",
    });
  }
}

export const db = new SongPadDB();
