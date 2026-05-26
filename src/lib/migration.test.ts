import { describe, expect, it } from "vitest";
import { repairStorageConsistency, runMigrations } from "./migration";
import { getActiveSession, getArray, getSchemaVersion, setArray, setActiveSession } from "./storage";
import { SavedSource, STORAGE_KEYS, StudySession } from "./types";

function makeSession(overrides: Partial<StudySession> & { tabGroupsSavedCount?: undefined } = {}): Omit<StudySession, "tabGroupsSavedCount"> & { tabGroupsSavedCount?: number } {
  return {
    id: "s1",
    course: "Chemistry",
    task: "Review",
    durationMinutes: 60,
    startTime: new Date().toISOString(),
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
    ...overrides
  };
}

describe("runMigrations", () => {
  it("adds tabGroupsSavedCount to sessions that are missing it", async () => {
    const session = makeSession({ id: "s1" });
    // Manually store a session without tabGroupsSavedCount
    await setArray(STORAGE_KEYS.sessions, [session]);

    await runMigrations();

    const sessions = await getArray<StudySession>(STORAGE_KEYS.sessions);
    expect(sessions[0].tabGroupsSavedCount).toBe(0);
  });

  it("adds default sourceType to sources missing it", async () => {
    const source = { id: "src1", title: "T", url: "u", domain: "d", accessedAt: "", tags: [], citationDraft: "" };
    await setArray(STORAGE_KEYS.sources, [source]);

    await runMigrations();

    const sources = await getArray<SavedSource>(STORAGE_KEYS.sources);
    expect(sources[0].sourceType).toBe("webpage");
  });

  it("does not re-run migrations after the schema version is current", async () => {
    await runMigrations();
    const versionAfterFirst = await getSchemaVersion();

    await runMigrations(); // Should be a no-op
    const versionAfterSecond = await getSchemaVersion();

    expect(versionAfterFirst).toBe(versionAfterSecond);
  });
});

function makeActiveSession(overrides: Partial<StudySession> = {}): StudySession {
  return {
    id: "s1",
    course: "Chem",
    task: "Review",
    durationMinutes: 60,
    startTime: new Date().toISOString(),
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

describe("repairStorageConsistency", () => {
  it("clears a stale active session pointer when session is no longer active", async () => {
    const session = makeActiveSession({ id: "stale" });
    await setArray(STORAGE_KEYS.sessions, [{ ...session, status: "completed" }]);
    await setActiveSession("stale");

    await repairStorageConsistency();

    const active = await getActiveSession();
    expect(active).toBeUndefined();
  });

  it("deactivates extra active sessions, keeping only the most recently started", async () => {
    const older = makeActiveSession({ id: "s_older", startTime: new Date(Date.now() - 10_000).toISOString() });
    const newer = makeActiveSession({ id: "s_newer", startTime: new Date().toISOString() });
    await setArray(STORAGE_KEYS.sessions, [older, newer]);
    await setActiveSession(newer.id);

    await repairStorageConsistency();

    const sessions = await getArray<StudySession>(STORAGE_KEYS.sessions);
    expect(sessions.find((s) => s.id === "s_newer")?.status).toBe("active");
    expect(sessions.find((s) => s.id === "s_older")?.status).toBe("completed");
  });

  it("fills in missing tabGroupsSavedCount", async () => {
    const session = makeActiveSession({ id: "s1" });
    // Store without tabGroupsSavedCount
    const { tabGroupsSavedCount: _removed, ...withoutCount } = session;
    await setArray(STORAGE_KEYS.sessions, [withoutCount]);

    await repairStorageConsistency();

    const sessions = await getArray<StudySession>(STORAGE_KEYS.sessions);
    expect(sessions[0].tabGroupsSavedCount).toBe(0);
  });

  it("case A: completes all orphaned active sessions when no pointer is set", async () => {
    const s1 = makeActiveSession({ id: "s1" });
    const s2 = makeActiveSession({ id: "s2" });
    await setArray(STORAGE_KEYS.sessions, [s1, s2]);
    // No activeSessionId pointer set — both are orphaned

    await repairStorageConsistency();

    const sessions = await getArray<StudySession>(STORAGE_KEYS.sessions);
    expect(sessions.every((s) => s.status === "completed")).toBe(true);
    const active = await getActiveSession();
    expect(active).toBeUndefined();
  });

  it("case B: clears stale pointer when session ID does not exist", async () => {
    await setArray(STORAGE_KEYS.sessions, []);
    await setActiveSession("ghost_id");

    await repairStorageConsistency();

    const active = await getActiveSession();
    expect(active).toBeUndefined();
  });

  it("case E: keeps the pointed session active and completes any other active sessions", async () => {
    const valid = makeActiveSession({ id: "valid" });
    const extra = makeActiveSession({ id: "extra" });
    await setArray(STORAGE_KEYS.sessions, [valid, extra]);
    await setActiveSession(valid.id);

    await repairStorageConsistency();

    const sessions = await getArray<StudySession>(STORAGE_KEYS.sessions);
    expect(sessions.find((s) => s.id === "valid")?.status).toBe("active");
    expect(sessions.find((s) => s.id === "extra")?.status).toBe("completed");
  });
});
