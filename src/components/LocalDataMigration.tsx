"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { hasMigrated, migrateLocalData } from "@/lib/migration";

/**
 * Runs the one-time local→cloud migration in the background when a user signs
 * in for the first time. Renders nothing. Failures (e.g. offline) leave the
 * migration flag unset so it retries on the next login. The migration is
 * idempotent, so a retry never duplicates data.
 */
export function LocalDataMigration() {
  const { user } = useAuth();
  const startedFor = useRef<string | null>(null);

  useEffect(() => {
    const uid = user?.uid;
    if (!uid || hasMigrated(uid) || startedFor.current === uid) return;
    startedFor.current = uid;
    migrateLocalData(uid).catch((error) => {
      console.error("Local data migration failed", error);
      // Allow a retry on the next render/login.
      startedFor.current = null;
    });
  }, [user]);

  return null;
}
