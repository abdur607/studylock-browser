import { addItem, createId, getActiveSession, getArray } from "./storage";
import { incrementSessionCounter } from "./sessionManager";
import { HighlightNote, SavedSource, STORAGE_KEYS } from "./types";

function stripQueryAndHash(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}${u.pathname}`;
  } catch {
    return url;
  }
}

async function findSourceIdByUrl(url: string, sessionId?: string): Promise<string | undefined> {
  const sources = await getArray<SavedSource>(STORAGE_KEYS.sources);
  const normalized = stripQueryAndHash(url);
  // Prefer a source from the active session if one matches
  const sessionMatch = sessionId
    ? sources.find((s) => s.sessionId === sessionId && stripQueryAndHash(s.url) === normalized)
    : undefined;
  if (sessionMatch) return sessionMatch.id;
  return sources.find((s) => stripQueryAndHash(s.url) === normalized)?.id;
}

export async function saveHighlight(input: {
  url: string;
  pageTitle: string;
  selectedText: string;
  note?: string;
  course?: string;
  tags?: string[];
  sourceId?: string;
}): Promise<HighlightNote> {
  const active = await getActiveSession();
  const sourceId = input.sourceId ?? (await findSourceIdByUrl(input.url, active?.id));
  const highlight: HighlightNote = {
    id: createId("highlight"),
    sourceId,
    course: input.course || active?.course,
    sessionId: active?.id,
    url: input.url,
    pageTitle: input.pageTitle,
    selectedText: input.selectedText,
    note: input.note,
    tags: input.tags ?? [],
    createdAt: new Date().toISOString()
  };
  await addItem(STORAGE_KEYS.highlights, highlight);
  if (active) await incrementSessionCounter(active.id, "notesCreatedCount");
  return highlight;
}
