"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    if (isSigningIn) return;
    setIsSigningIn(true);
    setError(null);
    try {
      await signInWithGoogle();
      // On success the auth state updates and AuthGuard redirects to /songs.
    } catch (err) {
      const code = (err as { code?: string }).code;
      // The user simply closing/cancelling the popup is not an error.
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        return;
      }
      setError("Não foi possível entrar. Tenta novamente.");
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-bold text-foreground">SongPad</h1>
        <p className="text-muted mt-3">
          Entra com a tua conta Google para sincronizar as músicas entre os teus dispositivos.
        </p>

        <div className="mt-8">
          <Button type="button" onClick={handleSignIn} disabled={isSigningIn} className="w-full">
            {isSigningIn ? "A entrar..." : "Entrar com Google"}
          </Button>
        </div>

        {error ? (
          <p role="alert" className="text-danger mt-4 text-sm">
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}
