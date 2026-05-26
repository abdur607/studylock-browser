import { getActiveSession, getArray, getSchemaVersion, setActiveSession, setArray, setSchemaVersion } from "./storage";
import { SavedSource, STORAGE_KEYS, StudySession } from "./types";

const CURRENT_SCHEMA_VERSION = 2;

export async function runMigrations(): Promise<void> {
  const version = await getSchemaVersion();
  if (version >= CURRENT_SCHEMA_VERSION) return;

  if (version < 2) {
    await migrateV1ToV2();
  }

  await setSchemaVersion(CURRENT_SCHEMA_VERSION);
}

async function migrateV1ToV2(): Promise<void> {
  const sessions = await getArray<StudySession>(STORAGE_KEYS.sessions);
  if (sessions.some((s) => s.tabGroupsSavedCount == null)) {
    await setArray(
      STORAGE_KEYS.sessions,
      sessions.map((s) => ({ ...s, tabGroupsSavedCount: s.tabGroupsSavedCount ?? 0 }))
    );
  }

  const sources = await getArray<SavedSource>(STORAGE_KEYS.sources);
  if (sources.some((s) => !s.sourceType || !s.tags)) {
    await setArray(
      STORAGE_KEYS.sources,
      sources.map((s) => ({ ...s, sourceType: s.sourceType ?? "webpage", tags: s.tags ?? [] }))
    );
  }
}

export async function repairStorageConsistency(): Promise<void> {
  const sessions = await getArray<StudySession>(STORAGE_KEYS.sessions);

  // Validate the active session pointer first.
  // getActiveSession() checks both that the pointer exists and that the session is "active".
  // Cases handled:
  //   A — no pointer + orphaned active sessions  → validActive=undefined, complete all active
  //   B — stale pointer (session not found)      → validActive=undefined, complete any orphaned actives
  //   C — pointer to non-active session          → validActive=undefined, complete any orphaned actives
  //   D — one valid active session               → validActive=that session, keep it
  //   E — multiple active sessions               → validActive=pointed one, complete the rest
  const validActive = await getActiveSession();

  const toComplete = new Set(
    sessions
      .filter((s) => s.status === "active" && s.id !== validActive?.id)
      .map((s) => s.id)
  );

  const needsRepair = toComplete.size > 0 || sessions.some((s) => s.tabGroupsSavedCount == null);
  if (needsRepair) {
    await setArray(
      STORAGE_KEYS.sessions,
      sessions.map((s) => ({
        ...s,
        tabGroupsSavedCount: s.tabGroupsSavedCount ?? 0,
        ...(toComplete.has(s.id)
          ? { status: "completed" as const, endTime: s.endTime ?? new Date().toISOString() }
          : {})
      }))
    );
  }

  if (!validActive) {
    await setActiveSession(undefined);
  }
}
