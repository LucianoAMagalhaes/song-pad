import { parse, type Line, type Segment } from "@/lib/chordProParser";
import { ChordSwapTrigger } from "@/components/ChordSwapTrigger";

interface ChordRendererProps {
  /** ChordPro source. Already transposed if the caller wants a non-original key. */
  content: string;
  /**
   * Stored content in the original key. When provided together with
   * `onSwapChord`, each chord above the lyrics becomes tappable to swap it.
   * Must share `content`'s structure (it does — transposition only changes the
   * chord tokens), so segments align one-to-one.
   */
  originalContent?: string;
  semitones?: number;
  preferFlats?: boolean;
  onSwapChord?: (from: string, to: string) => void;
}

/**
 * Renders ChordPro content as a two-line layout: each chord sits directly
 * above the syllable it leads. Empty source lines are preserved as blank
 * paragraphs so verse/chorus spacing stays intact.
 */
export function ChordRenderer({
  content,
  originalContent,
  semitones = 0,
  preferFlats = false,
  onSwapChord,
}: ChordRendererProps) {
  const lines = parse(content);
  const originalLines = originalContent ? parse(originalContent) : null;
  const swap = onSwapChord ? { semitones, preferFlats, onSwapChord } : null;

  return (
    <div className="font-mono text-base leading-relaxed text-foreground whitespace-pre">
      {lines.map((line, index) => (
        <LineRow key={index} line={line} originalLine={originalLines?.[index]} swap={swap} />
      ))}
    </div>
  );
}

interface SwapContext {
  semitones: number;
  preferFlats: boolean;
  onSwapChord: (from: string, to: string) => void;
}

function LineRow({
  line,
  originalLine,
  swap,
}: {
  line: Line;
  originalLine?: Line;
  swap: SwapContext | null;
}) {
  if (line.segments.length === 0) {
    return <div className="h-6" aria-hidden="true" />;
  }

  return (
    <div className="flex flex-wrap items-end py-1">
      {line.segments.map((segment, index) => (
        <SegmentBlock
          key={index}
          segment={segment}
          original={originalLine?.segments[index]?.chord}
          swap={swap}
        />
      ))}
    </div>
  );
}

function SegmentBlock({
  segment,
  original,
  swap,
}: {
  segment: Segment;
  original?: string;
  swap: SwapContext | null;
}) {
  const chordClasses = "h-5 text-accent font-semibold text-sm";

  return (
    <div className="inline-flex flex-col">
      {segment.chord && swap && original ? (
        <ChordSwapTrigger
          original={original}
          semitones={swap.semitones}
          preferFlats={swap.preferFlats}
          onSwap={swap.onSwapChord}
          className={`${chordClasses} cursor-pointer rounded hover:bg-surface-hover`}
        >
          {segment.chord}
        </ChordSwapTrigger>
      ) : (
        <span className={chordClasses}>{segment.chord ?? ""}</span>
      )}
      <span>{segment.text || " "}</span>
    </div>
  );
}
