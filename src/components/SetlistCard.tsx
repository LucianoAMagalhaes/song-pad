import Link from "next/link";
import type { Setlist } from "@/models/setlist";

interface SetlistCardProps {
  setlist: Setlist;
}

export function SetlistCard({ setlist }: SetlistCardProps) {
  const count = setlist.songIds.length;
  const countLabel = count === 1 ? "1 música" : `${count} músicas`;

  return (
    <Link
      href={`/setlists/${setlist.id}/edit`}
      className="flex items-center gap-4 p-4 rounded-lg bg-surface border border-border hover:bg-surface-hover hover:border-accent/50 transition-colors group"
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-md bg-accent/10 text-accent flex items-center justify-center font-bold text-lg">
        {setlist.name.charAt(0).toUpperCase() || "♫"}
      </div>

      <div className="min-w-0 flex-1">
        <div className="font-semibold text-foreground truncate group-hover:text-accent transition-colors">
          {setlist.name || "Sem nome"}
        </div>
        <div className="text-sm text-muted truncate">{countLabel}</div>
      </div>
    </Link>
  );
}
