"use client";

import { useState } from "react";
import { useSetlists } from "@/hooks/useSetlists";
import { SetlistCard } from "@/components/SetlistCard";
import { Input } from "@/components/ui/Input";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export function SetlistList() {
  const [query, setQuery] = useState("");

  const setlists = useSetlists(query);
  const isLoading = setlists === undefined;
  const isEmpty = !isLoading && setlists.length === 0;
  const isSearching = query.trim().length > 0;

  return (
    <div className="flex flex-col gap-6">
      <Input
        type="search"
        placeholder="Pesquisar por nome..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Pesquisar setlists"
      />

      {isLoading ? (
        <div className="text-muted text-sm py-8 text-center">A carregar...</div>
      ) : isEmpty && isSearching ? (
        <EmptyState
          title="Sem resultados"
          description={`Não encontrámos nenhuma setlist com "${query}".`}
        />
      ) : isEmpty ? (
        <EmptyState
          title="Ainda não tens setlists"
          description="Organiza as tuas músicas em listas de ensaio ou actuação."
          action={<LinkButton href="/setlists/new">Criar primeira setlist</LinkButton>}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {setlists.map((setlist) => (
            <li key={setlist.id}>
              <SetlistCard setlist={setlist} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
