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
import type { Setlist, SetlistInput, SetlistPatch } from "@/models/setlist";

/** Resolves the signed-in user's uid, throwing if no one is authenticated. */
function requireUid(): string {
  const uid = getAuth(getFirebaseApp()).currentUser?.uid;
  if (!uid) {
    throw new Error("No authenticated user");
  }
  return uid;
}

/** Converts between the `Setlist` model (Date) and Firestore docs (Timestamp). */
const setlistConverter: FirestoreDataConverter<Setlist> = {
  toFirestore(setlist) {
    return {
      name: setlist.name,
      songIds: setlist.songIds,
      createdAt: Timestamp.fromDate(setlist.createdAt as Date),
    };
  },
  fromFirestore(snapshot) {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      name: data.name ?? "",
      songIds: (data.songIds as string[]) ?? [],
      createdAt: (data.createdAt as Timestamp).toDate(),
    };
  },
};

/** The current user's `setlists` collection, typed via the converter. */
function setlistsCollection(uid: string): CollectionReference<Setlist> {
  return collection(getFirebaseFirestore(), "users", uid, "setlists").withConverter(
    setlistConverter,
  );
}

/**
 * Filters setlists by a case-insensitive match on name. An empty query returns
 * the list unchanged. Pure helper shared by `search` and `useSetlists`.
 */
export function filterSetlists(setlists: Setlist[], query: string): Setlist[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return setlists;
  }
  return setlists.filter((setlist) => setlist.name.toLowerCase().includes(needle));
}

async function create(input: SetlistInput): Promise<Setlist> {
  const setlist: Setlist = { ...input, id: uuid(), createdAt: new Date() };
  await setDoc(doc(setlistsCollection(requireUid()), setlist.id), setlist);
  return setlist;
}

async function getById(id: string): Promise<Setlist | undefined> {
  const snapshot = await getDoc(doc(setlistsCollection(requireUid()), id));
  return snapshot.exists() ? snapshot.data() : undefined;
}

async function list(): Promise<Setlist[]> {
  const snapshot = await getDocs(
    query(setlistsCollection(requireUid()), orderBy("createdAt", "desc")),
  );
  return snapshot.docs.map((d) => d.data());
}

async function update(id: string, patch: SetlistPatch): Promise<Setlist> {
  const collectionRef = setlistsCollection(requireUid());
  const existing = await getDoc(doc(collectionRef, id));
  if (!existing.exists()) {
    throw new Error(`Setlist not found: ${id}`);
  }
  const updated: Setlist = {
    ...existing.data(),
    ...patch,
    id,
    createdAt: existing.data().createdAt,
  };
  await setDoc(doc(collectionRef, id), updated);
  return updated;
}

async function remove(id: string): Promise<void> {
  await deleteDoc(doc(setlistsCollection(requireUid()), id));
}

/**
 * Insert or replace a setlist by id, preserving the caller-provided
 * `createdAt`. Used by backup import where the on-disk identity must
 * survive the merge.
 */
async function upsert(setlist: Setlist): Promise<void> {
  await setDoc(doc(setlistsCollection(requireUid()), setlist.id), setlist);
}

async function search(query: string): Promise<Setlist[]> {
  return filterSetlists(await list(), query);
}

/**
 * Subscribes to the user's setlists (newest first), invoking `onChange` on
 * every local or remote change. Returns an unsubscribe function.
 */
function subscribe(
  uid: string,
  onChange: (setlists: Setlist[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const setlistsQuery = query(setlistsCollection(uid), orderBy("createdAt", "desc"));
  return onSnapshot(
    setlistsQuery,
    (snapshot) => onChange(snapshot.docs.map((d) => d.data())),
    onError,
  );
}

export const setlistRepository = {
  create,
  getById,
  list,
  update,
  remove,
  search,
  upsert,
  subscribe,
};
