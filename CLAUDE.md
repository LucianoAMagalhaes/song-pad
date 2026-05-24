# CLAUDE.md — SongPad (PWA)

## Visão Geral do Projeto

SongPad é um songbook digital em formato PWA para músicos. Permite criar, organizar e visualizar cifras e letras durante ensaios e apresentações ao vivo. Desenvolvido como Progressive Web App — instalável em qualquer dispositivo, funciona offline, sem necessidade de App Store.

- **Nome da app:** SongPad
- **Repositório:** song-pad
- **Âmbito actual:** Uso pessoal (sem deployment público planeado por agora)

## Fluxo de Trabalho com o Claude Code

Em cada funcionalidade ou decisão técnica, seguir sempre esta ordem:

1. **Decisão** — apresentar as opções relevantes, explicar os prós e contras de cada uma e aguardar a escolha antes de avançar
2. **Explicação** — antes de escrever código, explicar o que vai ser implementado, como funciona e porquê
3. **Implementação** — escrever o código seguindo todas as convenções deste ficheiro
4. **Documentação** — documentar o que foi feito (docstrings, comentários no código, e actualizar o `CLAUDE.md` com o estado actual e próximos passos)

> Nunca saltar etapas. Se uma decisão não estiver clara, perguntar antes de avançar.

## Estado Actual do Projeto

> Actualizar esta secção a cada sessão de trabalho.

- **Fase:** Pré-desenvolvimento — planeamento concluído
- **Repositório criado:** Não
- **Projecto Next.js iniciado:** Não
- **Última branch trabalhada:** —
- **Último PR merged:** —

### O que já está decidido
- Nome: SongPad / repo: song-pad
- Stack: Next.js 14 + TypeScript + Tailwind + Dexie.js + next-pwa
- Design: Spotify-inspired, dark + light mode
- Armazenamento: IndexedDB local no MVP, Firebase na Fase 3
- Git: Conventional Commits, branches por funcionalidade, PR para main

## Próximos Passos

> O Claude Code deve seguir esta ordem. Marcar como concluído à medida que avança.

- [ ] Criar repositório `song-pad` no GitHub
- [ ] Iniciar projecto com `create-next-app` e configurar TypeScript strict
- [ ] Configurar Prettier + Husky + lint-staged
- [ ] Configurar Vitest
- [ ] Configurar next-pwa (manifest + Service Worker)
- [ ] Implementar modelos de dados (`song.ts`, `setlist.ts`)
- [ ] Implementar `db.ts` (instância Dexie com tabelas)
- [ ] Implementar repositórios (`songRepository.ts`, `setlistRepository.ts`)
- [ ] Implementar `chordProParser.ts` com testes
- [ ] Implementar `chordTransposer.ts` com testes
- [ ] Ecrã: lista de músicas
- [ ] Ecrã: criar/editar música
- [ ] Ecrã: visualizador de música com transposição
- [ ] Ecrã: setlists
- [ ] Ecrã: player de setlist
- [ ] Ecrã: definições (exportar/importar backup)

## Stack Tecnológica

- **Framework:** Next.js 14+ (App Router)
- **Linguagem:** TypeScript (strict mode)
- **Estilização:** Tailwind CSS
- **Armazenamento local:** IndexedDB via Dexie.js
- **PWA:** next-pwa (Service Worker + manifest)
- **Qualidade de código:** Prettier + Husky + lint-staged
- **Testes:** Vitest
- **Cloud (futuro):** Firebase (Auth + Firestore)
- **Empacotamento nativo (futuro):** Capacitor (iOS/Android sem reescrever)

## Design

- **Referência visual:** Spotify (escuro, moderno)
- **Tema:** Dark mode e light mode desde o início
- **Abordagem:** UI limpa e minimalista. Botões grandes para toque em mobile. O ecrã de visualização de música é o mais importante.

## Estrutura do Projeto

```
song-pad/
  public/
    manifest.json           # PWA manifest (nome, ícones, cores)
    icons/                  # Ícones para instalação PWA
  src/
    app/
      layout.tsx            # Layout global
      page.tsx              # Home — lista de músicas
      songs/
        new/page.tsx        # Criar música
        [id]/page.tsx       # Visualizador de música
        [id]/edit/page.tsx  # Editar música
      setlists/
        page.tsx            # Lista de setlists
        new/page.tsx        # Criar setlist
        [id]/page.tsx       # Player de setlist
      settings/
        page.tsx            # Definições — exportar/importar backup
    components/
      ui/                   # Componentes genéricos (Button, Input, Modal...)
      ChordRenderer.tsx     # Renderiza letra com acordes inline
      Transposer.tsx        # Controlo de +/- semitons
      SongCard.tsx          # Card de música na listagem
      SetlistPlayer.tsx     # Navegação entre músicas no palco
    lib/
      db.ts                 # Instância Dexie (IndexedDB)
      chordTransposer.ts    # Lógica de transposição de acordes
      chordProParser.ts     # Parser do formato ChordPro
      backup.ts             # Lógica de exportação/importação JSON
    models/
      song.ts               # Tipos e interfaces de Song
      setlist.ts            # Tipos e interfaces de Setlist
    repositories/
      songRepository.ts     # CRUD de músicas (Dexie)
      setlistRepository.ts  # CRUD de setlists (Dexie)
    hooks/
      useSongs.ts           # Hook para listagem e pesquisa de músicas
      useSetlist.ts         # Hook para gestão de setlist
```

## Modelos de Dados

### Song
```typescript
interface Song {
  id: string;
  title: string;
  artist: string;
  content: string;    // Letra + acordes em formato ChordPro
  key: string;        // Tom original (ex: "G", "Am")
  bpm: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Setlist
```typescript
interface Setlist {
  id: string;
  name: string;
  songIds: string[];  // IDs ordenados
  createdAt: Date;
}
```

## Formato de Conteúdo (ChordPro)

As músicas são armazenadas em formato ChordPro — acordes entre parênteses rectos imediatamente antes da sílaba correspondente:

```
[G]Imagine there's no [C]heaven
[G]It's easy if you [C]try
```

## Formato de Backup (JSON)

O ficheiro exportado contém todas as músicas e setlists:

```json
{
  "version": 1,
  "exportedAt": "2026-05-23T10:00:00.000Z",
  "songs": [...],
  "setlists": [...]
}
```

O campo `version` permite gerir migrações futuras do formato. Em caso de conflito de IDs, os dados importados substituem os existentes.

## MVP — Funcionalidades da Fase 1

- [ ] Listar músicas com pesquisa por título/artista
- [ ] Criar e editar músicas (título, artista, conteúdo ChordPro, tom, BPM)
- [ ] Visualizador de música (renderização de acordes + letra)
- [ ] Transposição de tom (+/- semitons)
- [ ] Criar e gerir setlists
- [ ] Navegar entre músicas dentro de uma setlist
- [ ] Funcionar offline (PWA Service Worker)
- [ ] Instalável no dispositivo (PWA manifest)
- [ ] Exportar biblioteca completa como backup JSON
- [ ] Importar backup JSON (restaurar músicas e setlists)

## Fase 2 (pós-MVP)

- Auto-scroll sincronizado com BPM
- Modo ecrã cheio para o palco (Fullscreen API)
- Importação de ficheiros ChordPro e OnSong
- Exportação para PDF
- Metrónomo integrado (Web Audio API)
- Controlo por teclado / pedais Bluetooth (Web MIDI API)

## Fase 3 (cloud + nativo)

- Autenticação Firebase
- Sincronização entre dispositivos (Firestore)
- Partilha de músicas entre utilizadores
- Biblioteca partilhada para bandas/grupos
- Empacotamento com Capacitor para App Store / Play Store

## Regras de Língua (Estritas)

| O quê | Língua |
|---|---|
| Código (variáveis, funções, classes, tipos) | Inglês |
| Ficheiros e pastas | Inglês |
| Comentários e docstrings | Inglês |
| Commits e nomes de branches Git | Inglês |
| UI/UX (labels, botões, mensagens, placeholders) | Português |

## Fluxo Git

### Padrão de Commits (Conventional Commits)

```
feat: add chord transposer service
fix: correct auto-scroll timing on setlist player
chore: update dependencies
docs: add setup instructions to README
refactor: extract chord parser into standalone module
test: add unit tests for transposer edge cases
style: format song editor layout for mobile
```

### Estratégia de Branches

```
main                        # sempre estável
feat/song-editor
feat/setlist-player
fix/chord-transposer-sharp
chore/setup-pwa-manifest
```

- Criar sempre a branch a partir de `main`
- Abrir um Pull Request para `main` em cada funcionalidade ou correção
- Nunca fazer commit directo em `main`

## Qualidade de Código

- Prettier para formatação automática
- Husky + lint-staged: corre lint e format antes de cada commit
- Testes unitários obrigatórios para `chordTransposer.ts` e `chordProParser.ts`
- Sem cobertura mínima forçada no MVP — mas os módulos de lógica devem ser testados

## Comandos Úteis

```bash
# Criar projeto
npx create-next-app@latest song-pad --typescript --tailwind --app

# Instalar dependências principais
npm install dexie next-pwa uuid
npm install -D @types/uuid vitest @vitejs/plugin-react prettier husky lint-staged

# Correr em desenvolvimento
npm run dev

# Build de produção
npm run build

# Testar PWA localmente (requer build)
npm run start

# Correr testes
npx vitest
```

## Dependências Previstas (package.json)

```json
{
  "dependencies": {
    "next": "^14",
    "react": "^18",
    "react-dom": "^18",
    "typescript": "^5",
    "tailwindcss": "^3",
    "dexie": "^3.2",
    "next-pwa": "^5.6",
    "uuid": "^9"
  },
  "devDependencies": {
    "@types/uuid": "^9",
    "vitest": "^1",
    "@vitejs/plugin-react": "^4",
    "prettier": "^3",
    "husky": "^9",
    "lint-staged": "^15"
  }
}
```

## Notas para o Claude Code

- Começar sempre pelos modelos de dados e repositórios antes de qualquer UI
- `chordTransposer.ts` e `chordProParser.ts` são módulos puros (sem dependências React) — fáceis de testar com Vitest
- Dexie.js abstrai o IndexedDB e funciona bem com TypeScript e Next.js no lado client
- Todos os acessos ao IndexedDB devem estar em componentes client (`"use client"`) ou em hooks
- O Service Worker do next-pwa é gerado automaticamente no build — não editar manualmente
- Mobile-first desde o início: layout responsivo, touch-friendly, botões grandes
- Testar sempre no Chrome DevTools em modo mobile e com "Offline" activado
- O backup JSON deve ser gerado com `URL.createObjectURL` e uma tag `<a download>` — sem dependências externas
- Validar sempre o campo `version` antes de processar um backup JSON importado
