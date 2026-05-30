"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useSongs } from "@/hooks/useSongs";
import type { Setlist, SetlistInput } from "@/models/setlist";
import type { Song } from "@/models/song";

interface SetlistFormProps {
  initialSetlist?: Setlist;
  submitLabel: string;
  onSubmit: (input: SetlistInput) => Promise<void>;
  /** Provided in edit mode. When present, renders a destructive "Eliminar" action. */
  onDelete?: () => Promise<void> | void;
}

export function SetlistForm({ initialSetlist, submitLabel, onSubmit, onDelete }: SetlistFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initialSetlist?.name ?? "");
  const [chosenIds, setChosenIds] = useState<string[]>(initialSetlist?.songIds ?? []);
  const [query, setQuery] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const allSongs = useSongs();

  const songsById = useMemo(() => {
    const map = new Map<string, Song>();
    for (const song of allSongs ?? []) {
      map.set(song.id, song);
    }
    return map;
  }, [allSongs]);

  /**
   * Songs that pass the search filter and are not yet in the setlist.
   * The available pane shows these so the user only sees actionable rows.
   */
  const availableSongs = useMemo(() => {
    if (!allSongs) return [];
    const needle = query.trim().toLowerCase();
    return allSongs.filter((song) => {
      if (chosenIds.includes(song.id)) return false;
      if (!needle) return true;
      return (
        song.title.toLowerCase().includes(needle) || song.artist.toLowerCase().includes(needle)
      );
    });
  }, [allSongs, chosenIds, query]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function addSong(id: string) {
    setChosenIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  function removeSong(id: string) {
    setChosenIds((prev) => prev.filter((existing) => existing !== id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setChosenIds((prev) => {
      const from = prev.indexOf(String(active.id));
      const to = prev.indexOf(String(over.id));
      if (from === -1 || to === -1) return prev;
      return arrayMove(prev, from, to);
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("O nome é obrigatório.");
      return;
    }
    setNameError(null);

    setIsSaving(true);
    try {
      await onSubmit({ name: trimmedName, songIds: chosenIds });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    const confirmed = window.confirm(
      "Eliminar esta setlist? As músicas continuam na tua biblioteca.",
    );
    if (!confirmed) return;
    await onDelete();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="setlist-name" className="text-sm font-semibold text-foreground">
          Nome
        </label>
        <Input
          id="setlist-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Ensaio 23/05"
          autoFocus
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? "setlist-name-error" : undefined}
        />
        {nameError ? (
          <p id="setlist-name-error" className="text-sm text-red-400">
            {nameError}
          </p>
        ) : null}
      </div>

      <section className="flex flex-col gap-3">
        <header className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Músicas escolhidas</h2>
          <span className="text-xs text-muted">
            {chosenIds.length === 1 ? "1 música" : `${chosenIds.length} músicas`}
          </span>
        </header>

        {chosenIds.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-surface/50 p-4 text-sm text-muted">
            Adiciona músicas a partir da lista abaixo. Arrasta para reordenar.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={chosenIds} strategy={verticalListSortingStrategy}>
              <ul className="flex flex-col gap-2">
                {chosenIds.map((id, index) => {
                  const song = songsById.get(id);
                  return (
                    <SortableChosenRow
                      key={id}
                      id={id}
                      index={index}
                      song={song}
                      onRemove={() => removeSong(id)}
                    />
                  );
                })}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <header>
          <h2 className="text-sm font-semibold text-foreground">Adicionar música</h2>
        </header>

        <Input
          type="search"
          placeholder="Pesquisar por título ou artista..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Pesquisar músicas"
        />

        {allSongs === undefined ? (
          <p className="text-sm text-muted py-4 text-center">A carregar...</p>
        ) : allSongs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-surface/50 p-4 text-sm text-muted">
            Ainda não tens músicas na biblioteca. Cria uma em <em>Músicas → + Nova</em>.
          </p>
        ) : availableSongs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-surface/50 p-4 text-sm text-muted">
            {query.trim()
              ? `Sem resultados para "${query}".`
              : "Já adicionaste todas as músicas da biblioteca."}
          </p>
        ) : (
          <ul className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
            {availableSongs.map((song) => (
              <li key={song.id}>
                <button
                  type="button"
                  onClick={() => addSong(song.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-surface border border-border hover:bg-surface-hover hover:border-accent/50 transition-colors text-left"
                >
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold text-foreground truncate">
                      {song.title || "Sem título"}
                    </span>
                    <span className="block text-sm text-muted truncate">
                      {song.artist || "Artista desconhecido"}
                    </span>
                  </span>
                  <span aria-hidden="true" className="text-accent text-lg font-bold">
                    +
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        {onDelete ? (
          <Button
            type="button"
            variant="ghost"
            onClick={handleDelete}
            disabled={isSaving}
            className="text-red-400 sm:mr-auto"
          >
            Eliminar setlist
          </Button>
        ) : (
          <span className="sm:mr-auto" />
        )}

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "A guardar..." : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}

interface SortableChosenRowProps {
  id: string;
  index: number;
  song: Song | undefined;
  onRemove: () => void;
}

function SortableChosenRow({ id, index, song, onRemove }: SortableChosenRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-border"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Arrastar ${song?.title ?? "música"}`}
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface-hover hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
      >
        <span aria-hidden="true" className="font-mono text-lg leading-none">
          ⠿
        </span>
      </button>

      <span className="flex-shrink-0 w-6 text-center text-xs font-mono text-muted">
        {index + 1}
      </span>

      <span className="flex-1 min-w-0">
        {song ? (
          <>
            <span className="block font-semibold text-foreground truncate">
              {song.title || "Sem título"}
            </span>
            <span className="block text-sm text-muted truncate">
              {song.artist || "Artista desconhecido"}
            </span>
          </>
        ) : (
          <span className="block text-sm italic text-muted">
            Música indisponível (foi eliminada?)
          </span>
        )}
      </span>

      <Button
        type="button"
        variant="ghost"
        onClick={onRemove}
        aria-label="Remover da setlist"
        className="h-9 w-9 px-0 text-muted hover:text-red-400"
      >
        ×
      </Button>
    </li>
  );
}
