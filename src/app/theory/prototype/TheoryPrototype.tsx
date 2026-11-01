"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PrototypeSwitcher } from "@/components/ui/PrototypeSwitcher";
import {
  FREE_NAMES,
  INTERVALS,
  MODE_NAMES,
  OPEN_MIDI,
  QUALITIES,
  ROOTS,
  SHAPES,
  SHARPS,
  comparePositions,
  midiAt,
  pitchClass,
  pitchName,
  samePosition,
  spellInterval,
  type Mode,
  type Position,
} from "./prototypeData";
import styles from "./prototype.module.css";

/** Throwaway state shared only so the three layouts can show the same exploration. */
function useLab(notesAndIntervalsOnly = false) {
  const [storedMode, setMode] = useState<Mode>("notes");
  const mode = notesAndIntervalsOnly && storedMode === "chords" ? "notes" : storedMode;
  const [root, setRoot] = useState("C");
  const [qualityIndex, setQualityIndex] = useState(0);
  const [intervalIndex, setIntervalIndex] = useState(8);
  const [reading, setReading] = useState<"harmony" | "positions">("harmony");
  const [view, setView] = useState<"map" | "shape">("map");
  const [shapeIndex, setShapeIndex] = useState(0);
  const [selected, setSelected] = useState<Position>({ string: 2, fret: 1 });
  const [reference, setReference] = useState<Position>({ string: 2, fret: 1 });
  const [choosingReference, setChoosingReference] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [region, setRegion] = useState(0);
  const [example, setExample] = useState(0);
  const quality = QUALITIES[qualityIndex];
  const interval = INTERVALS[intervalIndex];
  const tones = quality.offsets.map((offset, i) => ({
    pc: (pitchClass(root) + offset) % 12,
    name: spellInterval(root, offset, [0, 2, 4, 6][i]),
    role: quality.roles[i],
  }));
  const shapes = root === "C" ? SHAPES[quality.suffix] : [];
  const shape = shapes[shapeIndex] ?? shapes[0];
  const sounding =
    shape?.frets.flatMap((fret, i) => (fret < 0 ? [] : [OPEN_MIDI[5 - i] + fret])) ?? [];
  const bass = sounding.length ? Math.min(...sounding) : null;
  const comparison = comparePositions(reference, selected);
  const isComparing = mode === "intervals" && reading === "positions";
  const isShape = mode === "chords" && view === "shape";

  function choose(position: Position) {
    if (choosingReference) {
      setReference(position);
      setChoosingReference(false);
    } else {
      setSelected(position);
      if (mode === "notes") setRoot(SHARPS[midiAt(position) % 12]);
    }
  }

  function applyExample(index: number) {
    setExample(index);
    setChoosingReference(false);
    setView("map");
    setQualityIndex(0);
    setShapeIndex(0);
    setRegion(index === 2 ? 12 : 0);
    if (index === 0) {
      setMode("notes");
      setRoot("C");
      setSelected({ string: 2, fret: 1 });
    } else if (index === 1) {
      setMode("intervals");
      setReading("positions");
      setRoot("A");
      setReference({ string: 5, fret: 0 });
      setSelected({ string: 6, fret: 5 });
    } else if (index === 2) {
      setMode("intervals");
      setReading("positions");
      setRoot("E");
      setReference({ string: 6, fret: 0 });
      setSelected({ string: 6, fret: 12 });
    } else if (index === 3) {
      setMode("intervals");
      setReading("positions");
      setRoot("C");
      setReference({ string: 2, fret: 1 });
      setSelected({ string: 3, fret: 0 });
    } else {
      setMode("chords");
      setRoot("C");
      setView("shape");
      setShapeIndex(1);
      setSelected({ string: 6, fret: 0 });
    }
  }

  function cell(position: Position) {
    const midi = midiAt(position);
    const pc = midi % 12;
    const tone = tones.find((t) => t.pc === pc);
    const intervalPc = (pitchClass(root) + interval.semitones) % 12;
    const isReference = isComparing && samePosition(reference, position);
    const isSelected = samePosition(selected, position);
    let active = pc === pitchClass(root);
    let name = FREE_NAMES[pc];
    let role = active ? "1" : "";
    if (mode === "chords") {
      active = isShape ? !!shape && shape.frets[6 - position.string] === position.fret : !!tone;
      name = tone?.name ?? SHARPS[pc];
      role = tone?.role ?? "";
    } else if (mode === "intervals" && reading === "harmony") {
      active = pc === pitchClass(root) || pc === intervalPc;
      if (pc === intervalPc) {
        name = spellInterval(root, interval.semitones, interval.degree);
        role = interval.short;
      } else if (active) {
        name = root;
      }
    } else if (isComparing) {
      active = isReference || isSelected;
      name = SHARPS[pc];
      role = isReference ? "Ref" : isSelected ? "Alvo" : "";
    }
    return {
      midi,
      pc,
      name,
      role,
      active,
      isReference,
      isSelected,
      isRoot: active && (isComparing ? isReference : pc === pitchClass(root)),
    };
  }
  const selectedCell = cell(selected);
  return {
    mode,
    setMode,
    root,
    setRoot,
    qualityIndex,
    setQualityIndex,
    quality,
    intervalIndex,
    setIntervalIndex,
    interval,
    reading,
    setReading,
    view,
    setView,
    shapeIndex,
    setShapeIndex,
    shapes,
    shape,
    bass,
    tones,
    selected,
    reference,
    choosingReference,
    setChoosingReference,
    showAll,
    setShowAll,
    region,
    setRegion,
    example,
    applyExample,
    choose,
    cell,
    selectedCell,
    comparison,
    isComparing,
    isShape,
  };
}
type Lab = ReturnType<typeof useLab>;
type LabProps = { lab: Lab };

const EXAMPLES = [
  {
    title: "Encontrar C",
    text: "O mesmo nome aparece em várias regiões. Toca numa posição para descobrir o registo.",
  },
  {
    title: "Duas posições, o mesmo A",
    text: "A 5.ª corda solta e a casa 5 da 6.ª corda produzem A2. Mudou a posição, a altura é a mesma.",
  },
  {
    title: "Uma nota, outra oitava",
    text: "Entre a corda solta e a casa 12 há 12 semitons. E2 e E3 partilham o nome, mas estão em oitavas diferentes.",
  },
  {
    title: "O G que está abaixo",
    text: "De C4 para G3 descemos uma quarta justa. Na formação de C maior, G continua a ter função de quinta.",
  },
  {
    title: "Mesmas notas, outro baixo",
    text: "C/E contém C, E e G. A fundamental continua a ser C; o baixo E determina a primeira inversão.",
  },
];

export function TheoryPrototype() {
  const searchParams = useSearchParams();
  const rawVariant = searchParams.get("variant");
  const variant = rawVariant === "B" || rawVariant === "C" ? rawVariant : "A";
  const lab = useLab(variant === "A");
  return (
    <div className={styles.prototype}>
      <div className={styles.prototypeNotice}>
        PROTÓTIPO DE INTERACÇÃO{" "}
        <span>
          {variant === "A"
            ? "A revista · notas e intervalos"
            : "Alternativa original para comparação"}
        </span>
      </div>
      <header className={styles.appHeader}>
        <Link href="/songs" className={styles.wordmark} prefetch={false}>
          <span aria-hidden="true">♫</span> SongPad
        </Link>
        <nav aria-label="Navegação principal">
          <Link href="/songs" prefetch={false}>
            Músicas
          </Link>
          <Link href="/setlists" prefetch={false}>
            Setlists
          </Link>
          <span aria-current="page">Teoria</span>
        </nav>
        <span className={styles.instrument}>6 cordas · E A D G B E</span>
      </header>
      {variant === "A" ? (
        <VariantA lab={lab} />
      ) : variant === "B" ? (
        <VariantB lab={lab} />
      ) : (
        <VariantC lab={lab} />
      )}
      {variant !== "A" && <PrototypeSwitcher variant={variant} />}
    </div>
  );
}

export function VariantA({ lab }: LabProps) {
  return (
    <main className={styles.panorama}>
      <div className={styles.pageTitle}>
        <div>
          <p className={styles.eyebrow}>TEORIA / EXPLORAR</p>
          <h1>O braço, por inteiro.</h1>
          <p>Encontra uma nota. Descobre as relações à sua volta.</p>
        </div>
        <span className={styles.headerMark} aria-hidden="true">
          0—24
        </span>
      </div>
      <Controls lab={lab} includeChords={false} />
      <section className={styles.boardCard} aria-label="Explorador panorâmico">
        <BoardHeading lab={lab} />
        <Fretboard lab={lab} continuous />
        <Legend lab={lab} />
      </section>
      <div className={styles.selectedDetails}>
        <Inspector lab={lab} />
      </div>
      <p className={styles.footerHint}>
        Casas 0–24 num braço contínuo. Em ecrãs pequenos, desliza na horizontal.
      </p>
    </main>
  );
}

export function VariantB({ lab }: LabProps) {
  return (
    <main className={styles.workbench}>
      <aside className={styles.workbenchTools}>
        <p className={styles.eyebrow}>A TUA BANCADA</p>
        <h1>Teoria</h1>
        <p>
          Uma região de cada vez.
          <br />
          Uma relação de cada vez.
        </p>
        <Controls lab={lab} />
        <div className={styles.sidebarExample}>
          <ExamplePanel lab={lab} />
        </div>
      </aside>
      <section className={styles.verticalCard} aria-label="Braço vertical por regiões">
        <BoardHeading lab={lab} />
        <RegionNav lab={lab} />
        <Fretboard lab={lab} vertical />
        <Legend lab={lab} />
      </section>
      <aside className={styles.analysisColumn}>
        <p className={styles.eyebrow}>LER O QUE ESTÁS A VER</p>
        <Inspector lab={lab} />
      </aside>
    </main>
  );
}

export function VariantC({ lab }: LabProps) {
  const example = EXAMPLES[lab.example];
  return (
    <main className={styles.journey}>
      <p className={styles.eyebrow}>TEORIA / EXEMPLOS COMENTADOS</p>
      <div className={styles.journeyTitle}>
        <span className={styles.exampleNumber}>{String(lab.example + 1).padStart(2, "0")}</span>
        <div>
          <h1>{example.title}</h1>
          <p>Experimenta uma ideia no braço.</p>
        </div>
      </div>
      <nav className={styles.storyTabs} aria-label="Escolher exemplo">
        {EXAMPLES.map((item, i) => (
          <button
            key={item.title}
            type="button"
            aria-pressed={lab.example === i}
            onClick={() => lab.applyExample(i)}
          >
            <span>{i + 1}</span>
            {item.title}
          </button>
        ))}
      </nav>
      <section className={styles.storyStage}>
        <div className={styles.storyPrompt}>
          <span aria-hidden="true">↳</span>
          <p>{example.text}</p>
        </div>
        <BoardHeading lab={lab} />
        <RegionNav lab={lab} />
        <Fretboard lab={lab} compact />
        <Legend lab={lab} />
      </section>
      <div className={styles.journeyDetails}>
        <Inspector lab={lab} />
        <div className={styles.freePlay}>
          <p className={styles.eyebrow}>SEGUE A TUA CURIOSIDADE</p>
          <h2>E se mudarmos a referência?</h2>
          <p>O exemplo é um ponto de partida. Podes continuar a explorar livremente.</p>
          <details>
            <summary>Abrir os controlos de exploração</summary>
            <Controls lab={lab} />
          </details>
          <button
            type="button"
            className={styles.nextExample}
            onClick={() => lab.applyExample((lab.example + 1) % EXAMPLES.length)}
          >
            Próximo exemplo <span>→</span>
          </button>
        </div>
      </div>
    </main>
  );
}

function Controls({ lab, includeChords = true }: LabProps & { includeChords?: boolean }) {
  return (
    <section className={styles.controls} aria-label="Controlos de exploração">
      <div className={styles.modeTabs} role="group" aria-label="Modo de exploração">
        {(
          (includeChords ? ["notes", "intervals", "chords"] : ["notes", "intervals"]) as Mode[]
        ).map((mode, i) => (
          <button
            key={mode}
            type="button"
            aria-pressed={lab.mode === mode}
            onClick={() => {
              lab.setMode(mode);
              lab.setChoosingReference(false);
            }}
          >
            <span aria-hidden="true">{["●", "↔", "≋"][i]}</span>
            {MODE_NAMES[mode]}
          </button>
        ))}
      </div>
      <div className={styles.controlFields}>
        {!lab.isComparing && (
          <label>
            {lab.mode === "chords" ? "Fundamental" : "Nota de referência"}
            <select
              value={lab.root}
              onChange={(event) => {
                lab.setRoot(event.target.value);
                lab.setShapeIndex(0);
              }}
            >
              {ROOTS.map((root) => (
                <option key={root}>{root}</option>
              ))}
            </select>
          </label>
        )}
        {lab.mode === "intervals" && (
          <label>
            Leitura
            <select
              value={lab.reading}
              onChange={(event) => {
                lab.setReading(event.target.value as "harmony" | "positions");
                lab.setChoosingReference(false);
              }}
            >
              <option value="harmony">Relação harmónica</option>
              <option value="positions">Comparar posições</option>
            </select>
          </label>
        )}
        {lab.mode === "intervals" && lab.reading === "harmony" && (
          <label>
            Intervalo
            <select
              value={lab.intervalIndex}
              onChange={(event) => lab.setIntervalIndex(Number(event.target.value))}
            >
              {INTERVALS.slice(0, -1).map((item, i) => (
                <option key={item.short} value={i}>
                  {item.short} · {i === 0 ? "Referência" : item.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {lab.isComparing && (
          <button
            type="button"
            className={styles.referenceButton}
            aria-pressed={lab.choosingReference}
            onClick={() => lab.setChoosingReference(!lab.choosingReference)}
          >
            {lab.choosingReference
              ? "Toca na nova referência…"
              : "Alterar referência · " + pitchName(midiAt(lab.reference))}
          </button>
        )}
        {lab.mode === "chords" && (
          <label>
            Família
            <select
              value={lab.qualityIndex}
              onChange={(event) => {
                lab.setQualityIndex(Number(event.target.value));
                lab.setShapeIndex(0);
              }}
            >
              {QUALITIES.map((item, i) => (
                <option key={item.suffix} value={i}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {lab.mode === "chords" && (
        <div className={styles.viewToggle} role="group" aria-label="Visualização do acorde">
          <button
            type="button"
            aria-pressed={lab.view === "map"}
            onClick={() => lab.setView("map")}
          >
            Mapa de notas
          </button>
          <button
            type="button"
            aria-pressed={lab.view === "shape"}
            onClick={() => lab.setView("shape")}
          >
            Posições tocáveis
          </button>
        </div>
      )}
      {lab.isShape && lab.shapes.length > 0 && (
        <label className={styles.shapeSelect}>
          Exemplo de posição
          <select
            value={lab.shapeIndex}
            onChange={(event) => {
              lab.setShapeIndex(Number(event.target.value));
              lab.setRegion(0);
            }}
          >
            {lab.shapes.map((shape, i) => (
              <option key={shape.name} value={i}>
                {shape.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className={styles.checkbox}>
        <input
          type="checkbox"
          checked={lab.showAll}
          onChange={(event) => lab.setShowAll(event.target.checked)}
        />
        Mostrar também as outras notas
      </label>
    </section>
  );
}

function BoardHeading({ lab }: LabProps) {
  const title =
    lab.mode === "notes"
      ? "Encontra " + lab.root
      : lab.mode === "chords"
        ? lab.root + lab.quality.suffix
        : lab.isComparing
          ? "De uma posição para outra"
          : lab.root + " → " + spellInterval(lab.root, lab.interval.semitones, lab.interval.degree);
  const subtitle =
    lab.mode === "notes"
      ? "O mesmo nome, em várias regiões do braço."
      : lab.isShape
        ? (lab.shape?.name ?? "Sem posição de exemplo")
        : lab.mode === "chords"
          ? "Notas constituintes · " + lab.tones.map((t) => t.name).join(" · ")
          : lab.isComparing
            ? "A altura real determina a distância e a direcção."
            : (lab.intervalIndex === 0 ? "Referência" : lab.interval.name) +
              " · " +
              lab.interval.semitones +
              " semitons";
  return (
    <div className={styles.boardHeading}>
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <span className={styles.statusPill}>
        {lab.choosingReference
          ? "Escolhe a referência"
          : lab.isShape
            ? "Posição de acorde"
            : "Toca para descobrir"}
      </span>
    </div>
  );
}

function RegionNav({ lab }: LabProps) {
  return (
    <div className={styles.regionNav}>
      <span>Casas</span>
      <div role="group" aria-label="Região do braço">
        {[0, 6, 12, 18].map((start) => (
          <button
            type="button"
            key={start}
            aria-pressed={lab.region === start}
            onClick={() => lab.setRegion(start)}
          >
            {start}–{start + 6}
          </button>
        ))}
      </div>
      <span className={styles.regionEnd}>0 = corda solta</span>
    </div>
  );
}

function Fretboard({
  lab,
  vertical = false,
  compact = false,
  continuous = false,
}: LabProps & { vertical?: boolean; compact?: boolean; continuous?: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const visibleFrets =
    vertical || compact
      ? Array.from({ length: 7 }, (_, i) => lab.region + i)
      : Array.from({ length: 25 }, (_, i) => i);
  const strings = vertical ? [6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6];
  const hasSelected = visibleFrets.includes(lab.selected.fret);

  useEffect(() => {
    if (!vertical && !compact && !continuous)
      scrollRef.current?.scrollTo({ left: lab.region * 64, behavior: "smooth" });
  }, [lab.region, vertical, compact, continuous]);

  function onGridKey(event: KeyboardEvent<HTMLDivElement>) {
    if (!(event.target instanceof HTMLButtonElement)) return;
    const target = event.target;
    const string = Number(target.dataset.string);
    const fret = Number(target.dataset.fret);
    if (!string || !Number.isFinite(fret)) return;
    let nextString = string;
    let nextFret = fret;
    if (event.key === "ArrowRight") {
      if (vertical) nextString--;
      else nextFret++;
    } else if (event.key === "ArrowLeft") {
      if (vertical) nextString++;
      else nextFret--;
    } else if (event.key === "ArrowDown") {
      if (vertical) nextFret++;
      else nextString++;
    } else if (event.key === "ArrowUp") {
      if (vertical) nextFret--;
      else nextString--;
    } else return;
    event.preventDefault();
    event.stopPropagation();
    const button = gridRef.current?.querySelector<HTMLButtonElement>(
      '[data-string="' + nextString + '"][data-fret="' + nextFret + '"]',
    );
    if (button) {
      button.focus();
      lab.choose({ string: nextString, fret: nextFret });
    }
  }

  function stringLabel(string: number) {
    const fret = lab.shape?.frets[6 - string];
    return (
      <span className={styles.stringLabel}>
        {string}ª <strong>{SHARPS[OPEN_MIDI[string - 1] % 12]}</strong>
        {lab.isShape && (
          <small>{fret === undefined || fret < 0 ? "×" : fret === 0 ? "○" : ""}</small>
        )}
      </span>
    );
  }
  function renderCell(string: number, fret: number) {
    const position = { string, fret };
    const info = lab.cell(position);
    const isEntry = hasSelected
      ? info.isSelected
      : string === strings[0] && fret === visibleFrets[0];
    return (
      <div
        role="gridcell"
        className={styles.fretCell}
        key={string + "-" + fret}
        data-open={fret === 0 || undefined}
        data-inlay={[3, 5, 7, 9, 12, 15, 17, 19, 21, 24].includes(fret) || undefined}
      >
        <button
          type="button"
          tabIndex={isEntry ? 0 : -1}
          data-string={string}
          data-fret={fret}
          data-active={info.active || undefined}
          data-root={info.isRoot || undefined}
          data-selected={info.isSelected || undefined}
          data-reference={info.isReference || undefined}
          aria-label={
            string +
            "ª corda, casa " +
            fret +
            ", " +
            pitchName(info.midi, info.name.split("/")[0]) +
            (info.role ? ", " + info.role : "")
          }
          aria-pressed={info.isSelected}
          onClick={() => lab.choose(position)}
        >
          <span>{info.active || info.isSelected || lab.showAll ? info.name : "·"}</span>
          {info.active && info.role && (
            <small>{info.role === "1" ? (lab.mode === "chords" ? "F" : "R") : info.role}</small>
          )}
        </button>
      </div>
    );
  }

  const gridStyle: CSSProperties = {
    gridTemplateColumns: vertical
      ? "34px repeat(6, minmax(40px, 1fr))"
      : continuous
        ? "46px repeat(25, minmax(40px, 1fr))"
        : "46px repeat(" + visibleFrets.length + ", 64px)",
  };
  return (
    <>
      {lab.isShape && !lab.shape && (
        <p className={styles.fixtureNotice}>
          Os exemplos tocáveis deste protótipo estão disponíveis em C. Muda a fundamental para C ou
          explora o mapa de notas.
        </p>
      )}
      <div className={styles.boardScroll} ref={scrollRef}>
        <div
          className={
            vertical
              ? styles.verticalBoard
              : continuous
                ? styles.continuousBoard
                : styles.horizontalBoard
          }
          ref={gridRef}
          role="grid"
          aria-label={vertical ? "Braço vertical, seis cordas" : "Braço horizontal, seis cordas"}
          data-fretboard
          onKeyDown={onGridKey}
        >
          <div className={styles.boardRow} role="row" style={gridStyle}>
            <span role="columnheader" className={styles.gridCorner}>
              {vertical ? "Casa" : "Corda"}
            </span>
            {vertical
              ? strings.map((string) => (
                  <span role="columnheader" key={string}>
                    {stringLabel(string)}
                  </span>
                ))
              : visibleFrets.map((fret) => (
                  <span role="columnheader" className={styles.fretNumber} key={fret}>
                    {fret}
                    {fret === 12 || fret === 24 ? " ◇" : ""}
                  </span>
                ))}
          </div>
          {vertical
            ? visibleFrets.map((fret) => (
                <div className={styles.boardRow} role="row" style={gridStyle} key={fret}>
                  <span role="rowheader" className={styles.fretNumber}>
                    {fret}
                  </span>
                  {strings.map((string) => renderCell(string, fret))}
                </div>
              ))
            : strings.map((string) => (
                <div className={styles.boardRow} role="row" style={gridStyle} key={string}>
                  <span role="rowheader">{stringLabel(string)}</span>
                  {visibleFrets.map((fret) => renderCell(string, fret))}
                </div>
              ))}
        </div>
      </div>
      <p className={styles.boardCaption}>
        {vertical
          ? "Da 6.ª corda grave, à esquerda, para a 1.ª aguda."
          : "1.ª corda aguda em cima · 6.ª corda grave em baixo."}{" "}
        <span>Tab entra no braço; as setas percorrem as posições.</span>
      </p>
    </>
  );
}

function Legend({ lab }: LabProps) {
  return (
    <div className={styles.legend}>
      <span>
        <i className={styles.legendRoot}>{lab.mode === "chords" ? "F" : "R"}</i>
        {lab.mode === "chords" ? "Fundamental" : "Referência"}
      </span>
      <span>
        <i className={styles.legendTone}>3</i>
        {lab.isComparing ? "Alvo" : "Nota / função"}
      </span>
      <span>
        <i className={styles.legendSelected}>□</i>Posição seleccionada
      </span>
      {lab.mode === "chords" && (
        <p>
          {lab.isShape
            ? "Só as posições marcadas pertencem ao exemplo tocável. × abafada · ○ solta."
            : "Mapa de notas: estas posições são alternativas, não um acorde para tocar de uma vez."}
        </p>
      )}
    </div>
  );
}

function Inspector({ lab }: LabProps) {
  const info = lab.selectedCell;
  const spelling = info.name.split("/")[0];
  const pitch = pitchName(info.midi, spelling);
  const selectedTone = lab.tones.find((tone) => tone.pc === info.pc);
  const bassTone =
    lab.bass === null ? undefined : lab.tones.find((tone) => tone.pc === lab.bass! % 12);
  return (
    <section className={styles.inspector} aria-label="Detalhes da exploração" aria-live="polite">
      <p className={styles.eyebrow}>POSIÇÃO SELECCIONADA</p>
      <div className={styles.selectedPitch}>
        <strong>{pitch}</strong>
        <span>
          {lab.selected.string}ª corda · casa {lab.selected.fret}
          <small>
            {FREE_NAMES[info.pc]} · {MODE_NAMES[lab.mode]}
          </small>
        </span>
      </div>
      {lab.mode === "notes" && (
        <div className={styles.insight}>
          <h3>O nome não conta tudo.</h3>
          <p>
            Duas posições podem produzir a mesma altura. O número em {pitch} identifica a oitava; a
            corda e a casa identificam o lugar.
          </p>
        </div>
      )}
      {lab.isComparing && (
        <>
          <div className={styles.comparison}>
            <div>
              <span>Referência</span>
              <strong>{pitchName(midiAt(lab.reference))}</strong>
              <small>
                {lab.reference.string}ª · casa {lab.reference.fret}
              </small>
            </div>
            <span aria-hidden="true">→</span>
            <div>
              <span>Alvo</span>
              <strong>{pitch}</strong>
              <small>
                {lab.selected.string}ª · casa {lab.selected.fret}
              </small>
            </div>
          </div>
          <div className={styles.intervalResult}>
            <strong>{lab.comparison.name}</strong>
            <span>
              {lab.comparison.distance} semitons · {lab.comparison.direction}
            </span>
          </div>
          <p className={styles.detailText}>
            {lab.comparison.distance === 0
              ? "A altura é igual, mesmo que a posição no braço mude."
              : lab.comparison.distance > 12
                ? "A distância ultrapassa uma oitava. Os nomes dos intervalos compostos entram numa fase posterior."
                : "Esta leitura compara as alturas reais das posições seleccionadas, com direcção e distância em semitons."}
          </p>
        </>
      )}
      {lab.mode === "intervals" && !lab.isComparing && (
        <div className={styles.insight}>
          <h3>
            {spellInterval(lab.root, lab.interval.semitones, lab.interval.degree)} é{" "}
            {lab.intervalIndex === 0 ? "a referência" : lab.interval.name.toLowerCase()} de{" "}
            {lab.root}.
          </h3>
          <p>
            A função é mantida nas diferentes oitavas. Para comparar duas alturas concretas, muda a
            leitura para “Comparar posições”.
          </p>
          <p className={styles.formula}>
            {lab.interval.short} <span>·</span> {lab.interval.semitones} semitons na fórmula
          </p>
        </div>
      )}
      {lab.mode === "chords" && (
        <>
          <div className={styles.chordFormula}>
            {lab.tones.map((tone) => (
              <span key={tone.role}>
                <strong>{tone.name}</strong>
                <small>{tone.role === "1" ? "Fundamental" : tone.role}</small>
              </span>
            ))}
          </div>
          <p className={styles.detailText}>
            {selectedTone
              ? info.name +
                " tem função " +
                selectedTone.role +
                " em " +
                lab.root +
                lab.quality.suffix +
                "."
              : "Esta nota não pertence ao acorde seleccionado."}
          </p>
          {lab.isShape && lab.shape && (
            <div className={styles.insight}>
              <h3>{lab.shape.name}</h3>
              <p>
                Fundamental <strong>{lab.root}</strong> · baixo{" "}
                <strong>{lab.bass !== null ? pitchName(lab.bass, bassTone?.name) : "—"}</strong>
              </p>
              <p className={styles.fingering}>
                {lab.shape.frets
                  .map((fret, i) => 6 - i + "ª " + (fret < 0 ? "×" : fret))
                  .join(" · ")}
              </p>
            </div>
          )}
        </>
      )}
      <div className={styles.currentState}>
        <span>Estado da exploração</span>
        <p>
          {MODE_NAMES[lab.mode]} ·{" "}
          {lab.mode === "chords"
            ? lab.root +
              lab.quality.suffix +
              " · " +
              (lab.isShape ? "posição tocável" : "mapa de notas")
            : lab.isComparing
              ? "comparação entre posições"
              : "referência " + lab.root}{" "}
          · casas 0–24
        </p>
      </div>
    </section>
  );
}

function ExamplePanel({ lab }: LabProps) {
  return (
    <section className={styles.examplePanel} aria-label="Exemplos comentados">
      <p className={styles.eyebrow}>PERCEBER COM UM EXEMPLO</p>
      <h2>Experimenta uma relação.</h2>
      <div className={styles.exampleLinks}>
        {EXAMPLES.slice(1).map((item, index) => (
          <button key={item.title} type="button" onClick={() => lab.applyExample(index + 1)}>
            <span>{item.title}</span>
            <span aria-hidden="true">↗</span>
          </button>
        ))}
      </div>
      <p className={styles.detailText}>{EXAMPLES[lab.example].text}</p>
    </section>
  );
}
