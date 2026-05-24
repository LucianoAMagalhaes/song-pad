"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { Song, SongInput } from "@/models/song";

interface SongFormProps {
  initialSong?: Song;
  submitLabel: string;
  onSubmit: (input: SongInput) => Promise<void>;
}

export function SongForm({ initialSong, submitLabel, onSubmit }: SongFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialSong?.title ?? "");
  const [artist, setArtist] = useState(initialSong?.artist ?? "");
  const [content, setContent] = useState(initialSong?.content ?? "");
  const [key, setKey] = useState(initialSong?.key ?? "");
  const [bpm, setBpm] = useState<string>(initialSong?.bpm ? String(initialSong.bpm) : "");

  const [titleError, setTitleError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError("O título é obrigatório.");
      return;
    }
    setTitleError(null);

    const parsedBpm = bpm.trim() === "" ? 0 : Number(bpm);
    const safeBpm = Number.isFinite(parsedBpm) && parsedBpm > 0 ? parsedBpm : 0;

    setIsSaving(true);
    try {
      await onSubmit({
        title: trimmedTitle,
        artist: artist.trim(),
        content,
        key: key.trim(),
        bpm: safeBpm,
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="song-title" className="text-sm font-semibold text-foreground">
          Título
        </label>
        <Input
          id="song-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Imagine"
          autoFocus
          aria-invalid={titleError ? true : undefined}
          aria-describedby={titleError ? "song-title-error" : undefined}
        />
        {titleError ? (
          <p id="song-title-error" className="text-sm text-red-400">
            {titleError}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="song-artist" className="text-sm font-semibold text-foreground">
          Artista
        </label>
        <Input
          id="song-artist"
          type="text"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="Ex: John Lennon"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="song-key" className="text-sm font-semibold text-foreground">
            Tom
          </label>
          <Input
            id="song-key"
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Ex: G, Am"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="song-bpm" className="text-sm font-semibold text-foreground">
            BPM
          </label>
          <Input
            id="song-bpm"
            type="number"
            inputMode="numeric"
            min={0}
            value={bpm}
            onChange={(e) => setBpm(e.target.value)}
            placeholder="Ex: 120"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="song-content" className="text-sm font-semibold text-foreground">
          Conteúdo
        </label>
        <Textarea
          id="song-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={"[G]Imagine there's no [C]heaven\n[G]It's easy if you [C]try"}
          rows={12}
        />
        <p className="text-xs text-muted">
          Formato ChordPro — coloca os acordes entre parênteses rectos antes da sílaba (ex.{" "}
          <code className="font-mono">[G]Imagine</code>).
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSaving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "A guardar..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
