# Teoria — validação de Escalas (#38)

Implementação do [ticket #38](https://github.com/LucianoAMagalhaes/song-pad/issues/38), segundo a [especificação #35](https://github.com/LucianoAMagalhaes/song-pad/issues/35). Branch `feat/theory-scales`, criada a partir de `3d9086d`. Verificação em 2026-11-01.

## Comportamento e fronteiras

- Escalas integra-se com Notas e Intervalos no braço contínuo de 150 posições, das cordas soltas à casa 24. A selecção mantém corda/casa quando muda o modo, a tónica, a família ou a leitura.
- `getScaleMap` constrói maior, menor natural, pentatónica maior e pentatónica menor. O selector conserva as escolhas enarmónicas existentes, cobrindo as doze classes de tónica. Não há novas famílias ou caixas/CAGED.
- O núcleo usa a mesma grafia contextual e descrição de intervalos que o modo Intervalos. Conserva E#/B# em C# maior, alterações duplas em D# maior e o registo escrito de B#3/C4.
- Nomes são a leitura inicial. Notas/Graus altera os rótulos e a fórmula apresentada, preservando a escala e a posição. As pentatónicas mantêm os graus relativos: G é 5 em C pentatónica maior; Eb é b3 em C pentatónica menor.
- A tónica usa verde vivo e T; as restantes notas da escala têm círculo com contorno, verde escuro e grau. A selecção mantém o contorno próprio. Os nomes acessíveis incluem tónica/grau ou indicação de nota fora da escala, em ambas as leituras.
- Os detalhes mostram nota com registo, corda/casa, grau e intervalo simples da fórmula. Notas exteriores apresentam essa condição e não conservam grau/intervalo da escala anterior. O intervalo da fórmula repete-se entre oitavas; direcção e distância real continuam na comparação entre posições do modo Intervalos.
- O núcleo continua independente de React, browser, Firebase e armazenamento. Preferências e arranque/recarregamento offline pertencem aos incrementos seguintes. Não houve deploy nesta sessão.

## Testes automatizados

Fronteiras aprovadas em #35: API pública do núcleo e interface de Teoria com cálculos reais. TDD iniciou os testes públicos de escala com C maior e os fluxos de interface com o novo modo ausente; ambos falharam antes da implementação. Os restantes casos conhecidos e invariantes ampliam essa validação.

- `src/__tests__/theoryScales.test.ts`: quatro conjuntos explícitos em C; graus e intervalos; todas as quatro famílias nas 17 grafias usuais do selector, cobrindo as doze classes; contagens de sete/cinco classes; pertença e tónica nas 150 posições; repetição de G/Eb em oitavas; C# versus Db maior, E#/B# e alterações duplas.
- `src/__tests__/TheoryScales.test.tsx`: leitura inicial, alternância Notas/Graus, mudanças de família/tónica e pertença, registos e detalhes, preservação da posição entre modos, operação dos controlos por teclado e percurso até às casas 0/24. Sem mocks do núcleo.
- Os testes existentes de Notas, Intervalos, acesso, músicas, setlists, cifras e transposição continuam a passar.

Resultado: **192 testes passaram em 16 ficheiros**. `npm run type-check`, `npm run lint`, Prettier, `git diff --check` e `npm run build` passaram. O build usa webpack/Serwist e mantém `/theory` estática.

## Browser e referência visual

Chromium headless sobre o export de produção servido por HTTP local. O acesso anónimo usa providers reais e redirecciona `/theory` para `/login`. A exploração usa uma conta sintética na fronteira do SDK Firebase Auth, com providers, AuthGuard, página e núcleo reais; não representa um login Google real.

Em todas as larguras, foram verificados os quatro conjuntos em C, troca Notas/Graus, graus b3/5 entre oitavas, mudança de tónica, E#/B# e mudança para Db sem perder a posição, navegação por teclado e retorno a Notas/Intervalos. As capturas foram inspeccionadas: superfícies escuras, destaques verdes, trastes cinzentos, tónica identificada por T e selecção com contorno.

| Ecrã       | Viewport  | Overflow da página | Braço inteiro sem scroll | Largura mínima de toque |
| ---------- | --------- | ------------------ | ------------------------ | ----------------------- |
| Desktop    | 1440×1000 | Nenhum             | Sim                      | 44,33 px                |
| Tablet     | 820×1180  | Nenhum             | Scroll horizontal        | 44,09 px                |
| Smartphone | 390×844   | Nenhum             | Scroll horizontal        | 44,09 px                |
| Estreito   | 320×800   | Nenhum             | Scroll horizontal        | 44,09 px                |

Nenhum erro JavaScript nem pedido Firestore durante a exploração. Depois de desligar a rede, foi possível escolher D# maior e inspeccionar F##4. Isto verifica cálculos locais após carga; arranque/recarregamento offline da PWA permanece no ticket #40.

Para reproduzir: gerar o export com `npm run build`, servir `out/` com URLs limpos, autenticar e abrir `/theory`; repetir os fluxos e larguras acima. A validação desta sessão usou `/tmp/songpad-theory-scales-check.cjs` e `/tmp/songpad-theory-production-server.py`.

- [Desktop — notas](theory-scales/desktop.png)
- [Tablet — graus](theory-scales/tablet.png)
- [Smartphone — graus](theory-scales/mobile.png)

## Revisão

Revisão Standards/Spec em dois agentes independentes contra o ponto inicial `3d9086d`, com o ticket #38 e os critérios transversais de #35.

### Standards

Nenhuma violação documentada nem smell accionável. Regras de língua, vocabulário e separação entre núcleo puro e interface respeitados. `spellInterval` partilha a grafia contextual entre Intervalos e Escalas; testes nas fronteiras públicas aprovadas e documentação de validação presentes.

### Spec

Nenhum requisito ausente/parcial, comportamento incorrecto ou funcionalidade fora do âmbito identificado. As quatro famílias nas doze classes, graus pentatónicos, grafia contextual, intervalos simples e preservação da posição estão implementados. Preferências e recarregamento offline permanecem nos tickets seguintes.

Resultado final: **0 achados pendentes em Standards; 0 em Spec**.
