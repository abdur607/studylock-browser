import { BypassGrant, Settings, STORAGE_KEYS, StudySession } from "./types";

export const defaultSettings: Settings = {
  defaultBlockedDomains: ["reddit.com", "instagram.com", "tiktok.com", "x.com", "twitter.com", "netflix.com", "amazon.com"],
  defaultAllowedDomains: ["courseworks.columbia.edu", "docs.google.com", "openstax.org"],
  defaultSessionLength: 60,
  defaultStrictness: "normal",
  enableAllowlist: false,
  showTimer: true,
  logBypassReasons: true
};

function storageGet<T>(key: string): Promise<T | undefined> {
  return new Promise((resolve) => chrome.storage.local.get(key, (result) => resolve(result[key] as T | undefined)));
}

function storageSet(data: Record<string, unknown>): Promise<void> {
  return new Promise((resolve) => chrome.storage.local.set(data, () => resolve()));
}

export function createId(prefix = "id"): string {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export async function getArray<T>(key: string): Promise<T[]> {
  return (await storageGet<T[]>(key)) ?? [];
}

export async function setArray<T>(key: string, value: T[]): Promise<void> {
  await storageSet({ [key]: value });
}

export async function addItem<T>(key: string, item: T): Promise<T> {
  const items = await getArray<T>(key);
  await setArray(key, [item, ...items]);
  return item;
}

export async function updateItem<T extends { id: string }>(key: string, id: string, patch: Partial<T>): Promise<T | undefined> {
  const items = await getArray<T>(key);
  let updated: T | undefined;
  const next = items.map((item) => {
    if (item.id !== id) return item;
    updated = { ...item, ...patch };
    return updated;
  });
  await setArray(key, next);
  return updated;
}

export async function removeItem(key: string, id: string): Promise<void> {
  const items = await getArray<{ id: string }>(key);
  await setArray(key, items.filter((item) => item.id !== id));
}

export async function getSettings(): Promise<Settings> {
  return { ...defaultSettings, ...((await storageGet<Partial<Settings>>(STORAGE_KEYS.settings)) ?? {}) };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await storageSet({ [STORAGE_KEYS.settings]: settings });
}

export async function getActiveSession(): Promise<StudySession | undefined> {
  const activeId = await storageGet<string>(STORAGE_KEYS.activeSessionId);
  if (!activeId) return undefined;
  const sessions = await getArray<StudySession>(STORAGE_KEYS.sessions);
  return sessions.find((session) => session.id === activeId && session.status === "active");
}

export async function setActiveSession(sessionId?: string): Promise<void> {
  await storageSet({ [STORAGE_KEYS.activeSessionId]: sessionId ?? null });
}

export async function clearAllLocalData(): Promise<void> {
  await new Promise<void>((resolve) => chrome.storage.local.clear(() => resolve()));
}

export async function getSchemaVersion(): Promise<number> {
  return (await storageGet<number>(STORAGE_KEYS.schemaVersion)) ?? 0;
}

export async function setSchemaVersion(version: number): Promise<void> {
  await storageSet({ [STORAGE_KEYS.schemaVersion]: version });
}

export async function getBypassGrants(): Promise<BypassGrant[]> {
  const now = Date.now();
  const grants = await getArray<BypassGrant>(STORAGE_KEYS.bypassGrants);
  const active = grants.filter((grant) => new Date(grant.expiresAt).getTime() > now);
  if (active.length !== grants.length) await setArray(STORAGE_KEYS.bypassGrants, active);
  return active;
}

export async function grantBypass(sessionId: string, url: string, minutes = 5): Promise<void> {
  const grants = await getBypassGrants();
  grants.unshift({ sessionId, url, expiresAt: new Date(Date.now() + minutes * 60_000).toISOString() });
  await setArray(STORAGE_KEYS.bypassGrants, grants);
}

export async function isBypassGranted(sessionId: string, url: string): Promise<boolean> {
  const grants = await getBypassGrants();
  return grants.some((grant) => grant.sessionId === sessionId && grant.url === url);
}
