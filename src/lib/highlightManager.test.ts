import { describe, expect, it } from "vitest";
import { saveHighlight } from "./highlightManager";
import { startSession } from "./sessionManager";
import { addItem, getActiveSession, getArray } from "./storage";
import { HighlightNote, SavedSource, STORAGE_KEYS } from "./types";

const baseSession = {
  course: "Biology",
  task: "Notes",
  durationMinutes: 30,
  mode: "blocklist" as const,
  strictness: "normal" as const,
  blockedDomains: [],
  allowedDomains: []
};

describe("saveHighlight", () => {
  it("saves highlight to storage", async () => {
    const highlight = await saveHighlight({
      url: "https://example.com",
      pageTitle: "Example Page",
      selectedText: "This is the highlighted text.",
      tags: []
    });
    const highlights = await getArray<HighlightNote>(STORAGE_KEYS.highlights);
    expect(highlights.some((h) => h.id === highlight.id)).toBe(true);
  });

  it("stores selected text", async () => {
    const highlight = await saveHighlight({
      url: "https://example.com",
      pageTitle: "Page",
      selectedText: "Key concept here.",
      tags: []
    });
    expect(highlight.selectedText).toBe("Key concept here.");
  });

  it("increments notesCreatedCount on the active session", async () => {
    await startSession(baseSession);
    await saveHighlight({ url: "https://a.com", pageTitle: "P", selectedText: "Text", tags: [] });
    await saveHighlight({ url: "https://a.com", pageTitle: "P", selectedText: "More", tags: [] });
    const active = await getActiveSession();
    expect(active?.notesCreatedCount).toBe(2);
  });

  it("records sessionId on the highlight when a session is active", async () => {
    const session = await startSession(baseSession);
    const highlight = await saveHighlight({ url: "https://a.com", pageTitle: "P", selectedText: "T", tags: [] });
    expect(highlight.sessionId).toBe(session.id);
  });

  it("auto-links sourceId when a source exists with the same URL", async () => {
    const source: SavedSource = {
      id: "src1",
      title: "Example",
      url: "https://example.com/page",
      domain: "example.com",
      sourceType: "article",
      accessedAt: new Date().toISOString(),
      tags: [],
      citationDraft: "Example. 2024."
    };
    await addItem<SavedSource>(STORAGE_KEYS.sources, source);
    const highlight = await saveHighlight({
      url: "https://example.com/page",
      pageTitle: "Page",
      selectedText: "Key text",
      tags: []
    });
    expect(highlight.sourceId).toBe("src1");
  });

  it("does not set sourceId when no source matches the URL", async () => {
    const highlight = await saveHighlight({
      url: "https://no-source-here.com",
      pageTitle: "Page",
      selectedText: "Text",
      tags: []
    });
    expect(highlight.sourceId).toBeUndefined();
  });

  it("prefers a source from the active session over an older unrelated source", async () => {
    const session = await startSession(baseSession);
    const oldSource: SavedSource = {
      id: "src_old",
      title: "Old",
      url: "https://example.com/page",
      domain: "example.com",
      sourceType: "article",
      accessedAt: new Date(Date.now() - 10_000).toISOString(),
      tags: [],
      citationDraft: ""
    };
    const sessionSource: SavedSource = {
      id: "src_session",
      title: "Session Source",
      url: "https://example.com/page",
      domain: "example.com",
      sourceType: "article",
      sessionId: session.id,
      accessedAt: new Date().toISOString(),
      tags: [],
      citationDraft: ""
    };
    await addItem<SavedSource>(STORAGE_KEYS.sources, oldSource);
    await addItem<SavedSource>(STORAGE_KEYS.sources, sessionSource);

    const highlight = await saveHighlight({
      url: "https://example.com/page",
      pageTitle: "Page",
      selectedText: "Text",
      tags: []
    });
    expect(highlight.sourceId).toBe("src_session");
  });
});
