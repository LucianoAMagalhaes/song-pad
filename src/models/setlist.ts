/**
 * An ordered list of songs grouped for a rehearsal or performance.
 *
 * `songIds` holds the `Song.id` values in playback order.
 */
export interface Setlist {
  id: string;
  name: string;
  songIds: string[];
  createdAt: Date;
}

/** Shape accepted when creating a setlist. Identity and timestamp are filled by the repository. */
export type SetlistInput = Omit<Setlist, "id" | "createdAt">;

/** Shape accepted when patching an existing setlist. */
export type SetlistPatch = Partial<SetlistInput>;
