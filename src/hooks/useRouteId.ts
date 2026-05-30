"use client";

import { usePathname } from "next/navigation";

/**
 * Extracts the dynamic id from a pathname of the form `/songs/<id>`,
 * `/songs/<id>/edit`, `/setlists/<id>` or `/setlists/<id>/edit` — i.e. the
 * segment right after the collection name.
 */
export function extractRouteId(pathname: string): string | undefined {
  return pathname.split("/").filter(Boolean)[1];
}

/**
 * Reads the dynamic route id from the real browser URL.
 *
 * Under static export (`output: "export"`) each dynamic route is served from a
 * placeholder shell (`/songs/_.html`) via Firebase Hosting rewrites, so Next's
 * `useParams()` resolves the id to the placeholder `"_"` instead of the real
 * value. `window.location.pathname` always reflects the actual URL, so we read
 * from there. `usePathname()` is called so the value recomputes on client-side
 * navigation.
 */
export function useRouteId(): string | undefined {
  usePathname();
  if (typeof window === "undefined") return undefined;
  return extractRouteId(window.location.pathname);
}
