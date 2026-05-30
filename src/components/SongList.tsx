"use client";

import { useState } from "react";
import { useSongs } from "@/hooks/useSongs";
import { SongCard } from "@/components/SongCard";
import { Input } from "@/components/ui/Input";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export function SongList() {
  const [query, setQuery] = useState("");

  const songs = useSongs(query);
  const isLoading = songs === undefined;
  const isEmpty = !isLoading && songs.length === 0;
  const isSearching = query.trim().length > 0;

  return (
    <div className="flex flex-col gap-6">
      <Input
        type="search"
        placeholder="Pesquisar por título ou artista..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Pesquisar músicas"
      />

      {isLoading ? (
        <div className="text-muted text-sm py-8 text-center">A carregar...</div>
      ) : isEmpty && isSearching ? (
        <EmptyState
          title="Sem resultados"
          description={`Não encontrámos nenhuma música com "${query}".`}
        />
      ) : isEmpty ? (
        <EmptyState
          title="Ainda não tens músicas"
          description="Adiciona a primeira cifra à tua biblioteca."
          action={<LinkButton href="/songs/new">Criar primeira música</LinkButton>}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {songs.map((song) => (
            <li key={song.id}>
              <SongCard song={song} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
