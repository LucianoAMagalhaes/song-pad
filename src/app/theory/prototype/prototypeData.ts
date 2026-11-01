/** Throwaway musical fixtures, scoped to the interaction prototype. */
export type Position = { string: number; fret: number };
export type Mode = "notes" | "intervals" | "chords";
export const OPEN_MIDI = [64, 59, 55, 50, 45, 40];
export const SHARPS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const FREE_NAMES = [
  "C",
  "C#/Db",
  "D",
  "D#/Eb",
  "E",
  "F",
  "F#/Gb",
  "G",
  "G#/Ab",
  "A",
  "A#/Bb",
  "B",
];
export const ROOTS = ["C", "C#", "Db", "D", "Eb", "E", "F", "F#", "Gb", "G", "Ab", "A", "Bb", "B"];
const NATURAL: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
export const MODE_NAMES: Record<Mode, string> = {
  notes: "Notas",
  intervals: "Intervalos",
  chords: "Acordes",
};
export const INTERVALS = [
  { name: "Uníssono", short: "1", semitones: 0, degree: 0 },
  { name: "Segunda menor", short: "b2", semitones: 1, degree: 1 },
  { name: "Segunda maior", short: "2", semitones: 2, degree: 1 },
  { name: "Terceira menor", short: "b3", semitones: 3, degree: 2 },
  { name: "Terceira maior", short: "3", semitones: 4, degree: 2 },
  { name: "Quarta justa", short: "4", semitones: 5, degree: 3 },
  { name: "Quarta aumentada", short: "#4", semitones: 6, degree: 3 },
  { name: "Quinta diminuta", short: "b5", semitones: 6, degree: 4 },
  { name: "Quinta justa", short: "5", semitones: 7, degree: 4 },
  { name: "Sexta menor", short: "b6", semitones: 8, degree: 5 },
  { name: "Sexta maior", short: "6", semitones: 9, degree: 5 },
  { name: "Sétima menor", short: "b7", semitones: 10, degree: 6 },
  { name: "Sétima maior", short: "7", semitones: 11, degree: 6 },
  { name: "Oitava", short: "8", semitones: 12, degree: 7 },
];
export const QUALITIES = [
  { suffix: "", name: "Maior", offsets: [0, 4, 7], roles: ["1", "3", "5"] },
  { suffix: "m", name: "Menor", offsets: [0, 3, 7], roles: ["1", "b3", "5"] },
  { suffix: "dim", name: "Diminuto", offsets: [0, 3, 6], roles: ["1", "b3", "b5"] },
  { suffix: "aug", name: "Aumentado", offsets: [0, 4, 8], roles: ["1", "3", "#5"] },
  { suffix: "maj7", name: "Sétima maior", offsets: [0, 4, 7, 11], roles: ["1", "3", "5", "7"] },
  { suffix: "7", name: "Dominante", offsets: [0, 4, 7, 10], roles: ["1", "3", "5", "b7"] },
  { suffix: "m7", name: "Menor com sétima", offsets: [0, 3, 7, 10], roles: ["1", "b3", "5", "b7"] },
  { suffix: "m7b5", name: "Meio-diminuto", offsets: [0, 3, 6, 10], roles: ["1", "b3", "b5", "b7"] },
  {
    suffix: "dim7",
    name: "Sétima diminuta",
    offsets: [0, 3, 6, 9],
    roles: ["1", "b3", "b5", "bb7"],
  },
];
/** Frets are ordered from string 6 (low E) to string 1 (high E). */
export const SHAPES: Record<string, { name: string; frets: number[] }[]> = {
  "": [
    { name: "C · Estado fundamental", frets: [-1, 3, 2, 0, 1, 0] },
    { name: "C/E · Primeira inversão", frets: [0, 3, 2, 0, 1, 0] },
    { name: "C/G · Segunda inversão", frets: [3, 3, 2, 0, 1, 0] },
  ],
  m: [{ name: "Cm · Estado fundamental", frets: [-1, 3, 5, 5, 4, 3] }],
  dim: [{ name: "Cdim · Estado fundamental", frets: [-1, 3, 4, 5, 4, -1] }],
  aug: [{ name: "Caug · Estado fundamental", frets: [-1, 3, 2, 1, 1, -1] }],
  maj7: [{ name: "Cmaj7 · Estado fundamental", frets: [-1, 3, 2, 0, 0, 0] }],
  "7": [{ name: "C7 · Estado fundamental", frets: [-1, 3, 5, 3, 5, 3] }],
  m7: [{ name: "Cm7 · Estado fundamental", frets: [-1, 3, 5, 3, 4, 3] }],
  m7b5: [{ name: "Cm7b5 · Estado fundamental", frets: [-1, 3, 4, 3, 4, -1] }],
  dim7: [{ name: "Cdim7 · Estado fundamental", frets: [-1, 3, 4, 2, 4, -1] }],
};
export function pitchClass(name: string): number {
  return (
    (((NATURAL[name[0]] + [...name.slice(1)].reduce((n, c) => n + (c === "#" ? 1 : -1), 0)) % 12) +
      12) %
    12
  );
}
export function midiAt(position: Position): number {
  return OPEN_MIDI[position.string - 1] + position.fret;
}
export function pitchName(midi: number, spelling?: string): string {
  const name = spelling ?? SHARPS[midi % 12];
  const spelledSemitone =
    NATURAL[name[0]] + [...name.slice(1)].reduce((n, c) => n + (c === "#" ? 1 : -1), 0);
  return name + ((midi - spelledSemitone) / 12 - 1);
}
export function spellInterval(root: string, semitones: number, degree: number): string {
  const letter = LETTERS[(LETTERS.indexOf(root[0]) + degree) % 7];
  let delta = (((pitchClass(root) + semitones - NATURAL[letter]) % 12) + 12) % 12;
  if (delta > 6) delta -= 12;
  return letter + (delta >= 0 ? "#".repeat(delta) : "b".repeat(-delta));
}
export function samePosition(a: Position, b: Position): boolean {
  return a.string === b.string && a.fret === b.fret;
}
export function comparePositions(reference: Position, target: Position) {
  const delta = midiAt(target) - midiAt(reference);
  const distance = Math.abs(delta);
  const names = [
    "Uníssono",
    "Segunda menor",
    "Segunda maior",
    "Terceira menor",
    "Terceira maior",
    "Quarta justa",
    "Trítono",
    "Quinta justa",
    "Sexta menor",
    "Sexta maior",
    "Sétima menor",
    "Sétima maior",
    "Oitava",
  ];
  return {
    delta,
    distance,
    direction: delta === 0 ? "Mesma altura" : delta > 0 ? "Ascendente ↑" : "Descendente ↓",
    name: distance <= 12 ? names[distance] : "Mais de uma oitava",
  };
}
