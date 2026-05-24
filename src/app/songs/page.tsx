import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { SongList } from "@/components/SongList";

export default function SongsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
      <nav className="mb-4 flex justify-end">
        <Link
          href="/setlists"
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          Setlists →
        </Link>
      </nav>

      <header className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold text-foreground">Músicas</h1>
        <LinkButton href="/songs/new">+ Nova</LinkButton>
      </header>

      <SongList />
    </main>
  );
}
