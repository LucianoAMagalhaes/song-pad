/**
 * A song stored in the local library.
 *
 * `content` is the lyrics + chords in ChordPro format,
 * e.g. `[G]Imagine there's no [C]heaven`.
 */
export interface Song {
  id: string;
  title: string;
  artist: string;
  content: string;
  key: string;
  bpm: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Shape accepted when creating a song. Identity and timestamps are filled by the repository. */
export type SongInput = Omit<Song, "id" | "createdAt" | "updatedAt">;

/** Shape accepted when patching an existing song. */
export type SongPatch = Partial<SongInput>;
