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
