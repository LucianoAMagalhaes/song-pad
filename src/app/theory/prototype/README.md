# Protótipo de interacção do módulo Teoria

Artefacto descartável para [Escolher a interacção visual para explorar notas e acordes no braço](https://github.com/LucianoAMagalhaes/song-pad/issues/29).

## Decisão do utilizador

Alternativa **A — Panorama** escolhida e revista em 2026-11-01:

- Casas 0–24 dispostas num único braço contínuo, sem selecção de regiões. Em desktop, ajusta-se à largura disponível; em mobile, mantém deslocamento horizontal e notas legíveis.
- Removidos o bloco “Perceber com um exemplo” e o separador “Acordes”.
- O âmbito do módulo é notas, intervalos e escalas. O [conteúdo de escalas confirmado](https://github.com/LucianoAMagalhaes/song-pad/issues/32) inclui maior, menor natural e pentatónicas maior/menor em todas as tónicas, com nomes/graus; a integração virá após o planeamento. O protótipo actual cobre notas/intervalos. Acordes, inversões, arpejos e campos harmónicos estão excluídos.
- A versão escolhida não apresenta a barra de comparação entre alternativas.
- Visual aprovado: verde/preto do SongPad, com superfícies escuras, verde nos destaques e trastes cinzentos de maior contraste para separar as casas.

As três alternativas originais e as respectivas capturas estão preservadas no [snapshot inicial](https://github.com/LucianoAMagalhaes/song-pad/tree/df4819f/src/app/theory/prototype). B e C continuam acessíveis nesta branch como comparação histórica e não representam o âmbito inicial actual. O utilizador aprovou o visual revisto; a resolução está registada no ticket.

## Executar

Na raiz desta branch, com as dependências do projecto instaladas:

```sh
npm run prototype:theory
```

Abrir http://localhost:3100/theory/prototype?variant=A.

## Alternativas

- **A — Panorama:** braço horizontal contínuo com casas 0–24 e análise abaixo.
- **B — Bancada:** braço vertical por regiões, ferramentas laterais e análise dedicada; em mobile, as secções empilham.
- **C — Percurso:** exemplos comentados primeiro, exploração livre disponível a partir de cada exemplo.

A barra branca inferior de B e C alterna as versões e mantém a selecção na URL. As setas esquerda/direita também alternam quando o foco não está num controlo ou no braço. Dentro do braço, as setas percorrem posições; Tab entra na posição seleccionada. A foi simplificada após a escolha.

O estado musical é partilhado entre versões para comparar a mesma exploração. O painel “Estado da exploração” mostra modo, referência/acorde e região. Recarregar repõe o estado inicial; não existe persistência.

## Casos para avaliar

1. Escolher C e localizar as suas ocorrências; seleccionar uma posição para ler o registo.
2. Comparar A2 na 5.ª corda solta e na 6.ª corda/casa 5.
3. Comparar E2 e E3 e perceber a diferença de oitava.
4. Comparar C4 com G3: quarta descendente; distinguir essa leitura da relação entre nomes de notas sem considerar o registo.
5. Percorrer as casas 0–24 num braço contínuo em smartphone, tablet e desktop.
6. Confirmar que os controlos de região, a lista de exemplos e o menu de acordes foram removidos de A.

Os exemplos de acordes e inversões de B/C pertencem à comparação histórica. Não são requisitos da primeira entrega revista.

## Limites do artefacto

- Usa o tema e a estrutura App Router do SongPad. A superfície nova e independente foi colocada em uma rota própria de protótipo.
- A rota funciona apenas em desenvolvimento, sem Firebase, autenticação ou migração local. O desvio em Providers aplica-se exclusivamente a esta rota em desenvolvimento; o restante fluxo da app conserva os providers existentes.
- O catálogo histórico de B/C contém exemplos em C para nove famílias e três disposições de C maior. Esses dados não fazem parte da interface A escolhida.
- Não é uma implementação de produção nem um gerador de dedilhados. A rotina de intervalos entre posições usa nomes cromáticos de referência; a grafia tonal é demonstrada no modo de relações harmónicas e acordes.
- Não há áudio, gravação, exercícios avaliados ou integração com músicas.
- A rota devolve “não encontrado” no build de produção; a barra de variantes também é exclusiva de desenvolvimento.
- Guardar esta branch como fonte primária e implementar a solução escolhida em trabalho próprio.
