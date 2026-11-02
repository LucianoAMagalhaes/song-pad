import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TheoryPage from "@/app/theory/page";
import { loadGreekModePreferences, saveGreekModePreferences } from "@/lib/greekModePreferences";
import { saveTheoryPreferences } from "@/lib/theoryPreferences";

const auth = vi.hoisted(() => ({
  user: { uid: "musician" } as { uid: string } | null,
  loading: false,
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth }));
beforeEach(() => {
  localStorage.clear();
  auth.user = { uid: "musician" };
});
afterEach(() => vi.restoreAllMocks());

describe("Teoria — Greek modes with the real core", () => {
  it("shows notes and formula together, compares a chosen reference, and keeps scale settings independent", async () => {
    const user = userEvent.setup();
    render(<TheoryPage />);
    await user.click(screen.getByRole("button", { name: "Escalas" }));
    await user.selectOptions(screen.getByLabelText("Tónica"), "Db");
    await user.selectOptions(screen.getByLabelText("Família"), "minor-pentatonic");
    await user.click(screen.getByRole("button", { name: "Modos Gregos" }));
    expect(screen.getByLabelText("Tónica")).toHaveValue("C");
    await user.selectOptions(screen.getByLabelText("Tónica"), "D");
    await user.selectOptions(screen.getByLabelText("Modo musical"), "dorian");
    expect(screen.getByText("D · E · F · G · A · B · C")).toBeInTheDocument();
    expect(screen.getByText("1 · 2 · b3 · 4 · 5 · 6 · b7")).toBeInTheDocument();
    expect(screen.getAllByRole("grid")).toHaveLength(1);
    expect(screen.getByRole("table", { name: "Modos com a mesma tónica" })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Modo de referência"), "aeolian");
    const row = screen.getByRole("button", { name: "Explorar D · Dórico" }).closest("tr")!;
    expect(within(row).getByText("Diferenças: B/6 em vez de Bb/b6.")).toBeInTheDocument();
    expect(screen.getByLabelText("Modo musical")).toHaveValue("dorian");
    await user.selectOptions(screen.getByLabelText("Leitura"), "degrees");
    const f = screen.getByRole("button", { name: "F4, 1.ª corda, casa 1, grau b3" });
    await user.click(f);
    expect(f).toHaveTextContent("b3");
    expect(screen.getByText("Terça menor · 3 semitons")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Escalas" }));
    expect(screen.getByLabelText("Tónica")).toHaveValue("Db");
    expect(screen.getByLabelText("Família")).toHaveValue("minor-pentatonic");
    expect(screen.getByLabelText("Leitura")).toHaveValue("notes");
    await user.click(screen.getByRole("button", { name: "Modos Gregos" }));
    expect(screen.getByLabelText("Tónica")).toHaveValue("D");
    expect(screen.getByLabelText("Leitura")).toHaveValue("degrees");
    expect(screen.getByRole("button", { name: "F4, 1.ª corda, casa 1, grau b3" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("rotates relative modes without changing membership, and preserves the selected scale when changing view", async () => {
    const user = userEvent.setup();
    render(<TheoryPage />);
    await user.click(screen.getByRole("button", { name: "Modos Gregos" }));
    await user.selectOptions(screen.getByLabelText("Tónica"), "D");
    await user.selectOptions(screen.getByLabelText("Modo musical"), "dorian");
    await user.click(screen.getByRole("button", { name: "Mesmas notas" }));
    expect(screen.getByLabelText("Tónica")).toHaveValue("D");
    expect(screen.queryByLabelText("Modo de referência")).not.toBeInTheDocument();
    expect(screen.getByText(/Mesmas notas de C maior/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Explorar E · Frígio" }));
    expect(screen.getByLabelText("Tónica")).toHaveValue("E");
    expect(screen.getByLabelText("Modo musical")).toHaveValue("phrygian");
    expect(screen.getByText("E · F · G · A · B · C · D")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "E4, 1.ª corda, casa 0, corda solta, tónica, grau 1" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mesma tónica" }));
    expect(screen.getByLabelText("Tónica")).toHaveValue("E");
    expect(screen.getByLabelText("Modo musical")).toHaveValue("phrygian");
    await user.click(screen.getByRole("button", { name: "Explorar E · Dórico" }));
    expect(screen.getByText("E · F# · G · A · B · C# · D")).toBeInTheDocument();
  });

  it("restores contextual relative tonics, resets transient positions and isolates accounts", async () => {
    const user = userEvent.setup();
    const view = render(<TheoryPage />);
    await user.click(screen.getByRole("button", { name: "Modos Gregos" }));
    await user.selectOptions(screen.getByLabelText("Tónica"), "C#");
    await user.selectOptions(screen.getByLabelText("Modo de referência"), "aeolian");
    await user.selectOptions(screen.getByLabelText("Leitura"), "degrees");
    await user.click(screen.getByRole("button", { name: "Mesmas notas" }));
    await user.click(screen.getByRole("button", { name: "Explorar E# · Frígio" }));
    const tonic = screen.getByRole("button", { name: "E#4, 1.ª corda, casa 1, tónica, grau 1" });
    await user.click(tonic);
    tonic.focus();
    await user.keyboard("{End}{ArrowDown}{Home}");
    expect(document.activeElement).toHaveAttribute("data-fret", "0");
    view.unmount();
    const reopened = render(<TheoryPage />);
    expect(screen.getByLabelText("Tónica")).toHaveValue("E#");
    expect(screen.getByLabelText("Leitura")).toHaveValue("degrees");
    expect(screen.getByRole("button", { name: "Mesmas notas" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      within(screen.getByRole("region", { name: "Posição seleccionada" })).getByText(
        "2.ª corda · casa 1",
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mesma tónica" }));
    expect(screen.getByLabelText("Modo de referência")).toHaveValue("aeolian");
    auth.user = { uid: "another" };
    reopened.rerender(<TheoryPage />);
    await user.click(screen.getByRole("button", { name: "Modos Gregos" }));
    expect(screen.getByLabelText("Tónica")).toHaveValue("C");
    expect(screen.getByLabelText("Modo musical")).toHaveValue("ionian");
    expect(loadGreekModePreferences("musician").tonic).toBe("E#");
  });

  it("hydrates modal preferences without SSR storage access or overwriting saved choices", () => {
    saveTheoryPreferences("musician", {
      mode: "greek-modes",
      tonic: "Db",
      family: "major",
      reading: "notes",
    });
    const modal = {
      tonic: "D",
      musicalMode: "dorian",
      comparison: "relative",
      reading: "degrees",
      referenceMode: "aeolian",
    } as const;
    saveGreekModePreferences("musician", modal);
    const storage = vi.spyOn(window, "localStorage", "get");
    const container = document.createElement("div");
    document.body.appendChild(container);
    container.innerHTML = renderToString(
      <StrictMode>
        <TheoryPage />
      </StrictMode>,
    );
    expect(storage).not.toHaveBeenCalled();
    const onRecoverableError = vi.fn();
    render(
      <StrictMode>
        <TheoryPage />
      </StrictMode>,
      { container, hydrate: true, onRecoverableError },
    );
    expect(screen.getByRole("heading", { name: "D · Dórico" })).toBeInTheDocument();
    expect(loadGreekModePreferences("musician")).toEqual(modal);
    expect(onRecoverableError).not.toHaveBeenCalled();
  });

  it("continues modal exploration when storage is blocked", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });
    render(<TheoryPage />);
    await user.click(screen.getByRole("button", { name: "Modos Gregos" }));
    await user.selectOptions(screen.getByLabelText("Modo musical"), "locrian");
    await user.click(screen.getByRole("button", { name: "Mesmas notas" }));
    await user.click(screen.getByRole("button", { name: "Explorar Db · Jónio (maior)" }));
    expect(screen.getByRole("heading", { name: "Db · Jónio (maior)" })).toBeInTheDocument();
  });
});
