import { describe, expect, it } from "vitest";
import { normalizeImportPayload, normalizeImportedSettings } from "./importUtils";
import { ImportPayload } from "./exportUtils";
import { BlockedAttempt, Flashcard, HighlightNote, SavedSource, Settings, StudySession, TabGroup } from "./types";
import { defaultSettings } from "./storage";

function makePayload(overrides: Partial<ImportPayload> = {}): ImportPayload {
  return {
    sessions: [],
    attempts: [],
    sources: [],
    highlights: [],
    flashcards: [],
    tabGroups: [],
    skippedCount: 0,
    ...overrides,
  };
}

function makeSession(overrides: Partial<StudySession> = {}): StudySession {
  return {
    id: "s1",
    course: "Chemistry",
    task: "Review",
    durationMinutes: 60,
    status: "completed",
    strictness: "normal",
    mode: "blocklist",
    blockedDomains: ["reddit.com"],
    allowedDomains: [],
    blockedAttemptCount: 0,
    bypassCount: 0,
    sourcesSavedCount: 0,
    notesCreatedCount: 0,
    flashcardsCreatedCount: 0,
    tabGroupsSavedCount: 0,
    ...overrides,
  };
}

function makeSource(overrides: Partial<SavedSource> = {}): SavedSource {
  return {
    id: "src1",
    title: "Test Article",
    url: "https://example.com/page",
    domain: "example.com",
    sourceType: "article",
    accessedAt: "2024-01-01T00:00:00.000Z",
    tags: [],
    citationDraft: "Test citation.",
    ...overrides,
  };
}

function makeHighlight(overrides: Partial<HighlightNote> = {}): HighlightNote {
  return {
    id: "h1",
    url: "https://example.com",
    pageTitle: "Example Page",
    selectedText: "Some text",
    tags: [],
    createdAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeFlashcard(overrides: Partial<Flashcard> = {}): Flashcard {
  return {
    id: "f1",
    front: "Question?",
    back: "Answer.",
    tags: [],
    createdAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeTabGroup(overrides: Partial<TabGroup> = {}): TabGroup {
  return {
    id: "tg1",
    courseName: "Chemistry",
    name: "Study Tabs",
    tabs: [{ title: "Page", url: "https://example.com", domain: "example.com" }],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeAttempt(overrides: Partial<BlockedAttempt> = {}): BlockedAttempt {
  return {
    id: "a1",
    sessionId: "s1",
    domain: "reddit.com",
    url: "https://reddit.com",
    timestamp: "2024-01-01T00:00:00.000Z",
    modeTriggered: "blocklist",
    bypassed: false,
    ...overrides,
  };
}

// ── normalizeImportPayload ────────────────────────────────────────────────────

describe("normalizeImportPayload — sessions", () => {
  it("converts active session to completed", () => {
    const session = makeSession({ status: "active", startTime: "2024-01-01T00:00:00.000Z" });
    const result = normalizeImportPayload(makePayload({ sessions: [session] }));
    expect(result.sessions[0].status).toBe("completed");
  });

  it("active session gets endTime if missing", () => {
    const session = makeSession({ status: "active", endTime: undefined });
    const result = normalizeImportPayload(makePayload({ sessions: [session] }));
    expect(result.sessions[0].endTime).toBeDefined();
  });

  it("preserves valid statuses unchanged", () => {
    const planned = makeSession({ status: "planned", endTime: undefined });
    const cancelled = makeSession({ id: "s2", status: "cancelled" });
    const result = normalizeImportPayload(makePayload({ sessions: [planned, cancelled] }));
    expect(result.sessions[0].status).toBe("planned");
    expect(result.sessions[1].status).toBe("cancelled");
  });

  it("invalid status falls back to completed", () => {
    const session = makeSession({ status: "unknown" as never });
    const result = normalizeImportPayload(makePayload({ sessions: [session] }));
    expect(result.sessions[0].status).toBe("completed");
  });

  it("invalid strictness falls back to normal", () => {
    const session = makeSession({ strictness: "extreme" as never });
    const result = normalizeImportPayload(makePayload({ sessions: [session] }));
    expect(result.sessions[0].strictness).toBe("normal");
  });

  it("missing counter fields default to 0", () => {
    const session = { ...makeSession(), tabGroupsSavedCount: undefined as unknown as number };
    const result = normalizeImportPayload(makePayload({ sessions: [session] }));
    expect(result.sessions[0].tabGroupsSavedCount).toBe(0);
  });

  it("missing durationMinutes defaults to 60", () => {
    const session = { ...makeSession(), durationMinutes: undefined as unknown as number };
    const result = normalizeImportPayload(makePayload({ sessions: [session] }));
    expect(result.sessions[0].durationMinutes).toBe(60);
  });
});

describe("normalizeImportPayload — sources", () => {
  it("derives domain from url if domain is missing", () => {
    const source = makeSource({ domain: "" });
    const result = normalizeImportPayload(makePayload({ sources: [source] }));
    expect(result.sources[0].domain).toBe("example.com");
  });

  it("skips source with unparseable url and increments skippedCount", () => {
    const source = makeSource({ url: "not-a-url", domain: "" });
    const result = normalizeImportPayload(makePayload({ sources: [source], skippedCount: 0 }));
    expect(result.sources).toHaveLength(0);
    expect(result.skippedCount).toBe(1);
  });

  it("invalid sourceType falls back to webpage", () => {
    const source = makeSource({ sourceType: "book" as never });
    const result = normalizeImportPayload(makePayload({ sources: [source] }));
    expect(result.sources[0].sourceType).toBe("webpage");
  });

  it("missing title falls back to Untitled Source", () => {
    const source = makeSource({ title: "" });
    const result = normalizeImportPayload(makePayload({ sources: [source] }));
    expect(result.sources[0].title).toBe("Untitled Source");
  });

  it("missing tags defaults to empty array", () => {
    const source = { ...makeSource(), tags: undefined as unknown as string[] };
    const result = normalizeImportPayload(makePayload({ sources: [source] }));
    expect(result.sources[0].tags).toEqual([]);
  });

  it("generates citationDraft when source has none", () => {
    const source = makeSource({ citationDraft: "" });
    const result = normalizeImportPayload(makePayload({ sources: [source] }));
    expect(result.sources[0].citationDraft).toBeTruthy();
    expect(result.sources[0].citationDraft).toContain("example.com");
  });

  it("preserves existing citationDraft without modification", () => {
    const source = makeSource({ citationDraft: "My custom citation." });
    const result = normalizeImportPayload(makePayload({ sources: [source] }));
    expect(result.sources[0].citationDraft).toBe("My custom citation.");
  });

  it("includes author, publisher, publishedDate in generated citation", () => {
    const source = makeSource({
      citationDraft: "",
      author: "Jane Smith",
      publisher: "OpenStax",
      publishedDate: "2023",
    });
    const result = normalizeImportPayload(makePayload({ sources: [source] }));
    const draft = result.sources[0].citationDraft;
    expect(draft).toContain("Jane Smith");
    expect(draft).toContain("OpenStax");
    expect(draft).toContain("2023");
  });

  it("uses original accessedAt date in generated citation, not current date", () => {
    // accessedAt is 2024 — current year is 2026+, so presence of "2024" proves the
    // normalizer used the stored date rather than new Date().
    const source = makeSource({ citationDraft: "", accessedAt: "2024-06-15T12:00:00.000Z" });
    const result = normalizeImportPayload(makePayload({ sources: [source] }));
    const draft = result.sources[0].citationDraft;
    expect(draft).toContain("2024");
    expect(draft).not.toContain("2025");
    expect(draft).not.toContain("2026");
  });
});

describe("normalizeImportPayload — highlights", () => {
  it("missing pageTitle defaults to Untitled Page", () => {
    const h = makeHighlight({ pageTitle: "" });
    const result = normalizeImportPayload(makePayload({ highlights: [h] }));
    expect(result.highlights[0].pageTitle).toBe("Untitled Page");
  });

  it("missing createdAt gets an ISO date", () => {
    const h = { ...makeHighlight(), createdAt: undefined as unknown as string };
    const result = normalizeImportPayload(makePayload({ highlights: [h] }));
    expect(result.highlights[0].createdAt).toMatch(/^\d{4}-/);
  });

  it("missing tags defaults to empty array", () => {
    const h = { ...makeHighlight(), tags: undefined as unknown as string[] };
    const result = normalizeImportPayload(makePayload({ highlights: [h] }));
    expect(result.highlights[0].tags).toEqual([]);
  });
});

describe("normalizeImportPayload — flashcards", () => {
  it("missing tags defaults to empty array", () => {
    const f = { ...makeFlashcard(), tags: undefined as unknown as string[] };
    const result = normalizeImportPayload(makePayload({ flashcards: [f] }));
    expect(result.flashcards[0].tags).toEqual([]);
  });

  it("missing createdAt gets an ISO date", () => {
    const f = { ...makeFlashcard(), createdAt: undefined as unknown as string };
    const result = normalizeImportPayload(makePayload({ flashcards: [f] }));
    expect(result.flashcards[0].createdAt).toMatch(/^\d{4}-/);
  });
});

describe("normalizeImportPayload — tabGroups", () => {
  it("missing name defaults to Saved Tabs", () => {
    const tg = makeTabGroup({ name: "" });
    const result = normalizeImportPayload(makePayload({ tabGroups: [tg] }));
    expect(result.tabGroups[0].name).toBe("Saved Tabs");
  });

  it("derives tab domain from url if missing", () => {
    const tg = makeTabGroup({ tabs: [{ title: "Page", url: "https://example.com", domain: "" }] });
    const result = normalizeImportPayload(makePayload({ tabGroups: [tg] }));
    expect(result.tabGroups[0].tabs[0].domain).toBe("example.com");
  });
});

describe("normalizeImportPayload — attempts", () => {
  it("missing timestamp gets an ISO date", () => {
    const a = { ...makeAttempt(), timestamp: undefined as unknown as string };
    const result = normalizeImportPayload(makePayload({ attempts: [a] }));
    expect(result.attempts[0].timestamp).toMatch(/^\d{4}-/);
  });

  it("invalid bypassType becomes undefined", () => {
    const a = makeAttempt({ bypassType: "extreme" as never });
    const result = normalizeImportPayload(makePayload({ attempts: [a] }));
    expect(result.attempts[0].bypassType).toBeUndefined();
  });

  it("invalid modeTriggered falls back to blocklist", () => {
    const a = makeAttempt({ modeTriggered: "unknown" as never });
    const result = normalizeImportPayload(makePayload({ attempts: [a] }));
    expect(result.attempts[0].modeTriggered).toBe("blocklist");
  });
});

describe("normalizeImportPayload — skippedCount", () => {
  it("preserves existing skippedCount when no normalization skips", () => {
    const result = normalizeImportPayload(makePayload({ skippedCount: 3 }));
    expect(result.skippedCount).toBe(3);
  });

  it("adds normalization skips to existing skippedCount", () => {
    const source = makeSource({ url: "not-a-url", domain: "" });
    const result = normalizeImportPayload(makePayload({ sources: [source], skippedCount: 2 }));
    expect(result.skippedCount).toBe(3);
  });
});

// ── relaxed parseImportPayload filters ───────────────────────────────────────

describe("normalizeImportPayload — relaxed session filter", () => {
  it("imports session with only id — fills course/task with defaults", () => {
    const session = { id: "s99" } as unknown as StudySession;
    const result = normalizeImportPayload(makePayload({ sessions: [session] }));
    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0].course).toBe("Unknown Course");
    expect(result.sessions[0].task).toBe("Untitled Task");
    expect(result.sessions[0].durationMinutes).toBe(60);
  });

  it("imports session missing durationMinutes — defaults to 60", () => {
    const session = { id: "s1", course: "Bio", task: "Lab", status: "completed" } as unknown as StudySession;
    const result = normalizeImportPayload(makePayload({ sessions: [session] }));
    expect(result.sessions[0].durationMinutes).toBe(60);
  });
});

describe("normalizeImportPayload — relaxed source filter", () => {
  it("imports legacy source with id + url but no title", () => {
    const source = { id: "s1", url: "https://openstax.org/books/chemistry" } as unknown as SavedSource;
    const result = normalizeImportPayload(makePayload({ sources: [source] }));
    expect(result.sources).toHaveLength(1);
    expect(result.sources[0].title).toBe("Untitled Source");
    expect(result.sources[0].domain).toBe("openstax.org");
    expect(result.sources[0].sourceType).toBe("webpage");
    expect(result.sources[0].tags).toEqual([]);
  });

  it("skips source with invalid URL", () => {
    const source = { id: "s1", url: "not-a-url" } as unknown as SavedSource;
    const result = normalizeImportPayload(makePayload({ sources: [source], skippedCount: 0 }));
    expect(result.sources).toHaveLength(0);
    expect(result.skippedCount).toBe(1);
  });
});

describe("normalizeImportPayload — relaxed tabGroup filter", () => {
  it("imports tab group without courseName — defaults to Untitled Group", () => {
    const tg = { id: "tg1", tabs: [] } as unknown as TabGroup;
    const result = normalizeImportPayload(makePayload({ tabGroups: [tg] }));
    expect(result.tabGroups).toHaveLength(1);
    expect(result.tabGroups[0].courseName).toBe("Untitled Group");
    expect(result.tabGroups[0].name).toBe("Saved Tabs");
  });

  it("skips only invalid tabs within a tab group, not the whole group", () => {
    const tg = makeTabGroup({
      tabs: [
        { title: "Good", url: "https://example.com", domain: "example.com" },
        { title: "Bad", url: undefined as unknown as string, domain: "" }
      ] as Array<{ title: string; url: string; domain: string }>
    });
    const result = normalizeImportPayload(makePayload({ tabGroups: [tg] }));
    expect(result.tabGroups).toHaveLength(1);
    expect(result.tabGroups[0].tabs).toHaveLength(1);
    expect(result.tabGroups[0].tabs[0].url).toBe("https://example.com");
  });
});

describe("normalizeImportPayload — relaxed attempt filter", () => {
  it("imports attempt with sessionId but missing url/domain — fills defaults", () => {
    const attempt = { id: "a1", sessionId: "s1" } as unknown as BlockedAttempt;
    const result = normalizeImportPayload(makePayload({ attempts: [attempt] }));
    expect(result.attempts).toHaveLength(1);
    expect(result.attempts[0].url).toBe("");
    expect(result.attempts[0].domain).toBe("");
    expect(result.attempts[0].modeTriggered).toBe("blocklist");
  });
});

// ── normalizeImportedSettings ─────────────────────────────────────────────────

describe("normalizeImportedSettings", () => {
  it("returns defaults for null input", () => {
    expect(normalizeImportedSettings(null, defaultSettings)).toEqual(defaultSettings);
  });

  it("returns defaults for non-object input", () => {
    expect(normalizeImportedSettings("bad", defaultSettings)).toEqual(defaultSettings);
  });

  it("merges valid fields into defaults", () => {
    const result = normalizeImportedSettings({ defaultSessionLength: 45 }, defaultSettings);
    expect(result.defaultSessionLength).toBe(45);
    expect(result.defaultStrictness).toBe(defaultSettings.defaultStrictness);
  });

  it("invalid defaultStrictness falls back to default", () => {
    const result = normalizeImportedSettings({ defaultStrictness: "extreme" }, defaultSettings);
    expect(result.defaultStrictness).toBe(defaultSettings.defaultStrictness);
  });

  it("filters non-string entries from domain arrays", () => {
    const result = normalizeImportedSettings({ defaultBlockedDomains: ["reddit.com", 42, null] }, defaultSettings);
    expect(result.defaultBlockedDomains).toEqual(["reddit.com"]);
  });

  it("non-boolean showTimer falls back to default", () => {
    const result = normalizeImportedSettings({ showTimer: "yes" }, defaultSettings);
    expect(result.showTimer).toBe(defaultSettings.showTimer);
  });

  it("negative defaultSessionLength falls back to default", () => {
    const result = normalizeImportedSettings({ defaultSessionLength: -10 }, defaultSettings);
    expect(result.defaultSessionLength).toBe(defaultSettings.defaultSessionLength);
  });

  it("session length below 5 is rejected", () => {
    const result = normalizeImportedSettings({ defaultSessionLength: 4 }, defaultSettings);
    expect(result.defaultSessionLength).toBe(defaultSettings.defaultSessionLength);
  });

  it("session length exactly 5 is accepted", () => {
    const result = normalizeImportedSettings({ defaultSessionLength: 5 }, defaultSettings);
    expect(result.defaultSessionLength).toBe(5);
  });

  it("session length above 480 is rejected", () => {
    const result = normalizeImportedSettings({ defaultSessionLength: 481 }, defaultSettings);
    expect(result.defaultSessionLength).toBe(defaultSettings.defaultSessionLength);
  });

  it("session length exactly 480 is accepted", () => {
    const result = normalizeImportedSettings({ defaultSessionLength: 480 }, defaultSettings);
    expect(result.defaultSessionLength).toBe(480);
  });

  it("non-isLikelyDomain entries are filtered from blocked domains", () => {
    const result = normalizeImportedSettings(
      { defaultBlockedDomains: ["reddit.com", "not a domain!!!", "localhost"] },
      defaultSettings
    );
    expect(result.defaultBlockedDomains).toContain("reddit.com");
    expect(result.defaultBlockedDomains).not.toContain("not a domain!!!");
  });

  it("domain entries are normalized (strips www, lowercased)", () => {
    const result = normalizeImportedSettings(
      { defaultBlockedDomains: ["www.Reddit.com"] },
      defaultSettings
    );
    expect(result.defaultBlockedDomains).toContain("reddit.com");
    expect(result.defaultBlockedDomains).not.toContain("www.Reddit.com");
  });

  it("duplicate domains are deduplicated", () => {
    const result = normalizeImportedSettings(
      { defaultBlockedDomains: ["reddit.com", "reddit.com", "www.reddit.com"] },
      defaultSettings
    );
    const count = result.defaultBlockedDomains.filter((d) => d === "reddit.com").length;
    expect(count).toBe(1);
  });

  it("non-array blocked domains falls back to default", () => {
    const result = normalizeImportedSettings({ defaultBlockedDomains: "reddit.com" }, defaultSettings);
    expect(result.defaultBlockedDomains).toEqual(defaultSettings.defaultBlockedDomains);
  });

  it("partial settings merge with defaults for omitted fields", () => {
    const result = normalizeImportedSettings({ logBypassReasons: false }, defaultSettings);
    expect(result.logBypassReasons).toBe(false);
    expect(result.showTimer).toBe(defaultSettings.showTimer);
    expect(result.defaultSessionLength).toBe(defaultSettings.defaultSessionLength);
  });
});
