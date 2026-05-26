import { describe, expect, it, vi } from "vitest";
import { startSession } from "./sessionManager";
import { getActiveSession, getArray } from "./storage";
import { saveCurrentTabs } from "./tabGroupManager";
import { STORAGE_KEYS, TabGroup } from "./types";

const baseSession = {
  course: "Chemistry",
  task: "Review",
  durationMinutes: 60,
  mode: "blocklist" as const,
  strictness: "normal" as const,
  blockedDomains: [],
  allowedDomains: []
};

describe("saveCurrentTabs", () => {
  it("saves a tab group to storage", async () => {
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
      { url: "https://openstax.org", title: "OpenStax" }
    ]);
    const group = await saveCurrentTabs("Chemistry", "Study tabs");
    const groups = await getArray<TabGroup>(STORAGE_KEYS.tabGroups);
    expect(groups.some((g) => g.id === group.id)).toBe(true);
  });

  it("filters out non-http tabs", async () => {
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
      { url: "https://openstax.org", title: "OpenStax" },
      { url: "chrome://extensions", title: "Extensions" },
      { url: "chrome-extension://abc/popup.html", title: "Popup" }
    ]);
    const group = await saveCurrentTabs("Chemistry", "Study tabs");
    expect(group.tabs).toHaveLength(1);
    expect(group.tabs[0].url).toBe("https://openstax.org");
  });

  it("links tab group to the active session", async () => {
    const session = await startSession(baseSession);
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
      { url: "https://openstax.org", title: "OpenStax" }
    ]);
    const group = await saveCurrentTabs("Chemistry", "Study tabs");
    expect(group.sessionId).toBe(session.id);
  });

  it("increments tabGroupsSavedCount on the active session", async () => {
    await startSession(baseSession);
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    await saveCurrentTabs("Chemistry", "Tabs 1");
    await saveCurrentTabs("Chemistry", "Tabs 2");
    const active = await getActiveSession();
    expect(active?.tabGroupsSavedCount).toBe(2);
  });

  it("does not set sessionId when no session is active", async () => {
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const group = await saveCurrentTabs("Chemistry", "Tabs");
    expect(group.sessionId).toBeUndefined();
  });
});
