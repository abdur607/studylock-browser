import { describe, expect, it } from "vitest";
import { findHighlightRelationships, findSourceRelationships } from "./sourceRelationships";
import { Flashcard, HighlightNote } from "./types";

function makeHighlight(overrides: Partial<HighlightNote> = {}): HighlightNote {
  return {
    id: "h1",
    sourceId: "src1",
    url: "https://example.com",
    pageTitle: "Example",
    selectedText: "Important text",
    tags: [],
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

function makeFlashcard(overrides: Partial<Flashcard> = {}): Flashcard {
  return {
    id: "f1",
    front: "Question",
    back: "Answer",
    tags: [],
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

describe("findSourceRelationships", () => {
  it("returns empty arrays when nothing is related", () => {
    const result = findSourceRelationships("src1", [], []);
    expect(result.relatedHighlights).toEqual([]);
    expect(result.directFlashcards).toEqual([]);
    expect(result.indirectFlashcards).toEqual([]);
    expect(result.allRelatedFlashcards).toEqual([]);
  });

  it("finds highlights by sourceId", () => {
    const h1 = makeHighlight({ id: "h1", sourceId: "src1" });
    const h2 = makeHighlight({ id: "h2", sourceId: "src2" });
    const result = findSourceRelationships("src1", [h1, h2], []);
    expect(result.relatedHighlights).toHaveLength(1);
    expect(result.relatedHighlights[0].id).toBe("h1");
  });

  it("finds direct flashcards by sourceId", () => {
    const f1 = makeFlashcard({ id: "f1", sourceId: "src1" });
    const f2 = makeFlashcard({ id: "f2", sourceId: "src2" });
    const result = findSourceRelationships("src1", [], [f1, f2]);
    expect(result.directFlashcards).toHaveLength(1);
    expect(result.directFlashcards[0].id).toBe("f1");
  });

  it("finds indirect flashcards via highlight chain", () => {
    const h1 = makeHighlight({ id: "h1", sourceId: "src1" });
    const f1 = makeFlashcard({ id: "f1", highlightId: "h1" }); // indirect: no sourceId but linked to highlight
    const result = findSourceRelationships("src1", [h1], [f1]);
    expect(result.indirectFlashcards).toHaveLength(1);
    expect(result.indirectFlashcards[0].id).toBe("f1");
  });

  it("does not double-count a flashcard with both sourceId and highlightId", () => {
    const h1 = makeHighlight({ id: "h1", sourceId: "src1" });
    const f1 = makeFlashcard({ id: "f1", sourceId: "src1", highlightId: "h1" });
    const result = findSourceRelationships("src1", [h1], [f1]);
    expect(result.directFlashcards).toHaveLength(1);
    expect(result.indirectFlashcards).toHaveLength(0);
    expect(result.allRelatedFlashcards).toHaveLength(1);
  });

  it("allRelatedFlashcards is the union of direct and indirect", () => {
    const h1 = makeHighlight({ id: "h1", sourceId: "src1" });
    const f1 = makeFlashcard({ id: "f1", sourceId: "src1" }); // direct
    const f2 = makeFlashcard({ id: "f2", highlightId: "h1" }); // indirect
    const f3 = makeFlashcard({ id: "f3", sourceId: "src2" }); // unrelated
    const result = findSourceRelationships("src1", [h1], [f1, f2, f3]);
    expect(result.allRelatedFlashcards).toHaveLength(2);
    const ids = result.allRelatedFlashcards.map((f) => f.id);
    expect(ids).toContain("f1");
    expect(ids).toContain("f2");
    expect(ids).not.toContain("f3");
  });

  it("ignores flashcards linked to highlights of other sources", () => {
    const h1 = makeHighlight({ id: "h1", sourceId: "src1" });
    const h2 = makeHighlight({ id: "h2", sourceId: "src2" });
    const f1 = makeFlashcard({ id: "f1", highlightId: "h2" }); // linked to src2's highlight
    const result = findSourceRelationships("src1", [h1, h2], [f1]);
    expect(result.indirectFlashcards).toHaveLength(0);
  });
});

describe("findHighlightRelationships", () => {
  it("returns empty array when no flashcards are linked", () => {
    const result = findHighlightRelationships("h1", []);
    expect(result).toEqual([]);
  });

  it("returns flashcards linked by highlightId", () => {
    const f1 = makeFlashcard({ id: "f1", highlightId: "h1" });
    const f2 = makeFlashcard({ id: "f2", highlightId: "h2" });
    const result = findHighlightRelationships("h1", [f1, f2]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("f1");
  });

  it("returns multiple flashcards linked to the same highlight", () => {
    const f1 = makeFlashcard({ id: "f1", highlightId: "h1" });
    const f2 = makeFlashcard({ id: "f2", highlightId: "h1" });
    const f3 = makeFlashcard({ id: "f3", highlightId: "h2" });
    const result = findHighlightRelationships("h1", [f1, f2, f3]);
    expect(result).toHaveLength(2);
    const ids = result.map((f) => f.id);
    expect(ids).toContain("f1");
    expect(ids).toContain("f2");
  });

  it("does not include flashcards with sourceId but no highlightId match", () => {
    const f1 = makeFlashcard({ id: "f1", sourceId: "src1" }); // no highlightId
    const result = findHighlightRelationships("h1", [f1]);
    expect(result).toHaveLength(0);
  });

  it("unrelated flashcards are not affected", () => {
    const f1 = makeFlashcard({ id: "f1", highlightId: "h1" });
    const f2 = makeFlashcard({ id: "f2", highlightId: "h9" });
    const result = findHighlightRelationships("h1", [f1, f2]);
    const ids = result.map((f) => f.id);
    expect(ids).not.toContain("f2");
  });
});
