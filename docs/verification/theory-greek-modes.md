# Teoria — validação de Modos Gregos

Implementação da [especificação aprovada](../planning/greek-modes.md), na branch `feat/theory-greek-modes`, criada a partir de `main` (`bdf317f`). Verificação em 2026-11-02.

## Comportamento

- «Modos Gregos» é a quarta área de Teoria. Disponibiliza Jónio (maior), Dórico, Frígio, Lídio, Mixolídio, Eólio (menor natural) e Lócrio, em todas as tónicas do selector existente.
- A consulta mostra notas ordenadas e fórmula em simultâneo, com leitura Notas/Graus no braço contínuo das casas 0–24. Posição, registo, graus, intervalos e grafia contextual reutilizam o núcleo de Escalas.
- «Mesma tónica» apresenta sete modos paralelos e permite seleccionar a referência das diferenças. Por exemplo, Ré dórico contra Ré eólio mostra B/6 em vez de Bb/b6. A indicação textual acompanha o sublinhado das notas alteradas.
- «Mesmas notas» apresenta os sete modos relativos com a grafia do conjunto original. Escolher Mi frígio a partir de Ré dórico conserva as notas e muda a tónica e os graus. A explicação distingue centro musical de primeira nota tocada.
- Alternar as vistas conserva a escala em estudo; escolher uma linha actualiza o único braço. A posição seleccionada mantém corda/casa durante a sessão, incluindo as trocas entre as quatro áreas.
- As preferências de Modos Gregos são locais e independentes de Escalas: tónica, modo musical, leitura, vista e referência. São guardadas por conta em `songpad:greek-modes:<uid codificado>`, com versão 1. O adaptador de Teoria continua a ler os registos anteriores e admite a nova área como última área aberta.
- Tónicas contextuais alcançadas pelos relativos, como E# em C# maior, permanecem seleccionáveis e restauráveis. Dados inválidos ou armazenamento indisponível recuperam defaults ou permitem continuar em memória. A montagem inicial é idêntica no servidor e no cliente; o restauro ocorre após montagem.
- Sem áudio, exercícios, harmonização, dedilhados/CAGED ou integração com músicas. Sem novas dependências, alterações ao Firestore ou ao backup. Não houve deploy.

## Verificação automatizada

**241 testes passaram em 21 ficheiros.** TypeScript, ESLint, Prettier, `git diff --check` e build estático de produção com webpack/Serwist passaram. `/theory` continua no export estático.

- `greekModes.test.ts`: sete escalas explícitas em Ré; pertença, graus e tónica nas 150 posições; todos os modos em todas as grafias do selector; invariância do conjunto escrito nas rotações relativas; equivalências Jónio/maior e Eólio/menor natural; referência arbitrária; alterações duplas, E# e intervalos aumentados/diminutos.
- `greekModePreferences.test.ts`: formato versionado com apenas campos persistentes; compatibilidade dos registos antigos de Teoria; independência de Escalas e de outras contas; tónicas contextuais; recuperação de dados inválidos e falhas de acesso/leitura/gravação.
- `GreekModes.test.tsx`: interface com núcleo real, as duas vistas e referência seleccionável; restauro de preferências e reinício de posições transitórias; isolamento entre contas; teclado; exploração sem armazenamento; SSR/hidratação em Strict Mode sem sobrescrita das escolhas.
- A regressão de teclado de Escalas inclui o novo botão na ordem de Tab. Os fluxos anteriores de Notas, Intervalos, Escalas, músicas e setlists continuam a passar.

## Browser de produção e offline

`npm run test:offline` serve o export por HTTP local e utiliza Chromium com o service worker real. A autenticação é uma sessão sintética persistida na fronteira Firebase Auth; os providers e o AuthGuard são reais. O acesso anónimo redireccionou para login. Esta validação não representa um novo login Google real.

| Ecrã       | Viewport  | Interacção     | Resultado |
| ---------- | --------- | -------------- | --------- |
| Desktop    | 1440×1000 | Clique/teclado | Passou    |
| Tablet     | 820×1180  | Toque/teclado  | Passou    |
| Smartphone | 390×844   | Toque/teclado  | Passou    |
| Estreito   | 320×800   | Toque/teclado  | Passou    |

Em cada viewport, com a rede desligada:

- Recarregar `/theory` obtém o documento através do service worker.
- As quatro áreas continuam utilizáveis; os sete modos são seleccionáveis e o quadro tem sete linhas musicais.
- Ré dórico/Ré eólio evidencia o sexto grau; Ré dórico → Mi frígio conserva as notas; mudar de vista conserva Mi frígio.
- C# jónio → E# frígio mantém a grafia e as escolhas após recarregar e numa nova aba. A posição temporária reinicia; a exploração por teclado alcança a casa 24.
- Voltar a Escalas recupera a tónica, família e leitura anteriores; os acessos por Músicas e Setlists continuam operacionais.
- Não há overflow da página. O braço tem scroll horizontal nos ecrãs pequenos; o quadro comparativo adapta as notas à largura disponível.
- Não há erros JavaScript nem pedidos Firestore durante a exploração.

As capturas abaixo foram inspeccionadas. Reproduzir com `npm run build` seguido de `npm run test:offline`, num ambiente com as bibliotecas habituais do Chromium. Nesta sessão, as bibliotecas em falta foram extraídas em `/tmp/songpad-greek-browser` e fornecidas por `LD_LIBRARY_PATH`, sem instalação no sistema ou alterações às dependências da app.

- [Desktop — modos paralelos](theory-greek-modes/desktop.png)
- [Tablet — modos paralelos](theory-greek-modes/tablet.png)
- [Smartphone — modos relativos](theory-greek-modes/mobile.png)
- [320 px — modos paralelos](theory-greek-modes/narrow.png)

Primeiro login e obtenção dos recursos continuam a exigir rede, conforme a fronteira offline existente.
