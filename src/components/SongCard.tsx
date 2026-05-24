import Link from "next/link";
import type { Song } from "@/models/song";

interface SongCardProps {
  song: Song;
}

export function SongCard({ song }: SongCardProps) {
  return (
    <Link
      href={`/songs/${song.id}`}
      className="flex items-center gap-4 p-4 rounded-lg bg-surface border border-border hover:bg-surface-hover hover:border-accent/50 transition-colors group"
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-md bg-accent/10 text-accent flex items-center justify-center font-bold text-lg">
        {song.title.charAt(0).toUpperCase() || "♪"}
      </div>

      <div className="min-w-0 flex-1">
        <div className="font-semibold text-foreground truncate group-hover:text-accent transition-colors">
          {song.title || "Sem título"}
        </div>
        <div className="text-sm text-muted truncate">{song.artist || "Artista desconhecido"}</div>
      </div>

      <div className="flex-shrink-0 flex items-center gap-3 text-xs text-muted">
        {song.key ? (
          <span className="px-2 py-1 rounded-md bg-background border border-border font-mono">
            {song.key}
          </span>
        ) : null}
        {song.bpm > 0 ? <span>{song.bpm} BPM</span> : null}
      </div>
    </Link>
  );
}
