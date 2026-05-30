import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { filterSongs } from "@/repositories/songRepository";
import type { Song } from "@/models/song";

// The list reads songs reactively via the `useSongs` hook (a Firestore
// listener). We mock the hook so these tests exercise the component's
// rendering and search UI without standing up Firestore. The real filtering
// logic (`filterSongs`) is reused so the search interaction stays meaningful.
let mockSongs: Song[] | undefined = [];

vi.mock("@/hooks/useSongs", () => ({
  useSongs: (query = "") => (mockSongs ? filterSongs(mockSongs, query) : undefined),
}));

// Imported after the mock is declared (vi.mock is hoisted regardless).
import { SongList } from "@/components/SongList";

function makeSong(overrides: Partial<Song>): Song {
  const now = new Date("2026-05-01T10:00:00.000Z");
  return {
    id: "song-1",
    title: "Imagine",
    artist: "John Lennon",
    content: "",
    key: "C",
    bpm: 75,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

afterEach(() => {
  mockSongs = [];
});

describe("SongList", () => {
  it("shows a loading state until the first snapshot arrives", () => {
    mockSongs = undefined;
    render(<SongList />);
    expect(screen.getByText(/A carregar/i)).toBeInTheDocument();
  });

  it("shows the empty state when there are no songs", () => {
    mockSongs = [];
    render(<SongList />);

    expect(screen.getByText(/Ainda não tens músicas/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Criar primeira música/i })).toHaveAttribute(
      "href",
      "/songs/new",
    );
  });

  it("renders existing songs", () => {
    mockSongs = [makeSong({ id: "1", title: "Imagine", artist: "John Lennon" })];
    render(<SongList />);

    expect(screen.getByText("Imagine")).toBeInTheDocument();
    expect(screen.getByText("John Lennon")).toBeInTheDocument();
  });

  it("filters by search query", async () => {
    mockSongs = [
      makeSong({ id: "1", title: "Imagine", artist: "John Lennon" }),
      makeSong({ id: "2", title: "Hey Jude", artist: "The Beatles" }),
    ];
    const user = userEvent.setup();
    render(<SongList />);

    expect(screen.getByText("Imagine")).toBeInTheDocument();
    expect(screen.getByText("Hey Jude")).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Pesquisar músicas/i), "beatles");

    await waitFor(() => {
      expect(screen.queryByText("Imagine")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Hey Jude")).toBeInTheDocument();
  });

  it("shows a 'no results' empty state when the query matches nothing", async () => {
    mockSongs = [makeSong({ id: "1", title: "Imagine", artist: "John Lennon" })];
    const user = userEvent.setup();
    render(<SongList />);

    await user.type(screen.getByLabelText(/Pesquisar músicas/i), "zzz");

    expect(await screen.findByText(/Sem resultados/i)).toBeInTheDocument();
  });
});
