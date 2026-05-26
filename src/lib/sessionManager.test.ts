import { describe, expect, it } from "vitest";
import { completeActiveSession, expireSessionIfNeeded, incrementSessionCounter, startSession } from "./sessionManager";
import { addItem, getActiveSession, getArray, setActiveSession } from "./storage";
import { STORAGE_KEYS, StudySession } from "./types";

const baseInput = {
  course: "Chemistry",
  task: "Final Review",
  durationMinutes: 60,
  mode: "blocklist" as const,
  strictness: "normal" as const,
  blockedDomains: ["reddit.com"],
  allowedDomains: []
};

describe("startSession", () => {
  it("creates a session with active status", async () => {
    const session = await startSession(baseInput);
    expect(session.status).toBe("active");
  });

  it("stores course and task", async () => {
    const session = await startSession(baseInput);
    expect(session.course).toBe("Chemistry");
    expect(session.task).toBe("Final Review");
  });

  it("initialises all counters to zero", async () => {
    const session = await startSession(baseInput);
    expect(session.blockedAttemptCount).toBe(0);
    expect(session.bypassCount).toBe(0);
    expect(session.sourcesSavedCount).toBe(0);
    expect(session.notesCreatedCount).toBe(0);
    expect(session.flashcardsCreatedCount).toBe(0);
    expect(session.tabGroupsSavedCount).toBe(0);
  });

  it("persists session to storage", async () => {
    const session = await startSession(baseInput);
    const sessions = await getArray<StudySession>(STORAGE_KEYS.sessions);
    expect(sessions.some((s) => s.id === session.id)).toBe(true);
  });

  it("sets the active session pointer", async () => {
    const session = await startSession(baseInput);
    const active = await getActiveSession();
    expect(active?.id).toBe(session.id);
  });

  it("assigns a unique id each time", async () => {
    const a = await startSession(baseInput);
    const b = await startSession(baseInput);
    expect(a.id).not.toBe(b.id);
  });
});

describe("expireSessionIfNeeded", () => {
  it("returns undefined when no session is active", async () => {
    const result = await expireSessionIfNeeded();
    expect(result).toBeUndefined();
  });

  it("returns undefined when session still has time remaining", async () => {
    await startSession({ ...baseInput, durationMinutes: 60 });
    const result = await expireSessionIfNeeded();
    expect(result).toBeUndefined();
    const active = await getActiveSession();
    expect(active).toBeDefined(); // still active
  });

  it("returns the completed session and clears active pointer when expired", async () => {
    const expired: StudySession = {
      id: "session_expired",
      course: "Chemistry",
      task: "Expired",
      durationMinutes: 1,
      startTime: new Date(Date.now() - 5 * 60_000).toISOString(), // started 5 min ago, 1 min duration
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
      tabGroupsSavedCount: 0
    };
    await addItem<StudySession>(STORAGE_KEYS.sessions, expired);
    await setActiveSession(expired.id);

    const result = await expireSessionIfNeeded();
    expect(result).toBeDefined();
    expect(result?.status).toBe("completed");
    expect(result?.endTime).toBeDefined();

    const active = await getActiveSession();
    expect(active).toBeUndefined();
  });
});

describe("incrementSessionCounter", () => {
  it("increments a counter on an existing session", async () => {
    const session = await startSession(baseInput);
    await incrementSessionCounter(session.id, "sourcesSavedCount");
    const sessions = await getArray<StudySession>(STORAGE_KEYS.sessions);
    const updated = sessions.find((s) => s.id === session.id);
    expect(updated?.sourcesSavedCount).toBe(1);
  });

  it("is a no-op for a non-existent session id", async () => {
    await incrementSessionCounter("nonexistent", "sourcesSavedCount");
    const sessions = await getArray<StudySession>(STORAGE_KEYS.sessions);
    expect(sessions).toHaveLength(0);
  });

  it("respects the amount parameter", async () => {
    const session = await startSession(baseInput);
    await incrementSessionCounter(session.id, "blockedAttemptCount", 3);
    const sessions = await getArray<StudySession>(STORAGE_KEYS.sessions);
    const updated = sessions.find((s) => s.id === session.id);
    expect(updated?.blockedAttemptCount).toBe(3);
  });

  it("accumulates across multiple calls", async () => {
    const session = await startSession(baseInput);
    await incrementSessionCounter(session.id, "flashcardsCreatedCount");
    await incrementSessionCounter(session.id, "flashcardsCreatedCount");
    const sessions = await getArray<StudySession>(STORAGE_KEYS.sessions);
    const updated = sessions.find((s) => s.id === session.id);
    expect(updated?.flashcardsCreatedCount).toBe(2);
  });
});

describe("completeActiveSession", () => {
  it("marks the session completed and clears the active pointer", async () => {
    await startSession(baseInput);
    const done = await completeActiveSession("Reviewed equilibrium.");
    expect(done?.status).toBe("completed");
    expect(done?.reflection).toBe("Reviewed equilibrium.");
    const active = await getActiveSession();
    expect(active).toBeUndefined();
  });

  it("returns undefined when no session is active", async () => {
    const result = await completeActiveSession();
    expect(result).toBeUndefined();
  });
});
