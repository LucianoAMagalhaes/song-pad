"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type Auth,
  type User,
} from "firebase/auth";
import { getFirebaseApp } from "@/lib/firebase";

interface AuthContextValue {
  /** The signed-in Firebase user, or `null` when signed out. */
  user: User | null;
  /** True until the initial auth state has been resolved on the client. */
  loading: boolean;
  /** Opens the Google sign-in popup. Resolves once sign-in completes. */
  signInWithGoogle: () => Promise<void>;
  /** Signs the current user out. */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Resolves Firebase Auth lazily (client-only). Calling this during SSR/prerender
 * is avoided because every caller runs inside an effect or an event handler.
 */
function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

/**
 * Provides the current authentication state and sign-in/out actions to the app.
 * Wrap the whole tree once (see `src/app/providers.tsx`).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    // Fires once with the persisted user (if any), then on every change.
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async signInWithGoogle() {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(getFirebaseAuth(), provider);
      },
      async signOut() {
        await firebaseSignOut(getFirebaseAuth());
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Reads the auth context. Throws if used outside an `AuthProvider`. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
