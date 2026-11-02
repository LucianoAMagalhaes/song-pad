# Teoria — validação PWA/offline (#40)

Implementação do [ticket #40](https://github.com/LucianoAMagalhaes/song-pad/issues/40), segundo a [especificação #35](https://github.com/LucianoAMagalhaes/song-pad/issues/35). Branch `feat/theory-offline`, criada a partir de `295f219` (`main`). Verificação em 2026-11-01.

## Falha reproduzida e correção

O Serwist já inclui JavaScript, CSS, fontes e ícones no precache. `cacheOnNavigation: true` obtém o HTML exportado durante a navegação e guarda-o em `pages`. Contudo, a regra HTML de `defaultCache` verifica o cabeçalho **do pedido** `Content-Type`, ausente numa navegação normal do browser. O recarregamento procurava noutra cache e falhava mesmo com `/theory` disponível em `pages`.

Antes da correção, o teste de produção confirmou a presença do documento na cache e falhou no primeiro recarregamento sem rede com `page.reload: net::ERR_FAILED`. Nenhum segundo carregamento online foi feito antes dessa tentativa, para evitar que outra cache ocultasse o problema.

`src/app/sw.ts` acrescenta uma regra para navegações da mesma origem em `/theory`, identificadas por `request.mode === "navigate"`. Usa `NetworkFirst` e `PAGES_CACHE_NAME.html`, a mesma cache preenchida pelo adaptador de navegação. Online obtém o HTML actual; sem rede recupera o documento guardado. As estratégias existentes continuam disponíveis para os restantes pedidos. O Service Worker continua a ser gerado no build, sem edição dos artefactos em `public/`.

Mantêm-se Next.js, export estático com webpack, Serwist e Firebase Hosting/Spark. Não há novo backend, alteração das regras Firestore ou dependência cloud para os cálculos. Primeiro login e primeira obtenção/cache dos recursos exigem rede; recursos ainda não guardados ou eliminados pelo browser voltam a precisar de rede.

## Teste reproduzível de produção

`scripts/verify-theory-offline.mjs`, executado por `npm run test:offline`, serve `out/` por HTTP local com URLs limpos e os rewrites existentes. Desativa a cache HTTP com `Cache-Control: no-store`. O teste exige que o recarregamento seja servido pelo Service Worker real, com `navigator.onLine === false`.

Fronteira aprovada em #35: interface de Teoria com núcleo musical real, incluindo integração de produção/offline. O teste prepara uma conta sintética na persistência IndexedDB do Firebase Auth e simula apenas a resposta externa de recuperação da conta online. AuthProvider, AuthGuard, recuperação offline da sessão, rota, interface e cálculos são reais. O teste anónimo confirma o redireccionamento para `/login`. Não representa um login Google real e não usa credenciais nem dados de produção.

Os pedidos Firestore são bloqueados no teste; a exploração inicial e os três modos offline verificam que **nenhum pedido Firestore foi sequer iniciado**. A navegação posterior às bibliotecas pode iniciar as subscrições habituais destas páginas, sem consultar dados reais. O sinalizador da migração local é preparado para a conta de teste, representando uma sessão que já concluiu a migração.

Em contextos novos e isolados para desktop (1440×1000), tablet (820×1180) e smartphone (390×844), o teste verifica:

- Primeira carga online, instalação/controlo pelo Service Worker e disponibilidade do HTML; primeiro recarregamento offline antes de qualquer segunda visita online.
- Notas: A2 na 6.ª corda/casa 5 e a mesma altura na 5.ª corda solta; recarregamento mantém A e reinicia a posição transitória.
- Intervalos: C–G, quinta justa/7 semitons; comparação C4→G4 ascendente, C4→G3 descendente/5 semitons e distância superior a uma oitava. Recarregamento mantém o modo e reinicia a comparação transitória.
- Escalas: Db pentatónica menor em Graus, Ab3 com grau 5; recarregamento recupera modo, tónica, família e leitura. Alternar Notas/Graus mantém a posição. C# maior apresenta E#4 e terça maior/4 semitons.
- Uma nova aba abre `/theory` sem rede e recupera a sessão e as preferências persistidas.
- Depois de disponibilizar online também as páginas de Músicas/Setlists, navegar sem rede de Teoria para cada biblioteca e regressar pelo link Teoria; recarregar novamente preserva o acesso e as preferências.
- 150 posições, seis cordas e cabeçalhos 0–24 no mesmo braço; ausência de overflow horizontal da página. Tablet/smartphone têm deslocamento restrito ao braço. Toque nos controlos/posições nos dois formatos menores; End e seta para baixo atingem a casa 24 da 2.ª corda por teclado. Referência/tónica, selecção e graus têm texto/símbolos além da cor.
- Ausência de erros JavaScript nos fluxos autenticados.

Resultado após a correção: **desktop, tablet e smartphone passaram**. Capturas inspeccionadas: [desktop](theory-offline/desktop.png), [tablet](theory-offline/tablet.png), [smartphone](theory-offline/mobile.png). Mostram a apresentação aprovada e a selecção por teclado na casa 24; nos formatos pequenos, o braço está deslocado para as casas agudas.

Para reproduzir num ambiente com Node.js 22 e configuração Firebase local correspondente ao build:

```bash
npm ci
npx playwright install --with-deps chromium
npm run build
npm run test:offline
```

O teste lê `.env.local` quando existe ou as variáveis do ambiente, e usa `NEXT_PUBLIC_FIREBASE_API_KEY` para preparar a sessão sintética correspondente ao build. `CHROMIUM_PATH` permite usar um Chromium já instalado; `OFFLINE_ARTIFACT_DIR` escolhe o destino das capturas (por defeito `/tmp/songpad-theory-offline`). Nesta sessão foram usadas bibliotecas Chromium extraídas em `/tmp`, sem instalação no sistema.

## Qualidade e regressão

- TDD: o mesmo teste de recarregamento de produção falhou antes da regra de navegação e passou depois.
- `npm run type-check` passou durante a implementação e após completar os fluxos do browser.
- Teste focado de `TheoryPreferences.test.tsx`: **9 testes passaram**.
- Suite completa executada no fim da implementação: **214 testes passaram em 18 ficheiros**, incluindo músicas, setlists, parser, transposição, núcleo musical, interface e preferências.
- `npm run lint`, Prettier, `git diff --check` e `npm run build` passaram. O export produz `/theory` e conserva as cascas das rotas dinâmicas existentes.

Não houve deploy nem alteração dos dados de produção.

## Standards

Revisão independente contra `295f219`: nenhuma violação documentada. Código e comentários seguem as regras de língua de `AGENTS.md`; o vocabulário respeita `GLOSSARY.md`; a alteração modifica a fonte do Service Worker e conserva a geração dos artefactos no build. A documentação regista estado, validação e próximos passos.

O agente apontou uma possível duplicação, de prioridade baixa, nos ciclos online/offline do teste de navegação. Foi resolvida extraindo a sequência para `visitLibraryAndReturn`; o agente confirmou **0 observações pendentes**. A espera pelo recarregamento automático ao recuperar rede também ficou explícita. O teste de browser voltou a passar nos três formatos depois deste ajuste.

## Spec

Revisão independente segundo #40 e os critérios transversais de #35: nenhum requisito ausente/parcial, alargamento de âmbito ou comportamento contraditório identificado. A regra usa a cache `pages` já preenchida pelo Serwist; mantém export estático, autenticação e cálculos locais. O teste e as capturas cobrem recarregamento offline, três modos, preferências, nova aba, navegação pelas bibliotecas, toque, teclado e overflow restrito ao braço. A sessão Firebase sintética está identificada e conserva AuthProvider/AuthGuard reais.

Resultado: **Standards — 0 violações, 1 sugestão de manutenção resolvida, 0 pendentes; Spec — 0 achados**. A maior observação de Standards era de prioridade baixa; nenhuma em Spec. Os agentes fizeram revisão de leitura, sem repetir a suite ou o browser.
