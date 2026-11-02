# Teoria — Modos Gregos

Especificação aprovada em 2026-11-02. O utilizador confirmou as respostas Q1–Q9 e os detalhes de concretização no fecho da entrevista.

## Decisões confirmadas

- Consultar as escalas dos modos gregos no braço.
- Explorar modos com a mesma tónica e comparar as suas notas e estruturas.
- Explorar a relação entre modos que partilham as mesmas notas, distinguindo os seus centros musicais.
- Incluir os sete modos diatónicos modernos: Jónio, Dórico, Frígio, Lídio, Mixolídio, Eólio e Lócrio, em todas as tónicas disponíveis.
- Criar uma área própria «Modos Gregos», ao lado de Notas, Intervalos e Escalas. A escolha privilegia uma experiência dedicada à exploração modal e às comparações.
- Na consulta de cada modo, apresentar o braço com leitura Notas/Graus, a sequência ordenada das notas e a fórmula em graus, com destaque da tónica.
- Usar um quadro comparativo e um único braço: seleccionar uma linha do quadro actualiza o modo mostrado no braço. O quadro apresenta notas, graus e diferenças entre modos.
- Manter a exploração visual, com explicações curtas das relações. Não incluir reprodução sonora neste incremento.
- Disponibilizar as vistas «Mesma tónica» e «Mesmas notas», mantendo o modo musical e a sua tónica ao alternar entre elas.
- Na vista «Mesma tónica», permitir escolher o modo de referência para destacar diferenças; começar com Jónio. A resposta «Sim» à Q8 foi interpretada como aceitação da opção B recomendada.
- Recordar a última exploração por utilizador neste dispositivo: modo musical, tónica, leitura e vista de comparação. A posição seleccionada no braço é temporária.

## Contexto existente

- A [especificação inicial de Teoria #35](https://github.com/LucianoAMagalhaes/song-pad/issues/35) excluiu modos gregos. Este pedido abre uma extensão desse âmbito.
- A exploração de Escalas já oferece tónica, família, leitura Notas/Graus e um mapa contínuo das casas 0–24.
- O glossário distingue tónica, grau, escala e mapa de notas.

## Comportamento das comparações

### Mesma tónica

O quadro apresenta os sete modos com a tónica escolhida. Seleccionar uma linha mantém a tónica e actualiza o modo musical, as notas, a fórmula e o braço.

A referência é outro modo com a mesma tónica. Por exemplo, comparar Ré dórico com Ré eólio revela a diferença no sexto grau: B/6 no Dórico e B♭/♭6 no Eólio.

### Mesmas notas

O quadro apresenta os sete modos relativos ao modo seleccionado. Por exemplo, Ré dórico pertence ao mesmo conjunto de notas de Dó jónio. Seleccionar Mi frígio conserva esse conjunto e muda a tónica para Mi.

As posições pertencentes à escala mantêm-se, mas o destaque da tónica e os graus são recalculados relativamente ao modo seleccionado. Ré é 1 em Ré dórico; Mi é 1 em Mi frígio.

### Alternar entre vistas

Alternar de vista conserva a escala seleccionada. Se a selecção for Ré dórico, «Mesma tónica» apresenta os modos em Ré e «Mesmas notas» apresenta os modos do conjunto de Dó maior. Depois de seleccionar Mi frígio, voltar a «Mesma tónica» apresenta os modos em Mi.

## Detalhes de concretização aprovados

- Identificar as equivalências como «Jónio (maior)» e «Eólio (menor natural)». As famílias Maior e Menor natural continuam disponíveis na área Escalas.
- Ao abrir Modos Gregos pela primeira vez, começar em Dó jónio, leitura Notas, vista «Mesma tónica» e referência Jónio.
- Guardar as escolhas de Modos Gregos separadamente das escolhas da área Escalas, para que explorar modos não substitua a última escala consultada. Guardar também o modo de referência escolhido.
- Apresentar o selector de referência apenas em «Mesma tónica». Mudar a referência actualiza as diferenças do quadro sem alterar o modo em estudo. Em «Mesmas notas», explicar a mudança de centro musical e de graus.
- Destacar diferenças por grau relativamente à referência, acompanhadas dos nomes das notas. Não depender apenas de cores para transmitir a comparação.
- Reutilizar a cobertura das casas 0–24, afinação, grafia contextual, detalhes da posição, interacção por toque/teclado e comportamento responsivo existentes.
- Manter funcionamento offline após obtenção dos recursos e compatibilidade com preferências já guardadas. Falhas de armazenamento permitem continuar a exploração durante a sessão.
- Manter o incremento centrado em consulta e comparação visual. Exercícios, áudio, harmonização, dedilhados/CAGED e integração com músicas ficam fora desta proposta.

## Cenários de aceitação

1. Seleccionar Ré dórico mostra D E F G A B C e a fórmula 1 2 ♭3 4 5 6 ♭7, com Ré como tónica no braço.
2. Em «Mesma tónica», seleccionar Ré frígio mantém Ré e actualiza a escala para D E♭ F G A B♭ C.
3. Comparar Ré dórico com Ré eólio evidencia B/6 contra B♭/♭6; mudar apenas a referência mantém Ré dórico seleccionado.
4. Em «Mesmas notas», passar de Ré dórico para Mi frígio mantém D E F G A B C como conjunto e passa a destacar Mi como tónica, com os graus próprios de Mi frígio.
5. Alternar de vista mantém o modo e a tónica seleccionados e recalcula as linhas do quadro.
6. Jónio e Eólio produzem as mesmas escalas que Maior e Menor natural, respectivamente, para a mesma tónica.
7. Reabrir a área restaura as escolhas persistentes da conta neste dispositivo, sem restaurar a posição tocada e sem substituir as escolhas de Escalas.
8. Preferências anteriores continuam utilizáveis; outra conta não recebe as escolhas do utilizador anterior.
9. As duas vistas e os sete modos continuam consultáveis sem rede após a preparação offline habitual, em desktop, tablet e smartphone.

## Referência musical

O [Open Music Theory — Diatonic Modes](https://viva.pressbooks.pub/openmusictheorycopy/chapter/diatonic-modes/) distingue modos paralelos (mesma tónica) e relativos (mesmas notas, tónicas diferentes). Estes termos ficam registados no glossário para os dois objectivos de comparação acordados.

«Modos Gregos» designa neste incremento os sete modos diatónicos modernos, transponíveis para qualquer tónica, descritos em [Open Music Theory — Collections and Scales](https://openmusictheory.github.io/scales2).

As fórmulas abaixo correspondem aos graus relativos à própria tónica de cada modo:

| Modo      | Fórmula            |
| --------- | ------------------ |
| Jónio     | 1 2 3 4 5 6 7      |
| Dórico    | 1 2 ♭3 4 5 6 ♭7    |
| Frígio    | 1 ♭2 ♭3 4 5 ♭6 ♭7  |
| Lídio     | 1 2 3 ♯4 5 6 7     |
| Mixolídio | 1 2 3 4 5 6 ♭7     |
| Eólio     | 1 2 ♭3 4 5 ♭6 ♭7   |
| Lócrio    | 1 ♭2 ♭3 4 ♭5 ♭6 ♭7 |

O [material de Paul Schmeling/Berklee](https://online.berklee.edu/takenote/music-modes-major-and-minor/) confirma as equivalências escalares Jónio/maior e Eólio/menor natural. As explicações devem distinguir um novo centro musical de simplesmente começar a tocar noutra nota.

## Implementação e validação

A implementação foi integrada pelo [PR #45](https://github.com/LucianoAMagalhaes/song-pad/pull/45), a partir da branch `feat/theory-greek-modes`, criada de `main` (`bdf317f`). O núcleo musical partilha a grafia e a construção do mapa com Escalas; as preferências modais são independentes das famílias existentes. A publicação no Hosting foi autorizada e realizada em 2026-11-02.

Resultados e instruções de reprodução ficam em [validação de Modos Gregos](../verification/theory-greek-modes.md).
