import { describe, expect, it } from "vitest";
import { highlightsMarkdown, parseImportPayload, sessionsMarkdown, sourcesMarkdown } from "./exportUtils";
import { Flashcard, HighlightNote, SavedSource, StudySession } from "./types";

function makeSource(overrides: Partial<SavedSource> = {}): SavedSource {
  return {
    id: "s1",
    title: "Test Article",
    url: "https://example.com/page",
    domain: "example.com",
    sourceType: "article",
    accessedAt: new Date().toISOString(),
    tags: ["tag1"],
    citationDraft: "Test citation.",
    course: "Chemistry",
    ...overrides
  };
}

function makeHighlight(overrides: Partial<HighlightNote> = {}): HighlightNote {
  return {
    id: "h1",
    url: "https://example.com",
    pageTitle: "Example Page",
    selectedText: "Important concept",
    tags: ["key"],
    createdAt: new Date().toISOString(),
    course: "Chemistry",
    ...overrides
  };
}

function makeSession(overrides: Partial<StudySession> = {}): StudySession {
  return {
    id: "sess1",
    course: "Chemistry",
    task: "Final Review",
    goal: "Study hard",
    durationMinutes: 60,
    startTime: new Date(Date.now() - 50 * 60_000).toISOString(),
    endTime: new Date().toISOString(),
    status: "completed",
    strictness: "normal",
    mode: "blocklist",
    blockedDomains: [],
    allowedDomains: [],
    blockedAttemptCount: 3,
    bypassCount: 1,
    sourcesSavedCount: 2,
    notesCreatedCount: 1,
    flashcardsCreatedCount: 5,
    tabGroupsSavedCount: 0,
    ...overrides
  };
}

describe("sourcesMarkdown", () => {
  it("includes source title", () => {
    expect(sourcesMarkdown([makeSource()])).toContain("Test Article");
  });

  it("includes course", () => {
    expect(sourcesMarkdown([makeSource({ course: "Biology" })])).toContain("Biology");
  });

  it("includes citation draft", () => {
    expect(sourcesMarkdown([makeSource()])).toContain("Test citation.");
  });

  it("includes URL", () => {
    expect(sourcesMarkdown([makeSource()])).toContain("https://example.com/page");
  });

  it("includes note when present", () => {
    expect(sourcesMarkdown([makeSource({ note: "Great reference" })])).toContain("Great reference");
  });

  it("handles empty array", () => {
    expect(sourcesMarkdown([])).toBe("");
  });
});

describe("highlightsMarkdown", () => {
  it("includes selected text", () => {
    expect(highlightsMarkdown([makeHighlight()])).toContain("Important concept");
  });

  it("includes page title", () => {
    expect(highlightsMarkdown([makeHighlight()])).toContain("Example Page");
  });

  it("includes note when present", () => {
    expect(highlightsMarkdown([makeHighlight({ note: "Key insight" })])).toContain("Key insight");
  });

  it("includes URL", () => {
    expect(highlightsMarkdown([makeHighlight()])).toContain("https://example.com");
  });

  it("handles empty array", () => {
    expect(highlightsMarkdown([])).toBe("");
  });
});

describe("sessionsMarkdown", () => {
  it("includes course and task", () => {
    const md = sessionsMarkdown([makeSession()]);
    expect(md).toContain("Chemistry");
    expect(md).toContain("Final Review");
  });

  it("includes blocked attempts count", () => {
    const md = sessionsMarkdown([makeSession({ blockedAttemptCount: 7 })]);
    expect(md).toContain("7");
  });

  it("includes bypass count", () => {
    const md = sessionsMarkdown([makeSession({ bypassCount: 2 })]);
    expect(md).toContain("2");
  });

  it("includes reflection when present", () => {
    const md = sessionsMarkdown([makeSession({ reflection: "Learned a lot today" })]);
    expect(md).toContain("Learned a lot today");
  });

  it("omits reflection section when absent", () => {
    const md = sessionsMarkdown([makeSession({ reflection: undefined })]);
    expect(md).not.toContain("Reflection:");
  });

  it("handles empty array", () => {
    expect(sessionsMarkdown([])).toBe("");
  });

  it("produces valid Markdown with ## headers", () => {
    const md = sessionsMarkdown([makeSession()]);
    expect(md).toMatch(/^##\s/);
  });

  it("includes tab groups saved count", () => {
    const md = sessionsMarkdown([makeSession({ tabGroupsSavedCount: 3 })]);
    expect(md).toContain("Tab groups saved: 3");
  });
});

const validImportBase = {
  sessions: [],
  attempts: [],
  sources: [],
  highlights: [],
  flashcards: [],
  tabGroups: []
};

describe("parseImportPayload", () => {
  it("returns null for null", () => {
    expect(parseImportPayload(null)).toBeNull();
  });

  it("returns null for a non-object", () => {
    expect(parseImportPayload("string")).toBeNull();
    expect(parseImportPayload(42)).toBeNull();
  });

  it("returns null when a required array is missing", () => {
    const { sessions: _s, ...withoutSessions } = validImportBase;
    expect(parseImportPayload(withoutSessions)).toBeNull();
  });

  it("returns null when a required key is not an array", () => {
    expect(parseImportPayload({ ...validImportBase, sessions: "not-array" })).toBeNull();
  });

  it("parses valid old-format export (no schemaVersion or settings)", () => {
    const result = parseImportPayload(validImportBase);
    expect(result).not.toBeNull();
    expect(result?.sessions).toEqual([]);
    expect(result?.settings).toBeUndefined();
  });

  it("parses valid new-format export with schemaVersion and settings", () => {
    const withMeta = {
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      ...validImportBase,
      settings: { defaultBlockedDomains: ["reddit.com"], defaultSessionLength: 60 }
    };
    const result = parseImportPayload(withMeta);
    expect(result).not.toBeNull();
    expect(result?.settings).toBeDefined();
  });

  it("ignores non-object settings field", () => {
    const result = parseImportPayload({ ...validImportBase, settings: "invalid" });
    expect(result).not.toBeNull();
    expect(result?.settings).toBeUndefined();
  });

  it("returns skippedCount of 0 when all items are valid", () => {
    const result = parseImportPayload(validImportBase);
    expect(result?.skippedCount).toBe(0);
  });

  it("skips sessions with no string id and counts them", () => {
    const payload = {
      ...validImportBase,
      sessions: [
        { id: "s1", course: "Bio", task: "Review", status: "completed", durationMinutes: 60 }, // valid
        { id: "s2", course: "Bio" }, // id only — accepted, normalized with defaults
        { not: "a session at all" }  // no id — rejected
      ]
    };
    const result = parseImportPayload(payload);
    expect(result?.sessions).toHaveLength(2);
    expect(result?.skippedCount).toBe(1);
  });

  it("skips highlights missing required fields", () => {
    const payload = {
      ...validImportBase,
      highlights: [
        { id: "h1", url: "https://example.com", selectedText: "Good" }, // valid
        { id: "h2", url: "https://example.com" }, // missing selectedText
        "not an object" // wrong type
      ]
    };
    const result = parseImportPayload(payload);
    expect(result?.highlights).toHaveLength(1);
    expect(result?.skippedCount).toBe(2);
  });

  it("skips flashcards missing required fields", () => {
    const payload = {
      ...validImportBase,
      flashcards: [
        { id: "f1", front: "Q", back: "A" }, // valid
        { id: "f2", front: "Q only" }         // missing back
      ]
    };
    const result = parseImportPayload(payload);
    expect(result?.flashcards).toHaveLength(1);
    expect(result?.skippedCount).toBe(1);
  });

  it("skips tabGroups with non-array tabs", () => {
    const payload = {
      ...validImportBase,
      tabGroups: [
        { id: "tg1", courseName: "Chem", tabs: [] },  // valid
        { id: "tg2", courseName: "Chem", tabs: null } // null tabs
      ]
    };
    const result = parseImportPayload(payload);
    expect(result?.tabGroups).toHaveLength(1);
    expect(result?.skippedCount).toBe(1);
  });
});

describe("markdown handles special characters", () => {
  it("includes text with commas and quotes without breaking Markdown", () => {
    const source = makeSource({ title: 'Article about "ATP" and, Energy', note: "Use: x > y" });
    const md = sourcesMarkdown([source]);
    expect(md).toContain('"ATP"');
    expect(md).toContain("Use: x > y");
  });

  it("includes multi-line notes in highlights", () => {
    const highlight = makeHighlight({ note: "Line 1\nLine 2" });
    const md = highlightsMarkdown([highlight]);
    expect(md).toContain("Line 1");
    expect(md).toContain("Line 2");
  });
});
