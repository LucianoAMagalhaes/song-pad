"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

/** Routes reachable without authentication. */
const PUBLIC_ROUTES = new Set<string>(["/login"]);

/**
 * Gates the app behind authentication:
 * - signed-out users on a protected route are redirected to `/login`;
 * - signed-in users on `/login` are redirected to `/songs`.
 * While auth is resolving (or a redirect is pending) a full-screen spinner is
 * shown to avoid flashing protected content or the login screen.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = PUBLIC_ROUTES.has(pathname);

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublic) {
      router.replace("/login");
    } else if (user && isPublic) {
      router.replace("/songs");
    }
  }, [user, loading, isPublic, router]);

  const redirectPending = !loading && ((!user && !isPublic) || (user && isPublic));
  if (loading || redirectPending) {
    return <FullScreenSpinner />;
  }

  return <>{children}</>;
}

function FullScreenSpinner() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      role="status"
      aria-label="A carregar"
    >
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
    </div>
  );
}
