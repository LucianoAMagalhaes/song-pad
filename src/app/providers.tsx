"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";

/**
 * Client-side providers mounted once at the root. Keeps `layout.tsx` a Server
 * Component while still wrapping the tree in the auth context + route guard.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>{children}</AuthGuard>
    </AuthProvider>
  );
}
