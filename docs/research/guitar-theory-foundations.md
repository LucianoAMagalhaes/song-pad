# Fundamentos musicais para o explorador do braço

Pesquisa de apoio ao ticket [Validar referências musicais para notas, intervalos e formação de acordes no braço](https://github.com/LucianoAMagalhaes/song-pad/issues/27), realizada em 2026-11-01. Esta nota reúne factos e limitações; não define currículo, UX ou arquitectura.

## Âmbito e pressupostos dos exemplos

O utilizador escolheu consulta e exploração visual, numa secção própria, com cifras e base comum para guitarra e violão. A prioridade é localizar notas e compreender intervalos/formação de acordes; escalas, arpejos e campos harmónicos vêm depois.

Os exemplos abaixo usam seis cordas, afinação padrão e o modelo cromático de doze semitons por oitava. Estes são pressupostos da pesquisa, não decisões de produto. Não foram investigados microtons, instrumentos sem trastes ou limites físicos de execução de todas as posições.

## Factos sustentados por fontes primárias

### Cordas, casas e notas repetidas

Na afinação padrão, as cordas soltas são E–A–D–G–B–E da mais grave para a mais aguda. A numeração convencional começa na corda aguda: a 1.ª é E e a 6.ª é E grave. A Yamaha documenta a igualdade entre a casa 5 de uma corda e a corda seguinte solta, excepto entre G e B, onde se usa a casa 4. [Yamaha: afinação](https://www.yamaha.com/en/musical_instrument_guide/acoustic_guitar/play/play002.html).

Cada casa corresponde a um semitom no modelo de afinação do braço. A descrição física simplificada da Yamaha relaciona a redução do comprimento da corda com esse incremento. [Yamaha: espaçamento das casas](https://www.yamaha.com/en/musical_instrument_guide/acoustic_guitar/trivia/trivia005.html).

Consequências calculadas dessas regras:

- A 6.ª corda na casa 5 e a 5.ª corda solta produzem o mesmo A no mesmo registo.
- Os intervalos entre cordas soltas consecutivas, da grave para a aguda, são 5, 5, 5, 4 e 5 semitons. Um desenho transposto entre pares de cordas precisa de considerar a excepção G–B.
- Subir doze casas mantém a classe de altura e sobe uma oitava; isso não significa manter a altura exacta.

Uma classe de altura, como C, reúne registos diferentes; para identificar uma altura específica é necessário também o registo, como C4. Assim, nome de nota, altura exacta e posição no instrumento não são conceitos intercambiáveis. [Open Music Theory: alturas e oitavas](https://openmusictheory.github.io/pitches.html).

### Intervalos e grafia enarmónica

Contar semitons dá a distância cromática. Nomear um intervalo tonal exige também contar letras: C–E é uma terceira; C–F é uma quarta. A qualidade resulta da combinação de ambos os dados. Por isso, quatro semitons podem representar uma terceira maior ou uma quarta diminuta. [Open Music Theory: intervalos](https://openmusictheory.github.io/intervals.html).

Exemplos calculados a partir dessa classificação:

| Notas ascendentes | Semitons | Intervalo        |
| ----------------- | -------: | ---------------- |
| C–E               |        4 | Terceira maior   |
| C–F♭              |        4 | Quarta diminuta  |
| C–F♯              |        6 | Quarta aumentada |
| C–G♭              |        6 | Quinta diminuta  |

F♯ e G♭ podem representar a mesma altura no sistema considerado, mas a grafia preserva relações musicais diferentes. C♯/D♭, E♯/F e C♭/B são outros casos de equivalência enarmónica. Acidentes duplos também existem; uma lista de doze nomes preferenciais não cobre todas as grafias válidas. [Open Music Theory: semitons e acidentes](https://viva.pressbooks.pub/openmusictheory/chapter/half-and-whole-steps/).

Inferência para a discussão futura: uma distância módulo 12 pode destacar posições sonoramente equivalentes, mas, isoladamente, não explica o nome completo de um intervalo, a sua direcção nem a diferença entre uníssono e oitava.

### Tríades, fundamental e inversão

Uma tríade reúne fundamental, terceira e quinta. As quatro qualidades básicas diferem nos intervalos acima da fundamental. [Open Music Theory: tríades](https://openmusictheory.github.io/triads.html).

| Qualidade | Intervalos acima da fundamental  | Semitons relativos | Exemplo calculado |
| --------- | -------------------------------- | ------------------ | ----------------- |
| Maior     | Terceira maior, quinta justa     | 0, 4, 7            | C–E–G             |
| Menor     | Terceira menor, quinta justa     | 0, 3, 7            | C–E♭–G            |
| Diminuta  | Terceira menor, quinta diminuta  | 0, 3, 6            | C–E♭–G♭           |
| Aumentada | Terceira maior, quinta aumentada | 0, 4, 8            | C–E–G♯            |

A nota mais grave determina a inversão: fundamental no baixo é estado fundamental; terceira no baixo é primeira inversão; quinta no baixo é segunda inversão. Repetir uma nota ou alterar o espaçamento das vozes não muda esse critério. [Open Music Theory: inversão](https://viva.pressbooks.pub/openmusictheory/chapter/inversion/).

Consequência: C/E continua a ter C como fundamental; E é o baixo. Para o classificar correctamente num desenho é preciso conhecer as alturas reais das cordas tocadas. A posição gráfica de um ponto ou a primeira nota de uma lista arbitrária não bastam.

## Verificação do código existente

Código observado em `main`, commit `925d25e151e80c4b536a3f93193cb61914407c5e`. As observações seguintes vêm de leitura directa, sem alterar módulos ou executar testes novos.

| Módulo                                                    | Capacidade verificável                                                                                                              | Limite relevante para o ensino                                                                                                                                                                                                                        |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [chordTransposer.ts](../../src/lib/chordTransposer.ts)    | Transpõe fundamental e baixo de uma cifra em semitons; conserva o sufixo; escolhe entre uma tabela de sustenidos e outra de bemóis. | Calcula módulo 12, sem registo, corda ou casa. Não calcula notas constituintes ou qualidade de intervalos. E♯, B♯, C♭ e F♭ não constam de `NOTE_TO_SEMITONE`; acidentes duplos não são suportados.                                                    |
| [chordSwap.ts](../../src/lib/chordSwap.ts)                | Separa fundamental, sufixo e baixo; oferece variações; substitui tokens literais de ChordPro.                                       | O sufixo é texto, não uma fórmula de formação. O parser não prova que um nome é musicalmente válido nem calcula as suas notas.                                                                                                                        |
| [guitarChords.ts](../../src/lib/guitarChords.ts)          | Consulta dedilhados do JSON incorporado, normaliza alguns enarmónicos, suporta aliases e tenta acordes com baixo.                   | Pode devolver uma tríade maior/menor quando não encontra a qualidade pedida. Num slash chord procura `raiz/baixo` ou `menor/baixo`, sem conservar necessariamente extensões da qualidade original. Não é um gerador de posições teoricamente exactas. |
| [ChordDiagram.tsx](../../src/components/ChordDiagram.tsx) | Desenha o primeiro dedilhado encontrado, numa janela de quatro casas e seis cordas, com dedos, pestanas e cordas soltas/abafadas.   | Não mostra todas as posições do braço, notas constituintes ou intervalos. Mantém o nome solicitado mesmo quando a consulta forneceu um fallback.                                                                                                      |

Inferência: estes módulos oferecem capacidades aproveitáveis, mas o seu comportamento actual não demonstra, por si só, a composição exacta de um acorde nem todas as relações musicais necessárias ao explorador. A decisão sobre reutilização pertence ao ticket de arquitectura.

## Casos concretos para decisões e validação posterior

Os casos seguintes são propostas de verificação derivadas dos factos acima, não critérios de aceitação já aprovados:

1. Reconhecer A na 6.ª corda/casa 5 e na 5.ª corda solta como mesma altura em posições diferentes.
2. Distinguir uma nota na corda solta da sua oitava na casa 12.
3. Explicar a mudança de desenho ao atravessar o par G–B.
4. Distinguir C–F♯ de C–G♭ quando a pergunta é o nome do intervalo, apesar da mesma distância cromática.
5. Construir C maior e C menor mudando a terceira, sem confundir notas duplicadas com novas componentes da tríade.
6. Identificar C/E pela nota mais grave, mantendo C como fundamental.
7. Distinguir ausência de dedilhado exacto de existência de uma aproximação devolvida pelo catálogo.

## Escolhas que continuam em aberto

- Número de cordas, afinações, extensão do braço e orientação da representação.
- Quais intervalos, qualidades de acordes e inversões entram na primeira entrega.
- Quando mostrar sustenidos, bemóis, enarmónicos e registo; como traduzir símbolos musicais para a notação textual da app.
- Como tratar grafias não suportadas pelos módulos actuais e dedilhados aproximados.
- Interacções, exemplos guiados, acessibilidade, persistência e eventual integração com músicas.

## Limitações da pesquisa

Foram consultadas fontes dos próprios autores de Open Music Theory e do fabricante Yamaha. Alguns capítulos da edição Pressbooks devolveram HTTP 403; para intervalos e tríades foi usada a edição pública anterior dos mesmos autores, identificada pelos URLs acima. A página Yamaha sobre casas tem uma frase de direcção espacial ambígua; só foi usada a relação entre casa, comprimento e semitom, cruzada com os exemplos de afinação.

Não foram copiados diagramas ou exercícios dessas fontes, nem escolhidas dependências. A pesquisa não substitui a validação pedagógica pelo utilizador e não garante executabilidade física de qualquer conjunto de notas destacado.
