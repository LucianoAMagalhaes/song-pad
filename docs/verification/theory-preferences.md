# Teoria — validação de Preferências (#39)

Implementação do [ticket #39](https://github.com/LucianoAMagalhaes/song-pad/issues/39), segundo a [especificação #35](https://github.com/LucianoAMagalhaes/song-pad/issues/35). Branch `feat/theory-preferences`, criada a partir de `363b454` (`main`). Verificação em 2026-11-01.

## Comportamento e fronteiras

- `src/lib/theoryPreferences.ts` expõe leitura/gravação de modo, tónica, família e leitura Notas/Graus. Guarda JSON com `version: 1` em `songpad:theory:<uid codificado>`, preservando a grafia explícita (C# e Db continuam distintos).
- Ausência, JSON inválido, versão incompatível, campos em falta, valores desconhecidos e armazenamento bloqueado usam Notas, C, Maior e nomes de notas. Falhas de gravação, incluindo quota excedida, não interrompem a exploração em memória.
- `TheoryExplorer` usa a conta autenticada para delimitar uma sessão. O primeiro render usa defaults; um efeito lê as preferências depois da montagem. Só as alterações explícitas aos quatro campos gravam, evitando sobrescrever os dados durante a inicialização ou o Strict Mode.
- Mudar de conta reinicia a sessão e carrega a conta actual, sem mostrar nem gravar as escolhas da anterior. Sem conta, as alterações ficam apenas em memória.
- Posições, origem/alvo de comparações, intervalo escolhido, tipo de comparação e opção de mostrar outras notas continuam transitórios. Trocar modos na mesma sessão conserva o comportamento anterior; reabrir ou mudar de conta reinicia estas selecções.
- O núcleo musical não foi alterado. Não há novas colecções Firestore, sincronização cloud ou alterações ao backup de músicas/setlists. A interface visual, os nomes acessíveis e a navegação mantêm-se.

## Testes automatizados

Fronteiras aprovadas em #35/#39: interface de Teoria com núcleo real e adaptador público de armazenamento. Autenticação e armazenamento são as fronteiras externas simuladas.

- `theoryPreferences.test.ts`: guardar/recuperar, isolamento por conta, grafia, registo versionado contendo apenas os quatro campos, JSON/versões/valores inválidos, campos em falta e falhas ao aceder, ler ou escrever no armazenamento.
- `TheoryPreferences.test.tsx`: guardar/reabrir nos três modos, conservar família/leitura mesmo ao sair de Escalas, reiniciar posições transitórias, mudar entre contas com preferências distintas, conta nova e saída de sessão. Recuperação de dados inválidos e falhas de acesso/leitura/gravação mantém resultados musicais observáveis. Render no servidor não acede ao armazenamento; hidratação em Strict Mode recupera as preferências sem erros nem sobrescrita.
- Os testes existentes de Notas/Escalas passam a fornecer uma conta na fronteira de autenticação e armazenamento limpo por teste; os fluxos musicais e de teclado mantêm-se.
- TDD: o primeiro fluxo guardar/reabrir falhou antes da integração; a validação de formatos e a recuperação de falhas também falharam antes das respectivas implementações.

Resultado: **214 testes passaram em 18 ficheiros**. `npm run type-check`, `npm run lint`, Prettier, `git diff --check` e `npm run build` passaram. `/theory` continua no export estático com webpack/Serwist.

## Browser de produção

Chromium headless sobre `out/`, servido por HTTP local. Acesso anónimo redirecciona `/theory` para `/login`. A exploração usa uma conta sintética na fronteira Firebase Auth, com providers, AuthGuard, página e núcleo reais; não representa um login Google real.

Em desktop (1440×1000), tablet (820×1180) e mobile (390×844): configurar Db, Pentatónica menor e Graus; recarregar separadamente em Notas, Intervalos e Escalas; verificar os campos e o grau 5 de Ab3. Navegar pelo teclado até à casa 24 e recarregar reinicia a posição, mantendo as preferências. Sem overflow da página. Capturas inspeccionadas, mantendo a apresentação aprovada.

Dados corrompidos recuperam C/Notas; após bloquear leitura e gravação, a interface continua a mudar tónica/leitura e a mostrar E#4 correctamente. Com rede desligada depois da carga, continua a explorar D# maior e F##4. Nenhum erro JavaScript ou pedido ao Firestore durante estes fluxos. A troca de conta sem desmontar a página é coberta pelo teste de interface.

Esta verificação cobre preferências e exploração offline depois da carga. Arranque/recarregamento offline da PWA pertence ao ticket #40. Não houve deploy.

Para reproduzir: `npm run build`, servir `out/` com URLs limpos, autenticar e repetir os fluxos. Nesta sessão foram usados `/tmp/songpad-theory-preferences-check.cjs` e `/tmp/songpad-theory-production-server.py`; capturas em `/tmp/songpad-theory-preferences-validation/`.

## Revisão

Revisão em dois agentes independentes contra `363b454` (`main`), segundo #39 e os critérios transversais de #35.

### Standards

Nenhuma violação documentada nem smell accionável identificado. O adaptador mantém o armazenamento separado do núcleo musical; a sessão por `uid` concentra a recuperação e o isolamento entre contas. Código, comentários e commits seguem as regras de língua. Os testes usam as fronteiras públicas e a documentação regista a validação e os limites de offline.

### Spec

Nenhum requisito ausente, implementação incorrecta ou alargamento de âmbito identificado. A implementação guarda os quatro campos num adaptador local versionado por conta, restaura depois da montagem, preserva a grafia e recupera de dados inválidos ou armazenamento indisponível. A sessão identificada pelo utilizador impede reutilizar preferências e posições da conta anterior. O núcleo musical, o backup e o Firestore permanecem fora da persistência. Os testes cobrem reabertura nos três modos, isolamento, falhas e hidratação em Strict Mode. O agente repetiu a validação dos 22 testes de preferências, que passaram.

Resultado: **0 achados pendentes em Standards; 0 em Spec**.
