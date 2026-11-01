import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TheoryPage from "@/app/theory/page";
import SongsPage from "@/app/songs/page";
import SetlistsPage from "@/app/setlists/page";
import { AuthGuard } from "@/components/AuthGuard";

const auth = vi.hoisted(() => ({ user: null as { uid: string } | null, loading: false }));
const replace = vi.hoisted(() => vi.fn());
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/theory",
  useRouter: () => ({ replace }),
}));
vi.mock("@/hooks/useSongs", () => ({ useSongs: () => [] }));
vi.mock("@/hooks/useSetlists", () => ({ useSetlists: () => [] }));

beforeEach(() => {
  auth.user = null;
  auth.loading = false;
  replace.mockClear();
});

describe("Teoria access", () => {
  it.each([
    ["Músicas", SongsPage],
    ["Setlists", SetlistsPage],
  ])("links from %s to Teoria", (_title, Page) => {
    render(<Page />);
    expect(screen.getByRole("link", { name: "Teoria" })).toHaveAttribute("href", "/theory");
  });

  it("returns to both library pages", () => {
    render(<TheoryPage />);
    expect(screen.getByRole("link", { name: "← Músicas" })).toHaveAttribute("href", "/songs");
    expect(screen.getByRole("link", { name: "Setlists" })).toHaveAttribute("href", "/setlists");
  });

  it("protects direct access with the existing route guard", () => {
    const { rerender } = render(
      <AuthGuard>
        <TheoryPage />
      </AuthGuard>,
    );
    expect(replace).toHaveBeenCalledWith("/login");
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    auth.loading = true;
    rerender(
      <AuthGuard>
        <TheoryPage />
      </AuthGuard>,
    );
    expect(screen.getByRole("status", { name: "A carregar" })).toBeInTheDocument();
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    auth.user = { uid: "musician" };
    auth.loading = false;
    rerender(
      <AuthGuard>
        <TheoryPage />
      </AuthGuard>,
    );
    expect(screen.getByRole("grid", { name: "Braço da guitarra" })).toBeInTheDocument();
  });
});
