import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TheoryPage from "@/app/theory/page";

describe("Teoria — scales with the real core", () => {
  it("updates membership and details when changing family and tonic without moving the selection", async () => {
    const user = userEvent.setup();
    render(<TheoryPage />);
    await user.click(screen.getByRole("button", { name: "Escalas" }));
    const board = screen.getByRole("grid", { name: "Braço da guitarra" });
    const details = screen.getByRole("region", { name: "Posição seleccionada" });
    await user.click(
      within(board).getByRole("button", { name: "E4, 1.ª corda, casa 0, corda solta, grau 3" }),
    );
    expect(within(details).getByText("Terça maior · 4 semitons")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Família"), "natural-minor");
    expect(
      within(board).getByRole("button", {
        name: "E4, 1.ª corda, casa 0, corda solta, fora da escala",
      }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(within(details).getByText("E não pertence à escala escolhida.")).toBeInTheDocument();
    expect(within(details).queryByText("Grau")).not.toBeInTheDocument();
    await user.click(
      within(board).getByRole("button", { name: "Eb3, 4.ª corda, casa 1, grau b3" }),
    );
    expect(within(details).getByText("Eb3")).toBeInTheDocument();
    expect(within(details).getByText("Terça menor · 3 semitons")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Família"), "minor-pentatonic");
    await user.selectOptions(screen.getByLabelText("Leitura"), "degrees");
    expect(
      within(board).getByRole("button", { name: "Eb3, 4.ª corda, casa 1, grau b3" }),
    ).toHaveTextContent("b3");
    await user.click(
      within(board).getByRole("button", { name: "Eb4, 4.ª corda, casa 13, grau b3" }),
    );
    expect(within(details).getByText("Eb4")).toBeInTheDocument();
    expect(within(details).getByText("b3", { selector: "dd" })).toBeInTheDocument();
    expect(within(details).getByText("Terça menor · 3 semitons")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Tónica"), "Eb");
    expect(
      within(board).getByRole("button", { name: "Eb4, 4.ª corda, casa 13, tónica, grau 1" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(within(details).getByText("1 · Tónica")).toBeInTheDocument();
    expect(within(details).getByText("Uníssono · 0 semitons")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Eb · Pentatónica menor" })).toBeInTheDocument();
  });

  it("preserves E#/B# and their written registers when switching to the equivalent Db major scale", async () => {
    const user = userEvent.setup();
    render(<TheoryPage />);
    await user.click(screen.getByRole("button", { name: "Escalas" }));
    await user.selectOptions(screen.getByLabelText("Tónica"), "C#");
    const board = screen.getByRole("grid", { name: "Braço da guitarra" });
    const details = screen.getByRole("region", { name: "Posição seleccionada" });
    await user.click(within(board).getByRole("button", { name: "E#4, 1.ª corda, casa 1, grau 3" }));
    expect(within(details).getByText("E#4")).toBeInTheDocument();
    expect(within(details).getByText("Terça maior · 4 semitons")).toBeInTheDocument();
    await user.click(within(board).getByRole("button", { name: "B#3, 2.ª corda, casa 1, grau 7" }));
    expect(within(details).getByText("B#3")).toBeInTheDocument();
    expect(within(details).getByText("3", { selector: "dd" })).toBeInTheDocument();
    expect(within(details).getByText("Sétima maior · 11 semitons")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Tónica"), "Db");
    expect(
      within(board).getByRole("button", { name: "C4, 2.ª corda, casa 1, grau 7" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(within(details).getByText("C4")).toBeInTheDocument();
    expect(within(details).getByText("Sétima maior · 11 semitons")).toBeInTheDocument();
  });

  it("operates scale controls and all frets with the keyboard and retains selections across modes", async () => {
    const user = userEvent.setup();
    render(<TheoryPage />);
    screen.getByRole("button", { name: "Escalas" }).focus();
    await user.keyboard("{Enter}");
    await user.tab();
    expect(screen.getByLabelText("Tónica")).toHaveFocus();
    await user.selectOptions(screen.getByLabelText("Tónica"), "C");
    await user.tab();
    expect(screen.getByLabelText("Família")).toHaveFocus();
    await user.selectOptions(screen.getByLabelText("Família"), "minor-pentatonic");
    await user.tab();
    expect(screen.getByLabelText("Leitura")).toHaveFocus();
    await user.selectOptions(screen.getByLabelText("Leitura"), "degrees");
    await user.tab();
    await user.tab();
    const board = screen.getByRole("grid", { name: "Braço da guitarra" });
    expect(
      within(board).getByRole("button", { name: "C4, 2.ª corda, casa 1, tónica, grau 1" }),
    ).toHaveFocus();
    await user.keyboard("{ArrowDown}{Home}");
    expect(
      within(board).getByRole("button", { name: "G3, 3.ª corda, casa 0, corda solta, grau 5" }),
    ).toHaveFocus();
    await user.keyboard("{End}");
    expect(
      within(board).getByRole("button", { name: "G5, 3.ª corda, casa 24, grau 5" }),
    ).toHaveFocus();
    const details = screen.getByRole("region", { name: "Posição seleccionada" });
    expect(within(details).getByText("G5")).toBeInTheDocument();
    expect(within(details).getByText("Quinta justa · 7 semitons")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Intervalos" }));
    await user.selectOptions(screen.getByLabelText("Leitura"), "positions");
    expect(
      within(screen.getByRole("region", { name: "Comparação entre posições" })).getByText(
        "Mais de uma oitava",
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Notas" }));
    expect(within(details).getByText("G5")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Escalas" }));
    expect(screen.getByLabelText("Família")).toHaveValue("minor-pentatonic");
    expect(screen.getByLabelText("Leitura")).toHaveValue("degrees");
    expect(within(details).getByText("G5")).toBeInTheDocument();
    expect(
      within(board).getByRole("button", { name: "G5, 3.ª corda, casa 24, grau 5" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("starts with note names and keeps the selected pitch when alternating pentatonic degrees", async () => {
    const user = userEvent.setup();
    render(<TheoryPage />);
    await user.click(screen.getByRole("button", { name: "Escalas" }));
    expect(screen.getByLabelText("Tónica")).toHaveValue("C");
    expect(screen.getByLabelText("Família")).toHaveValue("major");
    expect(screen.getByLabelText("Leitura")).toHaveValue("notes");
    expect(screen.getByRole("heading", { name: "C · Maior" })).toBeInTheDocument();
    const board = screen.getByRole("grid", { name: "Braço da guitarra" });
    const details = screen.getByRole("region", { name: "Posição seleccionada" });
    const g3 = within(board).getByRole("button", {
      name: "G3, 3.ª corda, casa 0, corda solta, grau 5",
    });
    expect(g3).toHaveTextContent("G");
    await user.click(g3);
    await user.selectOptions(screen.getByLabelText("Família"), "major-pentatonic");
    await user.selectOptions(screen.getByLabelText("Leitura"), "degrees");
    expect(g3).toHaveTextContent("5");
    expect(g3).not.toHaveTextContent("G");
    expect(g3).toHaveAttribute("aria-pressed", "true");
    expect(within(details).getByText("G3")).toBeInTheDocument();
    expect(within(details).getByText("Quinta justa · 7 semitons")).toBeInTheDocument();
    expect(within(details).getByText("5", { selector: "dd" })).toBeInTheDocument();
    expect(screen.getByLabelText("Tónica")).toHaveValue("C");
    expect(screen.getByLabelText("Família")).toHaveValue("major-pentatonic");
    await user.selectOptions(screen.getByLabelText("Leitura"), "notes");
    expect(g3).toHaveTextContent("G");
    expect(g3).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.queryByRole("region", { name: "Comparação entre posições" }),
    ).not.toBeInTheDocument();
  });
});
