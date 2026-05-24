import type { Setlist } from "@/models/setlist";
import type { Song } from "@/models/song";

/**
 * Current backup schema version. Bump when the on-disk shape of an exported
 * file changes in a way that older importers can no longer read. Imports
 * always validate this against {@link BACKUP_VERSION} and reject mismatches.
 */
export const BACKUP_VERSION = 1;

export interface Backup {
  version: number;
  exportedAt: Date;
  songs: Song[];
  setlists: Setlist[];
}

export type ParseResult = { ok: true; backup: Backup } | { ok: false; error: string };

export interface ImportSummary {
  songsAdded: number;
  songsReplaced: number;
  setlistsAdded: number;
  setlistsReplaced: number;
}

/**
 * Serialise the current library state into the backup envelope. `Date`
 * fields become ISO strings via the default `JSON.stringify` behaviour.
 */
export function buildBackup(songs: Song[], setlists: Setlist[]): Backup {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date(),
    songs,
    setlists,
  };
}

/**
 * Validate and revive a backup JSON string. Returns a typed `Backup` with
 * `Date` instances or a human-readable error message — never throws.
 */
export function parseBackup(raw: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Ficheiro não é JSON válido." };
  }

  if (!isRecord(data)) {
    return { ok: false, error: "Estrutura do backup inválida." };
  }

  if (data.version !== BACKUP_VERSION) {
    return {
      ok: false,
      error: `Versão do backup não suportada (esperado ${BACKUP_VERSION}, encontrado ${String(
        data.version,
      )}).`,
    };
  }

  const exportedAt = reviveDate(data.exportedAt);
  if (!exportedAt) {
    return { ok: false, error: 'Campo "exportedAt" inválido ou em falta.' };
  }

  if (!Array.isArray(data.songs)) {
    return { ok: false, error: 'Campo "songs" em falta ou não é uma lista.' };
  }
  if (!Array.isArray(data.setlists)) {
    return { ok: false, error: 'Campo "setlists" em falta ou não é uma lista.' };
  }

  const songs: Song[] = [];
  for (let i = 0; i < data.songs.length; i++) {
    const song = parseSong(data.songs[i]);
    if (!song) {
      return { ok: false, error: `Música inválida na posição ${i}.` };
    }
    songs.push(song);
  }

  const setlists: Setlist[] = [];
  for (let i = 0; i < data.setlists.length; i++) {
    const setlist = parseSetlist(data.setlists[i]);
    if (!setlist) {
      return { ok: false, error: `Setlist inválida na posição ${i}.` };
    }
    setlists.push(setlist);
  }

  return { ok: true, backup: { version: BACKUP_VERSION, exportedAt, songs, setlists } };
}

/**
 * Compare a parsed backup against the current library state and report how
 * many records will be added vs. replaced if the merge proceeds. The view
 * uses this to surface a confirmation summary before touching the DB.
 */
export function summarizeImport(
  backup: Backup,
  currentSongs: Song[],
  currentSetlists: Setlist[],
): ImportSummary {
  const existingSongIds = new Set(currentSongs.map((s) => s.id));
  const existingSetlistIds = new Set(currentSetlists.map((s) => s.id));

  let songsAdded = 0;
  let songsReplaced = 0;
  for (const song of backup.songs) {
    if (existingSongIds.has(song.id)) songsReplaced++;
    else songsAdded++;
  }

  let setlistsAdded = 0;
  let setlistsReplaced = 0;
  for (const setlist of backup.setlists) {
    if (existingSetlistIds.has(setlist.id)) setlistsReplaced++;
    else setlistsAdded++;
  }

  return { songsAdded, songsReplaced, setlistsAdded, setlistsReplaced };
}

/**
 * Trigger a browser download of a JSON string under the given filename. Safe
 * to call on the server — it no-ops when `document` is undefined.
 */
export function triggerJsonDownload(filename: string, json: string): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function reviveDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseSong(value: unknown): Song | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || !value.id) return null;
  if (typeof value.title !== "string") return null;
  if (typeof value.artist !== "string") return null;
  if (typeof value.content !== "string") return null;
  if (typeof value.key !== "string") return null;
  if (typeof value.bpm !== "number" || !Number.isFinite(value.bpm)) return null;
  const createdAt = reviveDate(value.createdAt);
  const updatedAt = reviveDate(value.updatedAt);
  if (!createdAt || !updatedAt) return null;
  return {
    id: value.id,
    title: value.title,
    artist: value.artist,
    content: value.content,
    key: value.key,
    bpm: value.bpm,
    createdAt,
    updatedAt,
  };
}

function parseSetlist(value: unknown): Setlist | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || !value.id) return null;
  if (typeof value.name !== "string") return null;
  if (!Array.isArray(value.songIds)) return null;
  if (!value.songIds.every((s): s is string => typeof s === "string")) return null;
  const createdAt = reviveDate(value.createdAt);
  if (!createdAt) return null;
  return {
    id: value.id,
    name: value.name,
    songIds: value.songIds,
    createdAt,
  };
}
