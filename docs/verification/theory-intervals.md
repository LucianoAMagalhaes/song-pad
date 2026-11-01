# Teoria — validação de Intervalos (#37)

Implementação do [ticket #37](https://github.com/LucianoAMagalhaes/song-pad/issues/37), segundo a [especificação #35](https://github.com/LucianoAMagalhaes/song-pad/issues/35). Branch `feat/theory-intervals`, criada a partir de `405d397`. Verificação em 2026-11-01.

## Comportamento e fronteiras

- O modo Intervalos oferece duas leituras: relação com uma nota de referência e comparação entre duas posições concretas. Mudar de leitura ou modo conserva a posição seleccionada.
- A relação destaca referências com R e alvos com o símbolo do intervalo, do uníssono à oitava. As mesmas classes repetem-se nas várias oitavas; seleccionar oitava na relação não declara uma distância real de 12 semitons entre quaisquer duas posições.
- `getIntervalMap` constrói o mapa completo e conserva a letra/alteração exigida pelo intervalo. C–F# e C–Gb ocupam as mesmas posições, mas representam quarta aumentada e quinta diminuta. E#, B#, Cb e alterações duplas conservam a grafia e o registo escrito.
- `describeInterval` compara alturas concretas e devolve nome, direcção e semitons. Para intervalos simples usa letras e distância cromática; acima de 12 semitons apresenta “Mais de uma oitava”, sem nomes compostos. Se a grafia ultrapassar oito graus apesar de uma distância cromática até 12, apresenta “Fora dos intervalos simples”. Ambas as funções pertencem ao núcleo puro `src/lib/theory.ts`, sem React, Firebase, browser ou armazenamento.
- A comparação permite escolher a referência e o alvo no braço. As setas percorrem posições; durante a escolha da referência, conservam o alvo e Enter/Espaço confirma. Mudar de modo/leitura cancela a escolha em curso.
- O braço mantém as 150 posições 0–24, rótulos da afinação padrão, símbolos/texto de referência e alvo, contorno de selecção e entrada única por Tab.
- Escalas, preferências e arranque/recarregamento offline continuam nos tickets seguintes. Não houve deploy nesta sessão.

## Testes automatizados

Fronteiras aprovadas em #35: API pública do núcleo e interface de Teoria com cálculos reais. Testes acrescentados em `src/__tests__/theory.test.ts` e `src/__tests__/Theory.test.tsx`.

Casos verificados:

- C4→G4: quinta justa ascendente, 7 semitons; C4→G3: quarta justa descendente, 5 semitons.
- C3→E4: 16 semitons, mais de uma oitava; sentido inverso descendente. E2→E3: oitava justa, 12 semitons.
- A2 em duas posições: uníssono, 0 semitons, mantendo corda/casa distintas.
- Todos os intervalos disponíveis a partir de C, com notas e nomes explícitos; uníssono e oitava partilham classes sem apagar registos.
- C–F# versus C–Gb; C#–E#, D#–F##, G#–B# e Db–Cb. Cb4 corresponde à mesma altura de B3; o rótulo da 2.ª corda continua B.
- Fluxos de modo, referência, intervalo, leitura, referência/alvo e teclado; detalhes e resultados visíveis com o núcleo real.

Comandos: testes focados de Teoria, `npm run type-check`, `npm run lint`, suite completa `npm test` e `npm run build` (webpack/export estático).

Resultado final: **114 testes passaram em 14 ficheiros**; TypeScript, ESLint e Prettier passaram. O build final gerou `/theory` estática. Uma verificação adicional percorreu 5 355 000 comparações entre posições para todas as referências/intervalos disponíveis, sem nomes indefinidos ou valores NaN. O caso limite Ebb5→D#4 tem um teste de regressão público.

## Browser e referência visual

A validação usa Chromium headless sobre o export de produção, servido por HTTP local. O acesso anónimo usa os providers reais. A exploração autenticada usa uma conta sintética na fronteira do SDK Firebase Auth, mantendo providers, AuthGuard, página e núcleo reais; não representa um login Google real.

O build com webpack gerou `/theory` estática. Foram confirmados o redireccionamento anónimo para `/login`, 150 posições, relações F#/Gb, registo Cb4/B3, oitava relativa, comparações ascendentes/descendentes, uníssono em posições distintas, distância superior à oitava e escolha de referência/alvo por toque e teclado até às casas 0/24.

| Ecrã       | Viewport  | Overflow da página | Braço inteiro sem scroll | Largura mínima de toque |
| ---------- | --------- | ------------------ | ------------------------ | ----------------------- |
| Desktop    | 1440×1000 | Nenhum             | Sim                      | 44,33 px                |
| Tablet     | 820×1180  | Nenhum             | Scroll horizontal        | 44,09 px                |
| Smartphone | 390×844   | Nenhum             | Scroll horizontal        | 44,09 px                |
| Estreito   | 320×800   | Nenhum             | Scroll horizontal        | 44,09 px                |

Nenhum erro JavaScript nem pedido Firestore foi observado durante a exploração. Depois de desligar a rede, foi possível escolher D#, terça maior e inspeccionar F##4. Isto verifica cálculos locais após carga, não arranque/recarregamento offline da PWA (ticket #40).

Capturas inspeccionadas contra a alternativa A: superfícies escuras, referências verdes, alvos claros, trastes cinzentos e selecção com contorno. Para reproduzir, servir `out/` com URLs limpos, autenticar e abrir `/theory`; repetir os fluxos acima nas quatro larguras.

- [Desktop — relação](theory-intervals/desktop.png)
- [Tablet — relação](theory-intervals/tablet.png)
- [Smartphone — comparação](theory-intervals/mobile.png)

## Revisão

Revisão Standards/Spec contra o ponto inicial `405d397`, com o ticket #37 e os critérios transversais de #35.

### Standards

Nenhuma violação documentada. Uma heurística de Primitive Obsession identificou que o contrato de `SimpleInterval` aceitava graus fora da extensão simples. A união de tipos 1–8 e a verificação das escolhas com `satisfies` resolveram o achado, com confirmação do revisor. Núcleo independente de React/browser/Firebase; regras de língua, fronteiras de teste e documentação respeitadas.

### Spec

Nenhum requisito em falta, comportamento incorrecto ou funcionalidade fora do âmbito identificado. Foram confirmados os intervalos simples, comparação de alturas concretas, direcção/semitons, uníssono, distâncias superiores à oitava, grafias e acesso por teclado. Escalas, preferências e recarregamento offline permanecem nos incrementos seguintes.

Resultado final: **0 achados pendentes em Standards; 0 em Spec**.
