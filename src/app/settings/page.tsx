"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  BACKUP_VERSION,
  buildBackup,
  parseBackup,
  summarizeImport,
  triggerJsonDownload,
  type Backup,
  type ImportSummary,
} from "@/lib/backup";
import { setlistRepository } from "@/repositories/setlistRepository";
import { songRepository } from "@/repositories/songRepository";
import { useSongs } from "@/hooks/useSongs";
import { useSetlists } from "@/hooks/useSetlists";
import { useAuth } from "@/contexts/AuthContext";

type ImportStatus =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "success"; summary: ImportSummary };

function formatPlural(value: number, singular: string, plural: string): string {
  return value === 1 ? `1 ${singular}` : `${value} ${plural}`;
}

function exportFilename(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `songpad-backup-${y}-${m}-${d}.json`;
}

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const songs = useSongs();
  const setlists = useSetlists();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [status, setStatus] = useState<ImportStatus>({ kind: "idle" });

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut();
      // AuthGuard redirects to /login once the user becomes null.
    } finally {
      setIsSigningOut(false);
    }
  }

  const isLoading = songs === undefined || setlists === undefined;
  const songCount = songs?.length ?? 0;
  const setlistCount = setlists?.length ?? 0;

  async function handleExport() {
    if (isExporting || !songs || !setlists) return;
    setIsExporting(true);
    try {
      const backup = buildBackup(songs, setlists);
      const json = JSON.stringify(backup, null, 2);
      triggerJsonDownload(exportFilename(new Date()), json);
    } finally {
      setIsExporting(false);
    }
  }

  async function applyBackup(backup: Backup): Promise<void> {
    for (const song of backup.songs) {
      await songRepository.upsert(song);
    }
    for (const setlist of backup.setlists) {
      await setlistRepository.upsert(setlist);
    }
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Always reset the input so re-importing the same file fires onChange again.
    event.target.value = "";
    if (!file || !songs || !setlists) return;

    setIsImporting(true);
    setStatus({ kind: "idle" });
    try {
      const raw = await file.text();
      const parsed = parseBackup(raw);
      if (!parsed.ok) {
        setStatus({ kind: "error", message: parsed.error });
        return;
      }

      const summary = summarizeImport(parsed.backup, songs, setlists);
      const message = buildConfirmMessage(file.name, summary);
      if (!window.confirm(message)) return;

      await applyBackup(parsed.backup);
      setStatus({ kind: "success", summary });
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Erro inesperado ao importar.",
      });
    } finally {
      setIsImporting(false);
    }
  }

  const currentCountsLabel = useMemo(() => {
    if (isLoading) return "A carregar...";
    return `${formatPlural(songCount, "música", "músicas")} · ${formatPlural(
      setlistCount,
      "setlist",
      "setlists",
    )}`;
  }, [isLoading, songCount, setlistCount]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
      <nav className="mb-4 flex justify-between text-sm text-muted">
        <Link href="/songs" className="hover:text-foreground transition-colors">
          ← Músicas
        </Link>
        <Link href="/setlists" className="hover:text-foreground transition-colors">
          Setlists →
        </Link>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Definições</h1>
        <p className="text-muted mt-1">Cópia de segurança da tua biblioteca.</p>
      </header>

      {user ? (
        <section className="rounded-2xl border border-border bg-surface p-5 mb-6 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-1">
              Conta
            </h2>
            <p className="text-foreground truncate">{user.displayName ?? user.email}</p>
            {user.displayName && user.email ? (
              <p className="text-muted text-sm truncate">{user.email}</p>
            ) : null}
          </div>
          <Button type="button" variant="secondary" onClick={handleSignOut} disabled={isSigningOut}>
            {isSigningOut ? "A sair..." : "Sair"}
          </Button>
        </section>
      ) : null}

      <section className="rounded-2xl border border-border bg-surface p-5 mb-6">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-1">
          Biblioteca actual
        </h2>
        <p className="text-foreground text-lg font-medium">{currentCountsLabel}</p>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 mb-6 flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Exportar backup</h2>
          <p className="text-sm text-muted mt-1">
            Descarrega um ficheiro JSON com todas as músicas e setlists. Guarda-o num sítio seguro
            (Drive, Dropbox, email para ti).
          </p>
        </div>
        <div>
          <Button
            type="button"
            onClick={handleExport}
            disabled={isExporting || isLoading || (songCount === 0 && setlistCount === 0)}
          >
            {isExporting ? "A exportar..." : "Exportar backup"}
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Importar backup</h2>
          <p className="text-sm text-muted mt-1">
            Escolhe um ficheiro JSON exportado previamente (versão {BACKUP_VERSION}). As músicas e
            setlists com IDs em conflito são substituídas; as restantes mantêm-se.
          </p>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImport}
            disabled={isImporting || isLoading}
            className="block w-full text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-5 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:bg-accent-hover file:cursor-pointer cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            aria-label="Escolher ficheiro de backup"
          />
        </div>

        {status.kind === "error" ? (
          <p role="alert" className="text-sm text-red-400">
            {status.message}
          </p>
        ) : null}

        {status.kind === "success" ? (
          <p role="status" className="text-sm text-accent">
            Backup importado: {status.summary.songsAdded} música(s) adicionadas,{" "}
            {status.summary.songsReplaced} substituída(s); {status.summary.setlistsAdded} setlist(s)
            adicionada(s), {status.summary.setlistsReplaced} substituída(s).
          </p>
        ) : null}
      </section>
    </main>
  );
}

function buildConfirmMessage(filename: string, summary: ImportSummary): string {
  const songsTotal = summary.songsAdded + summary.songsReplaced;
  const setlistsTotal = summary.setlistsAdded + summary.setlistsReplaced;
  const lines = [
    `Importar "${filename}"?`,
    "",
    `Músicas no backup: ${songsTotal} (${summary.songsAdded} novas, ${summary.songsReplaced} substituirão existentes).`,
    `Setlists no backup: ${setlistsTotal} (${summary.setlistsAdded} novas, ${summary.setlistsReplaced} substituirão existentes).`,
    "",
    "As músicas e setlists actuais não referenciadas no backup mantêm-se.",
  ];
  return lines.join("\n");
}
