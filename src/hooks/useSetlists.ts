"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { filterSetlists, setlistRepository } from "@/repositories/setlistRepository";
import type { Setlist } from "@/models/setlist";

/**
 * Reactively yields the signed-in user's setlists (newest first), filtered by
 * an optional case-insensitive query on name. Returns `undefined` while the
 * first snapshot is loading, mirroring the previous `useLiveQuery` contract.
 *
 * Backed by a Firestore real-time listener, so changes from other devices
 * appear automatically and reads work offline from the local cache.
 */
export function useSetlists(query = ""): Setlist[] | undefined {
  const { user } = useAuth();
  const uid = user?.uid;
  // Tagging the snapshot with its uid lets us treat data from a previous user
  // (or before the first snapshot) as "loading" without a synchronous reset.
  const [state, setState] = useState<{ uid: string; setlists: Setlist[] } | null>(null);

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = setlistRepository.subscribe(
      uid,
      (setlists) => setState({ uid, setlists }),
      (error) => {
        console.error("Failed to subscribe to setlists", error);
        setState({ uid, setlists: [] });
      },
    );
    return unsubscribe;
  }, [uid]);

  return useMemo(() => {
    if (!uid || state?.uid !== uid) return undefined;
    return filterSetlists(state.setlists, query);
  }, [uid, state, query]);
}
