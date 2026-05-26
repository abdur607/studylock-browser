import { describe, expect, it } from "vitest";
import { includesQuery } from "./searchUtils";

describe("includesQuery", () => {
  it("returns true when empty query", () => {
    expect(includesQuery(["anything"], "")).toBe(true);
  });

  it("matches a value case-insensitively", () => {
    expect(includesQuery(["Chemistry Final"], "chemistry")).toBe(true);
    expect(includesQuery(["Chemistry Final"], "FINAL")).toBe(true);
  });

  it("returns true when any value matches", () => {
    expect(includesQuery(["Biology", "Chapter 4", "evolution"], "chapter")).toBe(true);
  });

  it("returns false when no value matches", () => {
    expect(includesQuery(["Physics", "Quantum"], "chemistry")).toBe(false);
  });

  it("skips null and undefined values without throwing", () => {
    expect(includesQuery([undefined, null, "Matching value"], "matching")).toBe(true);
    expect(includesQuery([undefined, null], "anything")).toBe(false);
  });

  it("handles empty values array", () => {
    expect(includesQuery([], "query")).toBe(false);
  });

  it("matches partial strings", () => {
    expect(includesQuery(["https://openstax.org/books/chemistry"], "openstax")).toBe(true);
  });
});
