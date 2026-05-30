import { getAuth } from "firebase/auth";
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  type CollectionReference,
  type FirestoreDataConverter,
} from "firebase/firestore";
import { v4 as uuid } from "uuid";
import { getFirebaseApp, getFirebaseFirestore } from "@/lib/firebase";
import type { Song, SongInput, SongPatch } from "@/models/song";

/** Resolves the signed-in user's uid, throwing if no one is authenticated. */
function requireUid(): string {
  const uid = getAuth(getFirebaseApp()).currentUser?.uid;
  if (!uid) {
    throw new Error("No authenticated user");
  }
  return uid;
}

/** Converts between the `Song` model (Date timestamps) and Firestore docs (Timestamp). */
const songConverter: FirestoreDataConverter<Song> = {
  toFirestore(song) {
    return {
      title: song.title,
      artist: song.artist,
      content: song.content,
      key: song.key,
      bpm: song.bpm,
      createdAt: Timestamp.fromDate(song.createdAt as Date),
      updatedAt: Timestamp.fromDate(song.updatedAt as Date),
    };
  },
  fromFirestore(snapshot) {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      title: data.title ?? "",
      artist: data.artist ?? "",
      content: data.content ?? "",
      key: data.key ?? "",
      bpm: data.bpm ?? 0,
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate(),
    };
  },
};

/** The current user's `songs` collection, typed via the converter. */
function songsCollection(uid: string): CollectionReference<Song> {
  return collection(getFirebaseFirestore(), "users", uid, "songs").withConverter(songConverter);
}

/**
 * Filters songs by a case-insensitive match on title or artist. An empty query
 * returns the list unchanged. Pure helper shared by `search` and `useSongs`.
 */
export function filterSongs(songs: Song[], query: string): Song[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return songs;
  }
  return songs.filter(
    (song) =>
      song.title.toLowerCase().includes(needle) || song.artist.toLowerCase().includes(needle),
  );
}

async function create(input: SongInput): Promise<Song> {
  const now = new Date();
  const song: Song = { ...input, id: uuid(), createdAt: now, updatedAt: now };
  await setDoc(doc(songsCollection(requireUid()), song.id), song);
  return song;
}

async function getById(id: string): Promise<Song | undefined> {
  const snapshot = await getDoc(doc(songsCollection(requireUid()), id));
  return snapshot.exists() ? snapshot.data() : undefined;
}

async function list(): Promise<Song[]> {
  const snapshot = await getDocs(
    query(songsCollection(requireUid()), orderBy("updatedAt", "desc")),
  );
  return snapshot.docs.map((d) => d.data());
}

async function update(id: string, patch: SongPatch): Promise<Song> {
  const collectionRef = songsCollection(requireUid());
  const existing = await getDoc(doc(collectionRef, id));
  if (!existing.exists()) {
    throw new Error(`Song not found: ${id}`);
  }
  const updated: Song = {
    ...existing.data(),
    ...patch,
    id,
    updatedAt: new Date(),
  };
  await setDoc(doc(collectionRef, id), updated);
  return updated;
}

async function remove(id: string): Promise<void> {
  await deleteDoc(doc(songsCollection(requireUid()), id));
}

/**
 * Insert or replace a song by id, preserving the caller-provided timestamps.
 * Used by backup import where the on-disk identity must survive the merge.
 */
async function upsert(song: Song): Promise<void> {
  await setDoc(doc(songsCollection(requireUid()), song.id), song);
}

async function search(query: string): Promise<Song[]> {
  return filterSongs(await list(), query);
}

/**
 * Subscribes to the user's songs (newest first), invoking `onChange` on every
 * local or remote change. Returns an unsubscribe function. Reads are served
 * from the offline cache when the device is offline.
 */
function subscribe(
  uid: string,
  onChange: (songs: Song[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const songsQuery = query(songsCollection(uid), orderBy("updatedAt", "desc"));
  return onSnapshot(
    songsQuery,
    (snapshot) => onChange(snapshot.docs.map((d) => d.data())),
    onError,
  );
}

export const songRepository = {
  create,
  getById,
  list,
  update,
  remove,
  search,
  upsert,
  subscribe,
};
