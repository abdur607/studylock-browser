import { describe, expect, it } from "vitest";
import { buildAnalytics, filterAttemptsBySessionIds } from "./analytics";
import { BlockedAttempt, Flashcard, HighlightNote, SavedSource, StudySession, TabGroup } from "./types";

function makeSession(overrides: Partial<StudySession> = {}): StudySession {
  return {
    id: "s1",
    course: "Chemistry",
    task: "Review",
    durationMinutes: 60,
    startTime: new Date(Date.now() - 50 * 60_000).toISOString(),
    endTime: new Date(Date.now() - 10 * 60_000).toISOString(),
    status: "completed",
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

const emptyData = {
  sessions: [],
  attempts: [],
  sources: [],
  highlights: [],
  flashcards: [],
  tabGroups: []
};

describe("buildAnalytics — empty data", () => {
  it("returns zeros for empty data", () => {
    const result = buildAnalytics(emptyData);
    expect(result.totalFocusedTime).toBe(0);
    expect(result.sessionsCompleted).toBe(0);
    expect(result.blockedAttempts).toBe(0);
    expect(result.bypassAttempts).toBe(0);
    expect(result.sourcesSaved).toBe(0);
    expect(result.highlightsCreated).toBe(0);
    expect(result.flashcardsCreated).toBe(0);
  });
});

describe("buildAnalytics — sessions", () => {
  it("counts only completed sessions", () => {
    const active = makeSession({ id: "s2", status: "active", endTime: undefined });
    const completed = makeSession({ id: "s1", status: "completed" });
    const result = buildAnalytics({ ...emptyData, sessions: [active, completed] });
    expect(result.sessionsCompleted).toBe(1);
  });

  it("calculates total focused time", () => {
    const s1 = makeSession({ id: "s1", startTime: new Date(Date.now() - 40 * 60_000).toISOString(), endTime: new Date().toISOString() });
    const s2 = makeSession({ id: "s2", startTime: new Date(Date.now() - 20 * 60_000).toISOString(), endTime: new Date().toISOString() });
    const result = buildAnalytics({ ...emptyData, sessions: [s1, s2] });
    expect(result.totalFocusedTime).toBeGreaterThan(55);
    expect(result.totalFocusedTime).toBeLessThan(65);
  });

  it("tracks focus minutes per course", () => {
    const chemistry = makeSession({ id: "s1", course: "Chemistry" });
    const biology = makeSession({ id: "s2", course: "Biology", startTime: new Date(Date.now() - 30 * 60_000).toISOString(), endTime: new Date().toISOString() });
    const result = buildAnalytics({ ...emptyData, sessions: [chemistry, biology] });
    expect(result.focusMinutesByCourse["Chemistry"]).toBeGreaterThan(0);
    expect(result.focusMinutesByCourse["Biology"]).toBeGreaterThan(0);
  });
});

describe("buildAnalytics — blocked attempts", () => {
  it("counts total blocked attempts", () => {
    const a1 = makeAttempt({ id: "a1" });
    const a2 = makeAttempt({ id: "a2" });
    const result = buildAnalytics({ ...emptyData, attempts: [a1, a2] });
    expect(result.blockedAttempts).toBe(2);
  });

  it("counts bypass attempts separately", () => {
    const bypassed = makeAttempt({ id: "a1", bypassed: true });
    const notBypassed = makeAttempt({ id: "a2", bypassed: false });
    const result = buildAnalytics({ ...emptyData, attempts: [bypassed, notBypassed] });
    expect(result.bypassAttempts).toBe(1);
  });

  it("identifies most blocked domains", () => {
    const a1 = makeAttempt({ id: "a1", domain: "reddit.com" });
    const a2 = makeAttempt({ id: "a2", domain: "reddit.com" });
    const a3 = makeAttempt({ id: "a3", domain: "twitter.com" });
    const result = buildAnalytics({ ...emptyData, attempts: [a1, a2, a3] });
    expect(result.mostBlockedDomains[0][0]).toBe("reddit.com");
    expect(result.mostBlockedDomains[0][1]).toBe(2);
  });
});

describe("buildAnalytics — counts", () => {
  it("counts sources, highlights, flashcards, tab groups", () => {
    const source: SavedSource = { id: "src1", title: "T", url: "u", domain: "d", sourceType: "webpage", accessedAt: "", tags: [], citationDraft: "" };
    const highlight: HighlightNote = { id: "h1", url: "u", pageTitle: "P", selectedText: "text", tags: [], createdAt: "" };
    const flashcard: Flashcard = { id: "f1", front: "Q", back: "A", tags: [], createdAt: "" };
    const tabGroup: TabGroup = { id: "g1", courseName: "Chemistry", name: "group", tabs: [], createdAt: "", updatedAt: "" };
    const result = buildAnalytics({ ...emptyData, sources: [source], highlights: [highlight], flashcards: [flashcard], tabGroups: [tabGroup] });
    expect(result.sourcesSaved).toBe(1);
    expect(result.highlightsCreated).toBe(1);
    expect(result.flashcardsCreated).toBe(1);
    expect(result.tabGroupsSaved).toBe(1);
  });
});

describe("filterAttemptsBySessionIds", () => {
  it("returns only attempts whose sessionId is in the set", () => {
    const a1 = makeAttempt({ id: "a1", sessionId: "s1" });
    const a2 = makeAttempt({ id: "a2", sessionId: "s2" });
    const a3 = makeAttempt({ id: "a3", sessionId: "s3" });
    const result = filterAttemptsBySessionIds([a1, a2, a3], new Set(["s1", "s3"]));
    expect(result).toHaveLength(2);
    expect(result.map((a) => a.id)).toEqual(["a1", "a3"]);
  });

  it("returns empty array when no session IDs match", () => {
    const a1 = makeAttempt({ id: "a1", sessionId: "s1" });
    const result = filterAttemptsBySessionIds([a1], new Set(["s99"]));
    expect(result).toHaveLength(0);
  });

  it("returns all attempts when all session IDs match", () => {
    const a1 = makeAttempt({ id: "a1", sessionId: "s1" });
    const a2 = makeAttempt({ id: "a2", sessionId: "s1" });
    const result = filterAttemptsBySessionIds([a1, a2], new Set(["s1"]));
    expect(result).toHaveLength(2);
  });

  it("returns empty array for empty input", () => {
    expect(filterAttemptsBySessionIds([], new Set(["s1"]))).toHaveLength(0);
  });
});
