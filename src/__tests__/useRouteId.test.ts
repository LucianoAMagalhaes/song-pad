import { describe, expect, it } from "vitest";
import { extractRouteId } from "@/hooks/useRouteId";

describe("extractRouteId", () => {
  it("reads the id from a song view path", () => {
    expect(extractRouteId("/songs/abc-123")).toBe("abc-123");
  });

  it("reads the id from a song edit path", () => {
    expect(extractRouteId("/songs/abc-123/edit")).toBe("abc-123");
  });

  it("reads the id from a setlist view path", () => {
    expect(extractRouteId("/setlists/xyz-789")).toBe("xyz-789");
  });

  it("reads the id from a setlist edit path", () => {
    expect(extractRouteId("/setlists/xyz-789/edit")).toBe("xyz-789");
  });

  it("tolerates a trailing slash", () => {
    expect(extractRouteId("/songs/abc-123/")).toBe("abc-123");
  });

  it("returns undefined when there is no id segment", () => {
    expect(extractRouteId("/songs")).toBeUndefined();
  });
});
