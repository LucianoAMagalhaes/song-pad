import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TheoryPage from "@/app/theory/page";
import { loadTheoryPreferences, saveTheoryPreferences } from "@/lib/theoryPreferences";

const auth = vi.hoisted(() => ({
  user: { uid: "musician" } as { uid: string } | null,
  loading: false,
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth }));

beforeEach(() => {
  localStorage.clear();
  auth.user = { uid: "musician" };
  auth.loading = false;
});
afterEach(() => vi.restoreAllMocks());

describe("Teoria — local preferences with the real core", () => {
  it("switches accounts without displaying or saving the previous account's settings or positions", async () => {
    const user = userEvent.setup();
    saveTheoryPreferences("second", {
      mode: "intervals",
      tonic: "G",
      family: "natural-minor",
      reading: "notes",
    });
    const view = render(<TheoryPage />);
    await user.click(screen.getByRole("button", { name: "Escalas" }));
    await user.selectOptions(screen.getByLabelText("Tónica"), "C#");
    await user.selectOptions(screen.getByLabelText("Família"), "minor-pentatonic");
    await user.selectOptions(screen.getByLabelText("Leitura"), "degrees");
    await user.click(
      screen.getByRole("button", { name: "E4, 1.ª corda, casa 0, corda solta, grau b3" }),
    );
    auth.user = { uid: "second" };
    view.rerender(<TheoryPage />);
    expect(screen.getByRole("button", { name: "Intervalos" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByLabelText("Nota de referência")).toHaveValue("G");
    expect(
      within(screen.getByRole("region", { name: "Posição seleccionada" })).getByText(
        "2.ª corda · casa 1",
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Escalas" }));
    expect(screen.getByLabelText("Família")).toHaveValue("natural-minor");
    expect(screen.getByLabelText("Leitura")).toHaveValue("notes");
    await user.selectOptions(screen.getByLabelText("Tónica"), "Bb");
    auth.user = { uid: "new-account" };
    view.rerender(<TheoryPage />);
    expect(screen.getByRole("button", { name: "Notas" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Nota de referência")).toHaveValue("C");
    auth.user = null;
    view.rerender(<TheoryPage />);
    await user.selectOptions(screen.getByLabelText("Nota de referência"), "A");
    auth.user = { uid: "musician" };
    view.rerender(<TheoryPage />);
    expect(screen.getByRole("heading", { name: "C# · Pentatónica menor" })).toBeInTheDocument();
    expect(screen.getByLabelText("Leitura")).toHaveValue("degrees");
    expect(loadTheoryPreferences("second")).toEqual({
      mode: "scales",
      tonic: "Bb",
      family: "natural-minor",
      reading: "notes",
    });
    expect(loadTheoryPreferences("new-account").tonic).toBe("C");
  });

  it.each(["invalid", "get", "set", "access"])(
    "continues exploring in memory after a storage failure: %s",
    async (failure) => {
      const user = userEvent.setup();
      const fail = () => {
        throw new DOMException("Unavailable", "SecurityError");
      };
      if (failure === "invalid") localStorage.setItem("songpad:theory:musician", "{bad-json");
      if (failure === "get") vi.spyOn(Storage.prototype, "getItem").mockImplementation(fail);
      if (failure === "set") vi.spyOn(Storage.prototype, "setItem").mockImplementation(fail);
      if (failure === "access") vi.spyOn(window, "localStorage", "get").mockImplementation(fail);
      render(<TheoryPage />);
      expect(screen.getByLabelText("Nota de referência")).toHaveValue("C");
      await user.click(screen.getByRole("button", { name: "Escalas" }));
      await user.selectOptions(screen.getByLabelText("Tónica"), "Db");
      await user.selectOptions(screen.getByLabelText("Família"), "major-pentatonic");
      await user.selectOptions(screen.getByLabelText("Leitura"), "degrees");
      const ab = screen.getByRole("button", { name: "Ab3, 3.ª corda, casa 1, grau 5" });
      await user.click(ab);
      expect(ab).toHaveAttribute("aria-pressed", "true");
      expect(ab).toHaveTextContent("5");
      expect(
        within(screen.getByRole("region", { name: "Posição seleccionada" })).getByText(
          "Quinta justa · 7 semitons",
        ),
      ).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Intervalos" }));
      expect(screen.getByRole("heading", { name: "Db → Ab" })).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Notas" }));
      expect(screen.getByRole("heading", { name: "Encontra Db" })).toBeInTheDocument();
    },
  );

  it("renders defaults without storage access and hydrates stored settings in Strict Mode", () => {
    const saved = { mode: "scales", tonic: "C#", family: "major", reading: "degrees" } as const;
    saveTheoryPreferences("musician", saved);
    const storage = vi.spyOn(window, "localStorage", "get");
    const container = document.createElement("div");
    document.body.appendChild(container);
    container.innerHTML = renderToString(
      <StrictMode>
        <TheoryPage />
      </StrictMode>,
    );
    expect(storage).not.toHaveBeenCalled();
    expect(within(container).getByRole("heading", { name: "Encontra C" })).toBeInTheDocument();
    const onRecoverableError = vi.fn();
    render(
      <StrictMode>
        <TheoryPage />
      </StrictMode>,
      { container, hydrate: true, onRecoverableError },
    );
    expect(within(container).getByRole("heading", { name: "C# · Maior" })).toBeInTheDocument();
    expect(within(container).getByLabelText("Leitura")).toHaveValue("degrees");
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(loadTheoryPreferences("musician")).toEqual(saved);
  });
  it.each(["Notas", "Intervalos", "Escalas"])(
    "reopens %s with all four settings and resets transient positions",
    async (mode) => {
      const user = userEvent.setup();
      const first = render(<TheoryPage />);
      await user.click(screen.getByRole("button", { name: "Escalas" }));
      await user.selectOptions(screen.getByLabelText("Tónica"), "Db");
      await user.selectOptions(screen.getByLabelText("Família"), "minor-pentatonic");
      await user.selectOptions(screen.getByLabelText("Leitura"), "degrees");
      await user.click(screen.getByRole("button", { name: "Ab3, 3.ª corda, casa 1, grau 5" }));
      await user.click(screen.getByRole("button", { name: mode }));
      first.unmount();
      render(<TheoryPage />);
      expect(screen.getByRole("button", { name: mode })).toHaveAttribute("aria-pressed", "true");
      expect(
        screen.getByLabelText(mode === "Escalas" ? "Tónica" : "Nota de referência"),
      ).toHaveValue("Db");
      const details = screen.getByRole("region", { name: "Posição seleccionada" });
      expect(within(details).getByText("2.ª corda · casa 1")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Escalas" }));
      expect(screen.getByLabelText("Família")).toHaveValue("minor-pentatonic");
      expect(screen.getByLabelText("Leitura")).toHaveValue("degrees");
      expect(screen.getByRole("heading", { name: "Db · Pentatónica menor" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Ab3, 3.ª corda, casa 1, grau 5" }),
      ).toHaveTextContent("5");
    },
  );
});
