import { describe, expect, it } from "vitest";
import { startSession } from "./sessionManager";
import { saveSource } from "./sourceManager";
import { getActiveSession, getArray } from "./storage";
import { STORAGE_KEYS, SavedSource } from "./types";

const baseSession = {
  course: "Chemistry",
  task: "Review",
  durationMinutes: 60,
  mode: "blocklist" as const,
  strictness: "normal" as const,
  blockedDomains: [],
  allowedDomains: []
};

describe("saveSource", () => {
  it("saves source to storage", async () => {
    const source = await saveSource({ title: "Test Page", url: "https://example.com", tags: [] });
    const sources = await getArray<SavedSource>(STORAGE_KEYS.sources);
    expect(sources.some((s) => s.id === source.id)).toBe(true);
  });

  it("generates a citation draft", async () => {
    const source = await saveSource({ title: "Test Article", url: "https://example.com", tags: [] });
    expect(source.citationDraft).toContain("Test Article");
    expect(source.citationDraft).toContain("https://example.com");
  });

  it("uses author and publisher in citation draft when provided", async () => {
    const source = await saveSource({
      title: "Chem Textbook",
      url: "https://openstax.org",
      author: "Jane Smith",
      publisher: "OpenStax",
      tags: []
    });
    expect(source.citationDraft).toContain("Jane Smith");
    expect(source.citationDraft).toContain("OpenStax");
  });

  it("increments sourcesSavedCount on the active session", async () => {
    await startSession(baseSession);
    await saveSource({ title: "Source A", url: "https://a.com", tags: [] });
    await saveSource({ title: "Source B", url: "https://b.com", tags: [] });
    const active = await getActiveSession();
    expect(active?.sourcesSavedCount).toBe(2);
  });

  it("records sessionId on the source when a session is active", async () => {
    const session = await startSession(baseSession);
    const source = await saveSource({ title: "T", url: "https://x.com", tags: [] });
    expect(source.sessionId).toBe(session.id);
  });
});
