import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { SetlistList } from "@/components/SetlistList";

export default function SetlistsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
      <nav className="mb-4 flex justify-between text-sm text-muted">
        <Link href="/songs" className="hover:text-foreground transition-colors">
          ← Músicas
        </Link>
        <Link href="/settings" className="hover:text-foreground transition-colors">
          Definições
        </Link>
      </nav>

      <header className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold text-foreground">Setlists</h1>
        <LinkButton href="/setlists/new">+ Nova</LinkButton>
      </header>

      <SetlistList />
    </main>
  );
}
