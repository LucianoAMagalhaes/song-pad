# CLAUDE.md — SongPad (PWA)

## Visão Geral do Projeto

SongPad é um songbook digital em formato PWA para músicos. Permite criar, organizar e visualizar cifras e letras durante ensaios e apresentações ao vivo. Desenvolvido como Progressive Web App — instalável em qualquer dispositivo, funciona offline, sem necessidade de App Store.

- **Nome da app:** SongPad
- **Repositório:** song-pad
- **Âmbito actual:** Uso pessoal, mas com sincronização entre os dispositivos do próprio utilizador (tablet, smartphone, desktop). Implica deployment com HTTPS para a PWA ser instalável. Acesso protegido por autenticação (só o utilizador acede).

## Fluxo de Trabalho com o Claude Code

Em cada funcionalidade ou decisão técnica, seguir sempre esta ordem:

1. **Decisão** — apresentar as opções relevantes, explicar os prós e contras de cada uma e aguardar a escolha antes de avançar
2. **Explicação** — antes de escrever código, explicar o que vai ser implementado, como funciona e porquê
3. **Implementação** — escrever o código seguindo todas as convenções deste ficheiro
4. **Documentação** — documentar o que foi feito (docstrings, comentários no código, e actualizar o `CLAUDE.md` com o estado actual e próximos passos)

> Nunca saltar etapas. Se uma decisão não estiver clara, perguntar antes de avançar.

## Estado Actual do Projeto

> Actualizar esta secção a cada sessão de trabalho.

- **Fase:** MVP (Fase 1) completo. Próxima fase a iniciar: **Fase 3 (cloud)** — sincronização entre dispositivos via Firebase (decisão tomada na sessão de 2026-05-29; ver "Decisão de arquitectura cloud" abaixo). A Fase 2 (pós-MVP) fica adiada por opção do utilizador.
- **Repositório criado:** Sim — https://github.com/LucianoAMagalhaes/song-pad (público)
- **Projecto Next.js iniciado:** Sim — Next.js **16.2.6** + React **19.2.4** + Tailwind **v4**
- **Tooling configurado:** Prettier + Husky + lint-staged + Vitest
- **PWA configurada:** Sim — Serwist (`@serwist/next` 9.5.x) + manifest + ícones placeholder
- **Camada de dados:** Sim — Dexie (`songpad` DB v1) com tabelas `songs` e `setlists`; repositórios em `src/repositories/` (ambos com `search`)
- **Lógica de acordes:** Sim — `chordProParser` (parse/serialize) + `chordTransposer` (transposeChord/transposeContent) em `src/lib/`
- **UI base:** Sim — tema dark Spotify-inspired, primitivos `Button`/`Input`/`Textarea`/`EmptyState` em `src/components/ui/`, `SongCard` + `SongList`, ecrã `/songs` com pesquisa e estado vazio
- **Editor de músicas:** Sim — `SongForm` partilhado entre `/songs/new` e `/songs/[id]/edit`, validação de título obrigatório, redirecciona para `/songs` após guardar
- **Visualizador de músicas:** Sim — `/songs/[id]` com `ChordRenderer` (acordes acima da sílaba), `Transposer` (−/+/↻ com `C → D`), inferência sharps/flats baseada no tom alvo, e acções Editar/Eliminar/Voltar
- **Setlists:** Sim — `SetlistForm` partilhado entre `/setlists/new` e `/setlists/[id]/edit`, com pesquisa de músicas, drag-and-drop (`@dnd-kit`) para reordenar, validação de nome obrigatório e eliminação a partir do form de edição. `SetlistCard` + `SetlistList` para a listagem em `/setlists`. Navegação Songs ↔ Setlists no header de cada página.
- **Player de setlist:** Sim — `/setlists/[id]` (stage view) com `SetlistPlayer`: uma música de cada vez, navegação Anterior/Seguinte + teclado ←/→ (ignora foco em inputs), indicador "n / total", transposição por música persistida em memória durante a sessão, edge cases (setlist vazia + música órfã). Helpers de tom (`shouldUseFlats`, `safeTransposeKey`) extraídos para `src/lib/keyDisplay.ts` e partilhados com o viewer individual.
- **Definições e backup:** Sim — `/settings` com export JSON (`buildBackup` + `triggerJsonDownload`, nome `songpad-backup-YYYY-MM-DD.json`) e import (`parseBackup` valida version + schema; `summarizeImport` mostra preview no `window.confirm`; aplicação via `songRepository.upsert` / `setlistRepository.upsert`, merge por id). Link "Definições" no header de `/songs` e `/setlists`. Cobertura em `src/__tests__/backup.test.ts`.
- **Export estático validado:** Sim — `next.config.ts` com `output: "export"`. As 4 rotas dinâmicas (`/songs/[id]`, `/songs/[id]/edit`, `/setlists/[id]`, `/setlists/[id]/edit`) foram refactorizadas: cada `page.tsx` é agora um Server Component fino que exporta `generateStaticParams()` (placeholder `{ id: "_" }`) e renderiza um componente client co-localizado (`SongView`, `SongEditor`, `SetlistPlay`, `SetlistEditor`) que lê o `id` em runtime via `useParams()`. O `manifest.ts` levou `export const dynamic = "force-static"`. Build gera `out/songs/_.html`, `out/songs/_/edit.html`, `out/setlists/_.html`, `out/setlists/_/edit.html` como cascas. Validado com Chromium headless servindo `out/` com os rewrites planeados: as rotas `[id]` resolvem no cliente (não dão 404). **Conclusão: viável no plano Spark gratuito.** Ver "Rewrites do Firebase Hosting" abaixo.
- **Projecto Firebase criado:** Sim — ID `song-pad-app` (display "SongPad"), conta `lucianoamaro.m@gmail.com`. App web registada (App ID `1:1072999656233:web:bcb930f2c0a94cc8636538`). Consola: https://console.firebase.google.com/project/song-pad-app/overview. URL de hosting prevista: `https://song-pad-app.web.app`.
- **Config Firebase:** Sim — chaves em `NEXT_PUBLIC_FIREBASE_*` no `.env.local` (fora do Git; template em `.env.example`). SDK `firebase` 12.x instalado. Inicialização singleton em `src/lib/firebase.ts` (`getFirebaseApp()`). Auth e Firestore entram nos passos seguintes.
- **Autenticação (login Google):** Sim — `AuthProvider` em `src/contexts/AuthContext.tsx` (observa `onAuthStateChanged`, expõe `user`/`loading`/`signInWithGoogle`/`signOut`; `getAuth` resolvido lazy, client-only). `AuthGuard` em `src/components/AuthGuard.tsx` protege rotas (não-autenticado → `/login`; autenticado em `/login` → `/songs`; spinner enquanto resolve). Ambos montados no root via `src/app/providers.tsx` (wrapper client dentro do `layout.tsx` Server Component). Página de login dedicada em `src/app/login/page.tsx` (`signInWithPopup`, tema dark, botão "Entrar com Google"). Secção "Conta" + botão "Sair" em `/settings`. Build estático continua a passar (`/login` prerenderizada). **Falta ativar o provedor Google no console** (Authentication → Sign-in method → Google → Enable) para o login funcionar em runtime.
- **Última branch trabalhada:** `feat/firebase-auth`
- **Último PR merged:** #14 (`feat/firebase-setup`)

### Decisão de arquitectura cloud (sessão 2026-05-29)

Objectivo: as músicas e setlists devem sincronizar automaticamente entre os dispositivos do utilizador (tablet, smartphone, desktop), mesmo sendo uso pessoal.

Rumo decidido — **tudo no Firebase, plano gratuito Spark como objectivo**:

- **Hosting:** Firebase Hosting (clássico, estático). Objectivo: configurar a app como **export estático do Next.js** (`output: 'export'`) para caber no plano Spark gratuito e sem cartão de crédito. A app é toda client-side (dados no browser/Firestore), por isso o export estático é viável. **A validar logo no início:** as rotas dinâmicas `/songs/[id]` e `/setlists/[id]` têm de resolver no cliente em modo estático. Se o export estático se revelar inviável e for preciso SSR, isso obriga a Firebase App Hosting → plano Blaze (pede cartão; ~€0/mês na realidade, mas pôr alerta/limite de orçamento no Google Cloud). Nesse caso, falar com o utilizador antes de mudar para Blaze.
- **Base de dados:** Cloud Firestore (plano Spark — 1 GiB, ~50k leituras/dia, ~20k escritas/dia; muito acima do necessário). Sync automático em tempo real e offline-first.
- **Autenticação:** Firebase Auth com **login Google**. Só o utilizador acede aos seus dados (regras de segurança do Firestore por `uid`).
- **Migração de dados:** a camada de acesso está isolada em `src/repositories/`, por isso a sincronização entra aí. Há que migrar os dados que já existem em IndexedDB local para o Firestore (reaproveitar o `buildBackup`/import existente ou rotina de migração própria).
- **Custo esperado:** €0/mês à escala de uso pessoal.

### Rewrites do Firebase Hosting (para o passo de deploy)

O export estático gera uma casca por rota dinâmica (`_`). Como os `id`s reais só existem no browser, o Firebase Hosting tem de reescrever cada pedido `/songs/<id>` etc. para a casca correspondente. No `firebase.json` (a criar no passo de deploy), por **ordem** (mais específico primeiro), com `"cleanUrls": true`:

```jsonc
"rewrites": [
  { "source": "/songs/*/edit",    "destination": "/songs/_/edit.html" },
  { "source": "/songs/*",          "destination": "/songs/_.html" },
  { "source": "/setlists/*/edit",  "destination": "/setlists/_/edit.html" },
  { "source": "/setlists/*",       "destination": "/setlists/_.html" }
]
```

Os ficheiros estáticos reais (`/songs`, `/songs/new`, etc.) são servidos antes dos rewrites, por isso não há colisão. Confirmado com servidor estático local + Chromium headless.

> ⚠️ **Atenção a versões**: o `create-next-app` instalou Next.js 16 (não 14 como previsto originalmente) e Tailwind v4 (não v3). Ambos têm breaking changes face a versões anteriores. Ver `AGENTS.md` na raiz e consultar `node_modules/next/dist/docs/` antes de escrever código.

> ⚠️ **Webpack obrigatório (não Turbopack)**: o `@serwist/next` não suporta Turbopack. Os scripts `dev` e `build` correm com `--webpack`. Quando o Serwist suportar Turbopack (ver https://github.com/serwist/serwist/issues/54), remover as flags. Build mais lento mas funcional.

### O que já está decidido

- Nome: SongPad / repo: song-pad
- Stack: Next.js 16 + React 19 + TypeScript (strict) + Tailwind v4 + Dexie.js + PWA
- Design: Spotify-inspired, dark + light mode
- Armazenamento: IndexedDB local no MVP, Firebase na Fase 3
- Git: Conventional Commits, branches por funcionalidade, PR para main

## Próximos Passos

> O Claude Code deve seguir esta ordem. Marcar como concluído à medida que avança.

- [x] Criar repositório `song-pad` no GitHub
- [x] Iniciar projecto com `create-next-app` e configurar TypeScript strict
- [x] Configurar Prettier + Husky + lint-staged
- [x] Configurar Vitest
- [x] Configurar PWA (manifest + Service Worker via Serwist) — usar `--webpack`
- [x] Implementar modelos de dados (`song.ts`, `setlist.ts`)
- [x] Implementar `db.ts` (instância Dexie com tabelas)
- [x] Implementar repositórios (`songRepository.ts`, `setlistRepository.ts`)
- [x] Implementar `chordProParser.ts` com testes
- [x] Implementar `chordTransposer.ts` com testes
- [x] Ecrã: lista de músicas
- [x] Ecrã: criar/editar música
- [x] Ecrã: visualizador de música com transposição
- [x] Ecrã: setlists
- [x] Ecrã: player de setlist
- [x] Ecrã: definições (exportar/importar backup)

### Fase 3 — Sincronização cloud (Firebase) — a iniciar

> Ordem sugerida. A decisão de arquitectura está em "Estado Actual do Projeto".

- [x] Criar projecto Firebase + configurar app web (chaves em variáveis de ambiente) ✅ projecto `song-pad-app`, app web registada, SDK `firebase` 12.x, `src/lib/firebase.ts`
- [x] Validar export estático do Next.js (`output: 'export'`) com as rotas dinâmicas `[id]` a resolver no cliente — confirmar que cabe no plano Spark gratuito ✅ viável (ver "Estado Actual")
- [x] Configurar Firebase Auth com login Google + ecrã/fluxo de login ✅ `AuthContext` + `AuthGuard` + `/login` + "Sair" em `/settings`. Falta ativar o provedor Google no console.
- [ ] Definir schema Firestore (colecções `songs`, `setlists` por `uid`) + regras de segurança
- [ ] Adaptar `songRepository` e `setlistRepository` para Firestore (sync em tempo real, offline-first)
- [ ] Rotina de migração dos dados locais (IndexedDB) para o Firestore
- [ ] Configurar Firebase Hosting + deploy

## Stack Tecnológica

- **Framework:** Next.js 16 (App Router, webpack build)
- **Linguagem:** TypeScript (strict mode)
- **Estilização:** Tailwind v4
- **Armazenamento local:** IndexedDB via Dexie.js
- **PWA:** Serwist (`@serwist/next` + `serwist`) — Service Worker em `src/app/sw.ts`, manifest em `src/app/manifest.ts`
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
  content: string; // Letra + acordes em formato ChordPro
  key: string; // Tom original (ex: "G", "Am")
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
  songIds: string[]; // IDs ordenados
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

> **Em curso** a partir de 2026-05-29 (ver "Decisão de arquitectura cloud" e checklist em "Próximos Passos"). Tudo no Firebase (Hosting + Firestore + Auth Google), objectivo plano gratuito Spark.

- Autenticação Firebase (login Google)
- Sincronização entre dispositivos (Firestore, offline-first)
- Deployment via Firebase Hosting (export estático Next.js)
- Partilha de músicas entre utilizadores
- Biblioteca partilhada para bandas/grupos
- Empacotamento com Capacitor para App Store / Play Store

## Regras de Língua (Estritas)

| O quê                                           | Língua    |
| ----------------------------------------------- | --------- |
| Código (variáveis, funções, classes, tipos)     | Inglês    |
| Ficheiros e pastas                              | Inglês    |
| Comentários e docstrings                        | Inglês    |
| Commits e nomes de branches Git                 | Inglês    |
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
