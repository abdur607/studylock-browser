import { describe, expect, it } from "vitest";
import { accessedDate, createCitationDraft } from "./citationHelper";

const FIXED_DATE = new Date("2025-11-15T12:00:00Z");

describe("accessedDate", () => {
  it("formats date correctly", () => {
    expect(accessedDate(FIXED_DATE)).toBe("15 November 2025");
  });
});

describe("createCitationDraft", () => {
  it("includes title", () => {
    const result = createCitationDraft("My Article", "example.com", "https://example.com/page", {}, FIXED_DATE);
    expect(result).toContain('"My Article."');
  });

  it("uses domain when no publisher", () => {
    const result = createCitationDraft("Article", "example.com", "https://example.com", {}, FIXED_DATE);
    expect(result).toContain("example.com");
  });

  it("uses publisher when provided", () => {
    const result = createCitationDraft("Article", "openstax.org", "https://openstax.org/chem", { publisher: "OpenStax" }, FIXED_DATE);
    expect(result).toContain("OpenStax");
    expect(result).not.toMatch(/openstax\.org,/);
  });

  it("includes accessed date", () => {
    const result = createCitationDraft("Article", "example.com", "https://example.com", {}, FIXED_DATE);
    expect(result).toContain("Accessed 15 November 2025");
  });

  it("includes URL", () => {
    const result = createCitationDraft("Article", "example.com", "https://example.com/path", {}, FIXED_DATE);
    expect(result).toContain("https://example.com/path");
  });

  it("handles missing title safely", () => {
    const result = createCitationDraft("", "example.com", "https://example.com", {}, FIXED_DATE);
    expect(result).toContain('"Untitled Page."');
  });

  it("includes author when provided", () => {
    const result = createCitationDraft("Article", "example.com", "https://example.com", { author: "Jane Doe" }, FIXED_DATE);
    expect(result).toMatch(/^Jane Doe,/);
  });

  it("includes published date when provided", () => {
    const result = createCitationDraft("Article", "example.com", "https://example.com", { publishedDate: "2024" }, FIXED_DATE);
    expect(result).toContain(", 2024,");
  });
});
