"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { filterSongs, songRepository } from "@/repositories/songRepository";
import type { Song } from "@/models/song";

/**
 * Reactively yields the signed-in user's songs (newest first), filtered by an
 * optional case-insensitive query on title/artist. Returns `undefined` while
 * the first snapshot is loading, mirroring the previous `useLiveQuery` contract.
 *
 * Backed by a Firestore real-time listener, so changes from other devices
 * appear automatically and reads work offline from the local cache.
 */
export function useSongs(query = ""): Song[] | undefined {
  const { user } = useAuth();
  const uid = user?.uid;
  // Tagging the snapshot with its uid lets us treat data from a previous user
  // (or before the first snapshot) as "loading" without a synchronous reset.
  const [state, setState] = useState<{ uid: string; songs: Song[] } | null>(null);

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = songRepository.subscribe(
      uid,
      (songs) => setState({ uid, songs }),
      (error) => {
        console.error("Failed to subscribe to songs", error);
        setState({ uid, songs: [] });
      },
    );
    return unsubscribe;
  }, [uid]);

  return useMemo(() => {
    if (!uid || state?.uid !== uid) return undefined;
    return filterSongs(state.songs, query);
  }, [uid, state, query]);
}
