import { GUITAR, lookupChordPositions, type ChordPosition } from "@/lib/guitarChords";

interface ChordDiagramProps {
  /** Chord name as written in the song, e.g. "Am7" or "G/B". */
  name: string;
}

// Diagram geometry (SVG user units). Compact enough to sit in a horizontal strip.
const STRINGS = GUITAR.strings; // 6
const FRETS = GUITAR.fretsOnChord; // 4
const STRING_GAP = 12;
const FRET_GAP = 13;
const PAD_X = 9;
const TOP = 16; // room above the nut for open/muted markers
const DOT_R = 4.5;

const width = PAD_X * 2 + (STRINGS - 1) * STRING_GAP;
const gridBottom = TOP + FRETS * FRET_GAP;
const height = gridBottom + 4;

const stringX = (i: number) => PAD_X + i * STRING_GAP;
const fretY = (row: number) => TOP + row * FRET_GAP;

/**
 * Renders a single guitar chord diagram (first/most common fingering) as an SVG.
 * Shows muted (×) and open (○) strings, finger dots with finger numbers, barres,
 * and a base-fret label when the shape sits higher up the neck. Falls back to
 * just the chord name when no fingering is known.
 */
export function ChordDiagram({ name }: ChordDiagramProps) {
  const positions = lookupChordPositions(name);
  const position = positions?.[0] ?? null;

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-accent font-semibold text-sm">{name}</span>
      {position ? (
        <Diagram name={name} position={position} />
      ) : (
        <div
          className="flex items-center justify-center text-muted text-xs"
          style={{ width, height }}
          aria-label={`Sem diagrama para ${name}`}
        >
          —
        </div>
      )}
    </div>
  );
}

function Diagram({ name, position }: { name: string; position: ChordPosition }) {
  const { frets, fingers, baseFret, barres } = position;
  const showNut = baseFret === 1;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={`Diagrama do acorde ${name}`}
      className="text-foreground"
    >
      {/* Fret lines */}
      {Array.from({ length: FRETS + 1 }, (_, row) => (
        <line
          key={`f${row}`}
          x1={stringX(0)}
          y1={fretY(row)}
          x2={stringX(STRINGS - 1)}
          y2={fretY(row)}
          stroke="currentColor"
          strokeOpacity={0.4}
          strokeWidth={row === 0 && showNut ? 2.5 : 1}
        />
      ))}

      {/* Strings */}
      {Array.from({ length: STRINGS }, (_, i) => (
        <line
          key={`s${i}`}
          x1={stringX(i)}
          y1={fretY(0)}
          x2={stringX(i)}
          y2={gridBottom}
          stroke="currentColor"
          strokeOpacity={0.4}
          strokeWidth={1}
        />
      ))}

      {/* Base-fret label when the window is shifted up the neck */}
      {!showNut ? (
        <text
          x={stringX(STRINGS - 1) + 5}
          y={fretY(0) + FRET_GAP - 4}
          fontSize={8}
          fill="currentColor"
          fillOpacity={0.7}
        >
          {baseFret}fr
        </text>
      ) : null}

      {/* Barres */}
      {barres.map((bar) => {
        const pressed = frets.flatMap((f, i) => (f === bar ? [i] : []));
        if (pressed.length < 2) return null;
        const x = stringX(Math.min(...pressed));
        const w = stringX(Math.max(...pressed)) - x;
        return (
          <rect
            key={`b${bar}`}
            x={x - DOT_R}
            y={fretY(bar - 1) + FRET_GAP / 2 - DOT_R}
            width={w + DOT_R * 2}
            height={DOT_R * 2}
            rx={DOT_R}
            fill="currentColor"
          />
        );
      })}

      {/* Per-string markers: muted, open, or finger dot */}
      {frets.map((fret, i) => {
        const x = stringX(i);
        if (fret === -1) {
          return (
            <text
              key={`m${i}`}
              x={x}
              y={TOP - 5}
              fontSize={9}
              textAnchor="middle"
              fill="currentColor"
              fillOpacity={0.6}
            >
              ×
            </text>
          );
        }
        if (fret === 0) {
          return (
            <circle
              key={`o${i}`}
              cx={x}
              cy={TOP - 7}
              r={3}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.6}
              strokeWidth={1}
            />
          );
        }
        const cy = fretY(fret - 1) + FRET_GAP / 2;
        const finger = fingers[i];
        return (
          <g key={`d${i}`}>
            <circle cx={x} cy={cy} r={DOT_R} fill="currentColor" />
            {finger > 0 ? (
              <text
                x={x}
                y={cy + 3}
                fontSize={7}
                textAnchor="middle"
                fill="var(--background)"
                fontWeight="bold"
              >
                {finger}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
