import { describe, expect, it } from "vitest";
import { buildActivity } from "./recentActivity";
import { BlockedAttempt, Flashcard, HighlightNote, SavedSource, StudySession, TabGroup } from "./types";

function makeSession(overrides: Partial<StudySession> = {}): StudySession {
  return {
    id: "s1",
    course: "Chemistry",
    task: "Review",
    durationMinutes: 60,
    startTime: new Date(Date.now() - 10 * 60_000).toISOString(),
    status: "active",
    strictness: "normal",
    mode: "blocklist",
    blockedDomains: [],
    allowedDomains: [],
    blockedAttemptCount: 0,
    bypassCount: 0,
    sourcesSavedCount: 0,
    notesCreatedCount: 0,
    flashcardsCreatedCount: 0,
    tabGroupsSavedCount: 0,
    ...overrides
  };
}

function makeSource(overrides: Partial<SavedSource> = {}): SavedSource {
  return {
    id: "src1",
    title: "OpenStax Chemistry",
    url: "https://openstax.org",
    domain: "openstax.org",
    sourceType: "textbook",
    accessedAt: new Date().toISOString(),
    tags: [],
    citationDraft: "OpenStax. 2024.",
    ...overrides
  };
}

function makeHighlight(overrides: Partial<HighlightNote> = {}): HighlightNote {
  return {
    id: "h1",
    url: "https://example.com",
    pageTitle: "Example",
    selectedText: "Selected text",
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

function makeTabGroup(overrides: Partial<TabGroup> = {}): TabGroup {
  return {
    id: "tg1",
    courseName: "Chemistry",
    name: "Study tabs",
    tabs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}

function makeAttempt(overrides: Partial<BlockedAttempt> = {}): BlockedAttempt {
  return {
    id: "a1",
    sessionId: "s1",
    domain: "reddit.com",
    url: "https://reddit.com",
    timestamp: new Date().toISOString(),
    modeTriggered: "blocklist",
    bypassed: false,
    ...overrides
  };
}

describe("buildActivity", () => {
  it("returns empty array when all inputs are empty", () => {
    expect(buildActivity([], [], [], [], [], [])).toEqual([]);
  });

  it("includes sessions, sources, highlights, flashcards, tab groups, attempts", () => {
    const items = buildActivity(
      [makeSession()],
      [makeSource()],
      [makeHighlight()],
      [makeFlashcard()],
      [makeTabGroup()],
      [makeAttempt()]
    );
    expect(items.length).toBeGreaterThanOrEqual(5);
  });

  it("respects maxItems limit", () => {
    const sessions = [
      makeSession({ id: "s1", startTime: new Date(Date.now() - 1000).toISOString() }),
      makeSession({ id: "s2", startTime: new Date(Date.now() - 2000).toISOString() }),
      makeSession({ id: "s3", startTime: new Date(Date.now() - 3000).toISOString() })
    ];
    const result = buildActivity(sessions, [], [], [], [], [], 2);
    expect(result).toHaveLength(2);
  });

  it("sorts items by timestamp descending (most recent first)", () => {
    const older = makeSession({ id: "s1", startTime: new Date(Date.now() - 10_000).toISOString() });
    const newer = makeSource({ id: "src1", accessedAt: new Date(Date.now() - 1_000).toISOString() });
    const items = buildActivity([older], [newer], [], [], [], []);
    expect(items[0].id).toBe("src1");
    expect(items[1].id).toBe("s1");
  });

  it("filters out items with empty timestamps", () => {
    const noTimestamp = makeSession({ id: "s1", startTime: undefined });
    const withTimestamp = makeSource({ id: "src1", accessedAt: new Date().toISOString() });
    const items = buildActivity([noTimestamp], [withTimestamp], [], [], [], []);
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("src1");
  });

  it("only shows filtered data — passing a subset filters activity", () => {
    const chemSession = makeSession({ id: "s1", course: "Chemistry" });
    const bioSession = makeSession({ id: "s2", course: "Biology", startTime: new Date(Date.now() - 5000).toISOString() });
    const items = buildActivity([chemSession], [], [], [], [], []); // only Chemistry passed
    expect(items.every((item) => item.id !== "s2")).toBe(true);
  });

  it("truncates long selected text in highlight subLabel", () => {
    const longText = "a".repeat(100);
    const h = makeHighlight({ selectedText: longText });
    const items = buildActivity([], [], [h], [], [], []);
    expect(items[0].subLabel.length).toBeLessThanOrEqual(72); // 70 chars + "…"
  });

  it("truncates long flashcard front in label", () => {
    const longFront = "Q".repeat(100);
    const f = makeFlashcard({ front: longFront });
    const items = buildActivity([], [], [], [f], [], []);
    expect(items[0].label.length).toBeLessThanOrEqual(75); // "Flashcard: " + 60 chars + "…"
  });
});
