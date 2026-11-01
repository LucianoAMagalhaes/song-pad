"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
import { LocalDataMigration } from "@/components/LocalDataMigration";

/**
 * Client-side providers mounted once at the root. Keeps `layout.tsx` a Server
 * Component while still wrapping the tree in the auth context + route guard.
 */
export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // This development-only prototype uses fixtures and never mounts Firebase.
  if (process.env.NODE_ENV === "development" && pathname === "/theory/prototype") {
    return <>{children}</>;
  }
  return (
    <AuthProvider>
      <LocalDataMigration />
      <AuthGuard>{children}</AuthGuard>
    </AuthProvider>
  );
}
