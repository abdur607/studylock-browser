import { addItem, createId, getActiveSession, getArray, setActiveSession, setArray, updateItem } from "./storage";
import { STORAGE_KEYS, StudySession } from "./types";

export function getTimeRemainingMs(session?: StudySession): number {
  if (!session?.startTime) return 0;
  const end = new Date(session.startTime).getTime() + session.durationMinutes * 60_000;
  return Math.max(0, end - Date.now());
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export async function startSession(input: Omit<StudySession, "id" | "startTime" | "status" | "blockedAttemptCount" | "bypassCount" | "sourcesSavedCount" | "notesCreatedCount" | "flashcardsCreatedCount" | "tabGroupsSavedCount">): Promise<StudySession> {
  const session: StudySession = {
    ...input,
    id: createId("session"),
    startTime: new Date().toISOString(),
    status: "active",
    blockedAttemptCount: 0,
    bypassCount: 0,
    sourcesSavedCount: 0,
    notesCreatedCount: 0,
    flashcardsCreatedCount: 0,
    tabGroupsSavedCount: 0
  };
  await addItem(STORAGE_KEYS.sessions, session);
  await setActiveSession(session.id);
  return session;
}

export async function completeActiveSession(reflection?: string): Promise<StudySession | undefined> {
  const active = await getActiveSession();
  if (!active) return undefined;
  const completed = await updateItem<StudySession>(STORAGE_KEYS.sessions, active.id, {
    status: "completed",
    endTime: new Date().toISOString(),
    reflection
  });
  await setActiveSession(undefined);
  return completed;
}

export function focusedMinutes(session: StudySession): number {
  if (!session.startTime) return 0;
  const end = session.endTime ? new Date(session.endTime).getTime() : Date.now();
  return Math.max(0, Math.round((end - new Date(session.startTime).getTime()) / 60_000));
}

type SessionCounter = "blockedAttemptCount" | "bypassCount" | "sourcesSavedCount" | "notesCreatedCount" | "flashcardsCreatedCount" | "tabGroupsSavedCount";

export async function incrementSessionCounter(sessionId: string, counter: SessionCounter, amount = 1): Promise<void> {
  const sessions = await getArray<StudySession>(STORAGE_KEYS.sessions);
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) return;
  await setArray(
    STORAGE_KEYS.sessions,
    sessions.map((s) => s.id === sessionId ? { ...s, [counter]: ((s[counter] as number) ?? 0) + amount } : s)
  );
}

export async function expireSessionIfNeeded(): Promise<StudySession | undefined> {
  const active = await getActiveSession();
  if (!active || getTimeRemainingMs(active) > 0) return undefined;
  const expired = await updateItem<StudySession>(STORAGE_KEYS.sessions, active.id, {
    status: "completed",
    endTime: new Date().toISOString()
  });
  await setActiveSession(undefined);
  return expired;
}
