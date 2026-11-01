# Protótipo de interacção do módulo Teoria

Artefacto descartável para [Escolher a interacção visual para explorar notas e acordes no braço](https://github.com/LucianoAMagalhaes/song-pad/issues/29).

## Executar

Na raiz desta branch, com as dependências do projecto instaladas:

```sh
npm run prototype:theory
```

Abrir http://localhost:3100/theory/prototype?variant=A.

## Alternativas

- **A — Panorama:** braço horizontal completo, navegação por regiões e análise abaixo.
- **B — Bancada:** braço vertical por regiões, ferramentas laterais e análise dedicada; em mobile, as secções empilham.
- **C — Percurso:** exemplos comentados primeiro, exploração livre disponível a partir de cada exemplo.

A barra branca inferior alterna as versões e mantém a selecção na URL. As setas esquerda/direita também alternam quando o foco não está num controlo ou no braço. Dentro do braço, as setas percorrem posições; Tab entra na posição seleccionada.

O estado musical é partilhado entre versões para comparar a mesma exploração. O painel “Estado da exploração” mostra modo, referência/acorde e região. Recarregar repõe o estado inicial; não existe persistência.

## Casos para avaliar

1. Escolher C e localizar as suas ocorrências; seleccionar uma posição para ler o registo.
2. Comparar A2 na 5.ª corda solta e na 6.ª corda/casa 5.
3. Comparar E2 e E3 e perceber a diferença de oitava.
4. Comparar C4 com G3: quarta descendente; distinguir essa leitura da função de quinta de G num acorde de C.
5. Alternar mapa de notas e posição tocável de C; escolher C/E e identificar o baixo.
6. Mudar entre as casas 0–24 em smartphone, tablet e desktop.
7. Experimentar acordes com sétima e grafias contextuais, incluindo Cdim7.

## Limites do artefacto

- Usa o tema e a estrutura App Router do SongPad. A superfície nova e independente foi colocada em uma rota própria de protótipo.
- A rota funciona apenas em desenvolvimento, sem Firebase, autenticação ou migração local. O desvio em Providers aplica-se exclusivamente a esta rota em desenvolvimento; o restante fluxo da app conserva os providers existentes.
- O catálogo tocável contém exemplos em C para as nove famílias aprovadas e três disposições de C maior. Não contém todas as inversões de todas as famílias ou fundamentais.
- Não é uma implementação de produção nem um gerador de dedilhados. A rotina de intervalos entre posições usa nomes cromáticos de referência; a grafia tonal é demonstrada no modo de relações harmónicas e acordes.
- Não há áudio, gravação, exercícios avaliados ou integração com músicas.
- A rota devolve “não encontrado” no build de produção; a barra de variantes também é exclusiva de desenvolvimento.
- A escolha do utilizador deve ser registada no ticket antes de o encerrar. Guardar esta branch como fonte primária e implementar a solução escolhida em trabalho próprio.
