import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TheoryPage from "@/app/theory/page";

describe("Teoria — notes", () => {
  it("opens with C in Notes and inspects two positions producing A2", async () => {
    const user = userEvent.setup();
    render(<TheoryPage />);

    expect(screen.getByLabelText("Nota de referência")).toHaveValue("C");
    expect(screen.getByRole("heading", { name: "Notas" })).toBeInTheDocument();
    const details = screen.getByRole("region", { name: "Posição seleccionada" });
    expect(within(details).getByText("C4")).toBeInTheDocument();
    const board = screen.getByRole("grid", { name: "Braço da guitarra" });
    expect(within(board).getAllByRole("button")).toHaveLength(150);
    const openA = within(board).getByRole("button", { name: "A2, 5.ª corda, casa 0, corda solta" });
    expect(openA).toHaveAttribute("aria-pressed", "false");

    await user.selectOptions(screen.getByLabelText("Nota de referência"), "A");
    expect(openA).toHaveAccessibleName("A2, 5.ª corda, casa 0, corda solta, referência");
    await user.click(openA);
    expect(openA).toHaveAttribute("aria-pressed", "true");
    expect(within(details).getByText("A2")).toBeInTheDocument();
    expect(within(details).getByText("5.ª corda · casa 0 (solta)")).toBeInTheDocument();

    await user.click(
      within(board).getByRole("button", { name: "A2, 6.ª corda, casa 5, referência" }),
    );
    expect(within(details).getByText("A2")).toBeInTheDocument();
    expect(within(details).getByText("6.ª corda · casa 5")).toBeInTheDocument();
    expect(within(details).getByText("5.ª corda · casa 0 (solta)")).toBeInTheDocument();
  });

  it("keeps pitch and position selected when switching between C# and Db", async () => {
    const user = userEvent.setup();
    render(<TheoryPage />);
    const board = screen.getByRole("grid", { name: "Braço da guitarra" });
    const details = screen.getByRole("region", { name: "Posição seleccionada" });
    await user.selectOptions(screen.getByLabelText("Nota de referência"), "C#");
    await user.click(
      within(board).getByRole("button", { name: "C#4, 2.ª corda, casa 2, referência" }),
    );
    expect(within(details).getByText("C#4")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Nota de referência"), "Db");
    expect(within(details).getByText("Db4")).toBeInTheDocument();
    expect(within(details).getByText("Equivalências enarmónicas: C#4 = Db4")).toBeInTheDocument();
    expect(
      within(board).getByRole("button", { name: "Db4, 2.ª corda, casa 2, referência" }),
    ).toHaveAttribute("aria-pressed", "true");

    const otherNote = within(board).getByRole("button", { name: "D4, 2.ª corda, casa 3" });
    expect(otherNote).not.toHaveTextContent("D");
    await user.click(screen.getByLabelText("Mostrar também as outras notas"));
    expect(otherNote).toHaveTextContent("D");
  });

  it("enters the selected position with Tab and explores the full fretboard using arrows", async () => {
    const user = userEvent.setup();
    render(<TheoryPage />);
    const board = screen.getByRole("grid", { name: "Braço da guitarra" });
    const details = screen.getByRole("region", { name: "Posição seleccionada" });
    screen.getByLabelText("Mostrar também as outras notas").focus();
    await user.tab();
    expect(
      within(board).getByRole("button", { name: "C4, 2.ª corda, casa 1, referência" }),
    ).toHaveFocus();

    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(
      within(board).getByRole("button", { name: "B3, 2.ª corda, casa 0, corda solta" }),
    ).toHaveFocus();
    expect(within(details).getByText("B3")).toBeInTheDocument();
    await user.keyboard("{ArrowDown}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}");
    expect(within(board).getByRole("button", { name: "B3, 3.ª corda, casa 4" })).toHaveFocus();
    expect(within(details).getByText("B3")).toBeInTheDocument();
    await user.keyboard("{End}{ArrowRight}");
    expect(within(board).getByRole("button", { name: "G5, 3.ª corda, casa 24" })).toHaveFocus();
    await user.keyboard("{ArrowUp}{ArrowUp}{ArrowUp}");
    expect(within(board).getByRole("button", { name: "E6, 1.ª corda, casa 24" })).toHaveFocus();
    await user.keyboard("{Home}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}");
    expect(
      within(board).getByRole("button", { name: "E2, 6.ª corda, casa 0, corda solta" }),
    ).toHaveFocus();
    expect(within(details).getByText("E2")).toBeInTheDocument();
    await user.keyboard(
      "{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}",
    );
    expect(within(details).getByText("E3")).toBeInTheDocument();
  });
});

describe("Teoria — intervals", () => {
  it("shows the written register of Cb4 while retaining B as the tuning label", async () => {
    const user = userEvent.setup();
    render(<TheoryPage />);
    await user.click(screen.getByRole("button", { name: "Intervalos" }));
    await user.selectOptions(screen.getByLabelText("Nota de referência"), "Db");
    await user.selectOptions(screen.getByLabelText("Intervalo"), "7m");
    const board = screen.getByRole("grid", { name: "Braço da guitarra" });
    await user.click(
      within(board).getByRole("button", { name: "Cb4, 2.ª corda, casa 0, corda solta, 7m" }),
    );
    const details = screen.getByRole("region", { name: "Posição seleccionada" });
    expect(within(details).getByText("Cb4")).toBeInTheDocument();
    expect(within(details).getByText("Equivalências enarmónicas: B3 = Cb4")).toBeInTheDocument();
    expect(within(board).getByRole("rowheader", { name: "2.ª B" })).toBeInTheDocument();
  });
  it("chooses a reference with the keyboard without changing the target while navigating", async () => {
    const user = userEvent.setup();
    render(<TheoryPage />);
    await user.click(screen.getByRole("button", { name: "Intervalos" }));
    await user.selectOptions(screen.getByLabelText("Leitura"), "positions");
    const result = screen.getByRole("region", { name: "Comparação entre posições" });
    await user.click(screen.getByRole("button", { name: "Alterar referência · C4" }));
    screen.getByLabelText("Mostrar também as outras notas").focus();
    await user.tab();
    expect(
      screen.getByRole("button", { name: "C4, 2.ª corda, casa 1, referência, Alvo" }),
    ).toHaveFocus();
    await user.keyboard("{ArrowLeft}{ArrowDown}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}");
    expect(within(result).getByText("B3 → C4")).toBeInTheDocument();
    expect(within(result).getByText("Alvo: 2.ª corda · casa 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Escolhe a referência no braço…" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Alterar referência · B3" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await user.keyboard("{ArrowUp}{Home}");
    expect(within(result).getByText("B3 → B3")).toBeInTheDocument();
    expect(within(result).getByText("Uníssono")).toBeInTheDocument();
    expect(within(result).getByText("Referência: 3.ª corda · casa 4")).toBeInTheDocument();
    expect(within(result).getByText("Alvo: 2.ª corda · casa 0 (solta)")).toBeInTheDocument();
  });
  it("compares real heights independently of the relative interval and lets the user choose both positions", async () => {
    const user = userEvent.setup();
    render(<TheoryPage />);
    await user.click(screen.getByRole("button", { name: "Intervalos" }));
    await user.selectOptions(screen.getByLabelText("Leitura"), "positions");
    expect(screen.queryByLabelText("Intervalo")).not.toBeInTheDocument();
    const result = screen.getByRole("region", { name: "Comparação entre posições" });
    const board = screen.getByRole("grid", { name: "Braço da guitarra" });
    await user.click(within(board).getByRole("button", { name: "G4, 1.ª corda, casa 3" }));
    expect(within(result).getByText("Quinta justa")).toBeInTheDocument();
    expect(within(result).getByText("7 semitons · Ascendente")).toBeInTheDocument();
    expect(within(result).getByText("C4 → G4")).toBeInTheDocument();
    await user.click(
      within(board).getByRole("button", { name: "G3, 3.ª corda, casa 0, corda solta" }),
    );
    expect(within(result).getByText("Quarta justa")).toBeInTheDocument();
    expect(within(result).getByText("5 semitons · Descendente")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Alterar referência · C4" }));
    await user.click(within(board).getByRole("button", { name: "C3, 5.ª corda, casa 3" }));
    await user.click(
      within(board).getByRole("button", { name: "E4, 1.ª corda, casa 0, corda solta" }),
    );
    expect(within(result).getByText("C3 → E4")).toBeInTheDocument();
    expect(within(result).getByText("Mais de uma oitava")).toBeInTheDocument();
    expect(within(result).getByText("16 semitons · Ascendente")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Alterar referência · C3" }));
    await user.click(
      within(board).getByRole("button", { name: "A2, 5.ª corda, casa 0, corda solta" }),
    );
    await user.click(within(board).getByRole("button", { name: "A2, 6.ª corda, casa 5" }));
    expect(within(result).getByText("A2 → A2")).toBeInTheDocument();
    expect(within(result).getByText("Uníssono")).toBeInTheDocument();
    expect(within(result).getByText("0 semitons · Mesma altura")).toBeInTheDocument();
    expect(within(result).getByText("Referência: 5.ª corda · casa 0 (solta)")).toBeInTheDocument();
    expect(within(result).getByText("Alvo: 6.ª corda · casa 5")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Leitura"), "relative");
    expect(screen.getByLabelText("Intervalo")).toHaveValue("5J");
    expect(screen.getByRole("heading", { name: "C → G" })).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Posição seleccionada" })).getByText("A2"),
    ).toBeInTheDocument();
  });
  it("explores a relative fifth across registers and preserves the diatonic spelling of a tritone", async () => {
    const user = userEvent.setup();
    render(<TheoryPage />);
    await user.click(screen.getByRole("button", { name: "Intervalos" }));
    expect(screen.getByLabelText("Leitura")).toHaveValue("relative");
    expect(screen.getByRole("heading", { name: "C → G" })).toBeInTheDocument();
    const board = screen.getByRole("grid", { name: "Braço da guitarra" });
    const details = screen.getByRole("region", { name: "Posição seleccionada" });
    await user.click(
      within(board).getByRole("button", { name: "G3, 3.ª corda, casa 0, corda solta, 5J" }),
    );
    expect(within(details).getByText("G3")).toBeInTheDocument();
    expect(
      within(details).getByText("G: Quinta justa de C · 7 semitons na relação."),
    ).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Intervalo"), "4A");
    expect(screen.getByRole("heading", { name: "C → F#" })).toBeInTheDocument();
    await user.click(within(board).getByRole("button", { name: "F#4, 1.ª corda, casa 2, 4A" }));
    expect(within(details).getByText("F#4")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Intervalo"), "5d");
    expect(screen.getByRole("heading", { name: "C → Gb" })).toBeInTheDocument();
    expect(within(details).getByText("Gb4")).toBeInTheDocument();
    expect(
      within(details).getByText("Gb: Quinta diminuta de C · 6 semitons na relação."),
    ).toBeInTheDocument();
    expect(
      within(board).getByRole("button", { name: "Gb4, 1.ª corda, casa 2, 5d" }),
    ).toHaveAttribute("aria-pressed", "true");
    await user.selectOptions(screen.getByLabelText("Nota de referência"), "C#");
    expect(screen.getByRole("heading", { name: "C# → G" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Notas" }));
    expect(screen.getByRole("heading", { name: "Encontra C#" })).toBeInTheDocument();
    expect(within(details).getByText("F#4")).toBeInTheDocument();
  });
});
