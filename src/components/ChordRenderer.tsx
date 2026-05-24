import { parse, type Line, type Segment } from "@/lib/chordProParser";

interface ChordRendererProps {
  /** ChordPro source. Already transposed if the caller wants a non-original key. */
  content: string;
}

/**
 * Renders ChordPro content as a two-line layout: each chord sits directly
 * above the syllable it leads. Empty source lines are preserved as blank
 * paragraphs so verse/chorus spacing stays intact.
 */
export function ChordRenderer({ content }: ChordRendererProps) {
  const lines = parse(content);

  return (
    <div className="font-mono text-base leading-relaxed text-foreground whitespace-pre">
      {lines.map((line, index) => (
        <LineRow key={index} line={line} />
      ))}
    </div>
  );
}

function LineRow({ line }: { line: Line }) {
  if (line.segments.length === 0) {
    return <div className="h-6" aria-hidden="true" />;
  }

  return (
    <div className="flex flex-wrap items-end py-1">
      {line.segments.map((segment, index) => (
        <SegmentBlock key={index} segment={segment} />
      ))}
    </div>
  );
}

function SegmentBlock({ segment }: { segment: Segment }) {
  return (
    <div className="inline-flex flex-col">
      <span className="h-5 text-accent font-semibold text-sm">{segment.chord ?? ""}</span>
      <span>{segment.text || " "}</span>
    </div>
  );
}
