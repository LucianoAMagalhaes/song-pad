"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const VARIANTS = [
  { key: "A", name: "Panorama" },
  { key: "B", name: "Bancada" },
  { key: "C", name: "Percurso" },
];

/** Shared, development-only controls for the throwaway UI variants. */
export function PrototypeSwitcher({ variant }: { variant: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const index = Math.max(
    0,
    VARIANTS.findIndex((v) => v.key === variant),
  );

  function move(offset: number) {
    const next = VARIANTS[(index + offset + VARIANTS.length) % VARIANTS.length];
    const params = new URLSearchParams(searchParams.toString());
    params.set("variant", next.key);
    router.replace("/theory/prototype?" + params.toString(), { scroll: false });
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      if (
        target instanceof HTMLElement &&
        target.closest("input, textarea, select, [contenteditable], [data-fretboard]")
      )
        return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const offset = event.key === "ArrowLeft" ? -1 : 1;
      const next = VARIANTS[(index + offset + VARIANTS.length) % VARIANTS.length];
      const params = new URLSearchParams(searchParams.toString());
      params.set("variant", next.key);
      router.replace("/theory/prototype?" + params.toString(), { scroll: false });
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index, router, searchParams]);

  if (process.env.NODE_ENV === "production") return null;
  return (
    <nav
      aria-label="Alternativas do protótipo"
      className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-full border border-white/20 bg-white px-2 py-1.5 text-black shadow-2xl"
    >
      <button
        type="button"
        aria-label="Alternativa anterior"
        onClick={() => move(-1)}
        className="h-11 w-11 rounded-full hover:bg-black/10"
      >
        ←
      </button>
      <span className="min-w-36 text-center text-sm font-semibold" aria-live="polite">
        {VARIANTS[index].key} · {VARIANTS[index].name}
      </span>
      <button
        type="button"
        aria-label="Alternativa seguinte"
        onClick={() => move(1)}
        className="h-11 w-11 rounded-full hover:bg-black/10"
      >
        →
      </button>
    </nav>
  );
}
