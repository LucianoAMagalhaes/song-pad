import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SongList } from "@/components/SongList";
import { db } from "@/lib/db";
import { songRepository } from "@/repositories/songRepository";

beforeEach(async () => {
  await db.songs.clear();
});

afterEach(async () => {
  await db.songs.clear();
});

describe("SongList", () => {
  it("shows the empty state when there are no songs", async () => {
    render(<SongList />);

    expect(await screen.findByText(/Ainda não tens músicas/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Criar primeira música/i })).toHaveAttribute(
      "href",
      "/songs/new",
    );
  });

  it("renders existing songs from the database", async () => {
    await songRepository.create({
      title: "Imagine",
      artist: "John Lennon",
      content: "[C]Imagine",
      key: "C",
      bpm: 75,
    });

    render(<SongList />);

    expect(await screen.findByText("Imagine")).toBeInTheDocument();
    expect(screen.getByText("John Lennon")).toBeInTheDocument();
  });

  it("filters by search query", async () => {
    await songRepository.create({
      title: "Imagine",
      artist: "John Lennon",
      content: "",
      key: "C",
      bpm: 75,
    });
    await songRepository.create({
      title: "Hey Jude",
      artist: "The Beatles",
      content: "",
      key: "F",
      bpm: 75,
    });

    const user = userEvent.setup();
    render(<SongList />);

    expect(await screen.findByText("Imagine")).toBeInTheDocument();
    expect(screen.getByText("Hey Jude")).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Pesquisar músicas/i), "beatles");

    await waitFor(() => {
      expect(screen.queryByText("Imagine")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Hey Jude")).toBeInTheDocument();
  });

  it("shows a 'no results' empty state when the query matches nothing", async () => {
    await songRepository.create({
      title: "Imagine",
      artist: "John Lennon",
      content: "",
      key: "C",
      bpm: 75,
    });

    const user = userEvent.setup();
    render(<SongList />);

    await screen.findByText("Imagine");
    await user.type(screen.getByLabelText(/Pesquisar músicas/i), "zzz");

    expect(await screen.findByText(/Sem resultados/i)).toBeInTheDocument();
  });
});
