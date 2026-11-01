# Teoria — validação de Notas (#36)

Implementação da exploração de notas da [especificação #35](https://github.com/LucianoAMagalhaes/song-pad/issues/35), limitada ao [ticket #36](https://github.com/LucianoAMagalhaes/song-pad/issues/36). Verificação em 2026-11-01.

## Comportamento e fronteiras

- `/theory` é uma rota estática, dentro dos AuthProvider/AuthGuard existentes. Músicas e Setlists ligam a Teoria; Teoria permite regressar a ambas.
- `getNoteMap` em `src/lib/theory.ts` devolve as 150 posições das seis cordas, das soltas à casa 24. Distingue posição, classe de altura e altura concreta, conserva letra/alteração e calcula o registo a partir da grafia. Não importa React, browser, Firebase ou o transpositor do songbook.
- A exploração começa em Notas, C e nomes. O selector inclui naturais e as duas grafias usuais das teclas pretas. A selecção mostra altura com registo, corda, casa, equivalências enarmónicas e outras posições da mesma altura.
- Referências têm nome e símbolo R; a selecção tem contorno e estado acessível. Tab entra na posição seleccionada; setas percorrem cordas/casas; Home/End alcançam casas 0/24. Os extremos limitam a navegação ao braço.
- Intervalos, escalas e persistência de preferências pertencem aos tickets seguintes. As selecções deste incremento ficam em memória.

## Testes automatizados

Fronteiras aprovadas em #35: API pública do núcleo e interacção com a interface usando o núcleo real. Os testes de acesso simulam apenas autenticação, router e fontes de dados externas.

```sh
npx vitest run src/__tests__/theory.test.ts
npx vitest run src/__tests__/Theory.test.tsx
npx vitest run src/__tests__/theoryAccess.test.tsx
npm run type-check
npm run lint
npm test
npm run build
```

Casos verificados:

- Afinação E4/B3/G3/D3/A2/E2, casas 0/12/24, extensão E2–E6 e exactamente 150 posições únicas entre os limites.
- A2 na 5.ª solta e 6.ª casa 5; E2/E3 na 6.ª casas 0/12; B3 na 2.ª solta e 3.ª casa 4.
- C#4/Db4 conservam grafia, altura e classe; Cb4/B3 conservam a mesma altura com registos escritos diferentes.
- Mudança de referência, selecção por clique, equivalências enarmónicas, mostrar outras notas e teclado até aos extremos.
- Acessos nos dois cabeçalhos, retorno à biblioteca e acesso directo protegido durante carregamento e sem sessão.

O build com webpack gerou `out/theory.html` como rota estática. A obtenção das fontes Geist exigiu rede. O núcleo e a interface não exigiram dependências novas.

Resultado: TypeScript e ESLint passaram; a suite completa passou com 88 testes em 14 ficheiros, incluindo os testes existentes de transposição e parser. O teste de isolamento do núcleo confirmou que alterar uma grafia devolvida ou uma escolha pública não afecta mapas posteriores nem a referência fornecida pelo chamador.

## Browser e referência visual

Chromium headless, a servir o export de produção por HTTP local. O caso anónimo utilizou os providers reais e confirmou o redireccionamento de `/theory` para `/login`. Para explorar a interface, foi usada uma conta sintética na persistência/resposta do SDK Firebase Auth; providers, guard, página e cálculos permaneceram reais. Esta verificação não representa um login Google real.

| Ecrã       | Viewport  | Overflow da página | Braço inteiro sem scroll | Largura mínima de toque |
| ---------- | --------- | ------------------ | ------------------------ | ----------------------- |
| Desktop    | 1440×1000 | Nenhum             | Sim                      | 44,33 px                |
| Tablet     | 820×1180  | Nenhum             | Scroll horizontal        | 44,09 px                |
| Smartphone | 390×844   | Nenhum             | Scroll horizontal        | 44,09 px                |
| Estreito   | 320×800   | Nenhum             | Scroll horizontal        | 44,09 px                |

Em cada tamanho: acesso HTTP 200, referência C inicial, 150 posições, toque em ambas as posições de A2 e teclado para casas 0/12/24. Também foram confirmadas a mudança C#→Db na mesma posição e a ausência de pedidos Firestore durante a exploração. Nenhum erro JavaScript foi observado com o Service Worker activo.

Depois do carregamento, desligar a rede permitiu continuar a escolher referências e posições e a navegar por teclado. A verificação de arranque/recarregamento offline da PWA pertence ao ticket #40.

Capturas inspeccionadas contra a alternativa A aprovada: superfícies escuras, destaques verdes, trastes cinzentos visíveis e selecção com contorno. Para reproduzir manualmente, servir `out/` com URLs limpos, entrar na app e abrir `/theory`; repetir as interacções acima nas quatro larguras.

- [Desktop](theory-notes/desktop.png)
- [Tablet](theory-notes/tablet.png)
- [Smartphone](theory-notes/mobile.png)

## Revisão

Revisão em paralelo com ponto inicial `213b8c7` (antes da implementação):

- **Standards:** nenhuma violação documentada ou smell relevante pendente. O revisor identificou partilha de objectos mutáveis nas grafias; as cópias independentes e o teste de regressão resolveram a preocupação, com confirmação do revisor.
- **Spec:** nenhum requisito do #36 em falta, comportamento incorrecto ou funcionalidade fora do âmbito identificado.

Resultado final: 0 achados pendentes em Standards; 0 em Spec.
