import { BlockedAttempt, Flashcard, HighlightNote, SavedSource, Settings, StudySession, TabGroup } from "./types";
import { focusedMinutes } from "./sessionManager";

export interface ImportPayload {
  sessions: StudySession[];
  attempts: BlockedAttempt[];
  sources: SavedSource[];
  highlights: HighlightNote[];
  flashcards: Flashcard[];
  tabGroups: TabGroup[];
  settings?: Settings;
  skippedCount: number;
}

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

// Minimum requirement: id — course/task/status/durationMinutes are normalized with safe defaults
function filterSessions(arr: unknown[]): StudySession[] {
  return arr.filter((item) =>
    isObj(item) &&
    typeof item.id === "string"
  ) as StudySession[];
}

// Minimum requirement: id + url — title/domain/sourceType/tags are normalized with safe defaults
function filterSources(arr: unknown[]): SavedSource[] {
  return arr.filter((item) =>
    isObj(item) &&
    typeof item.id === "string" &&
    typeof item.url === "string"
  ) as SavedSource[];
}

// Minimum requirement: id + url + selectedText
function filterHighlights(arr: unknown[]): HighlightNote[] {
  return arr.filter((item) =>
    isObj(item) &&
    typeof item.id === "string" &&
    typeof item.url === "string" &&
    typeof item.selectedText === "string"
  ) as HighlightNote[];
}

// Minimum requirement: id + front + back
function filterFlashcards(arr: unknown[]): Flashcard[] {
  return arr.filter((item) =>
    isObj(item) &&
    typeof item.id === "string" &&
    typeof item.front === "string" &&
    typeof item.back === "string"
  ) as Flashcard[];
}

// Minimum requirement: id + tabs array — courseName/name/dates normalized with safe defaults
function filterTabGroups(arr: unknown[]): TabGroup[] {
  return arr.filter((item) =>
    isObj(item) &&
    typeof item.id === "string" &&
    Array.isArray(item.tabs)
  ) as TabGroup[];
}

// Minimum requirement: id + (sessionId OR url OR domain) — timestamp/mode/bypass normalized with defaults
function filterAttempts(arr: unknown[]): BlockedAttempt[] {
  return arr.filter((item) =>
    isObj(item) &&
    typeof item.id === "string" &&
    (typeof item.sessionId === "string" || typeof item.url === "string" || typeof item.domain === "string")
  ) as BlockedAttempt[];
}

export function parseImportPayload(data: unknown): ImportPayload | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const requiredArrays = ["sessions", "attempts", "sources", "highlights", "flashcards", "tabGroups"];
  if (!requiredArrays.every((k) => Array.isArray(d[k]))) return null;

  const rawSessions = d.sessions as unknown[];
  const rawAttempts = d.attempts as unknown[];
  const rawSources = d.sources as unknown[];
  const rawHighlights = d.highlights as unknown[];
  const rawFlashcards = d.flashcards as unknown[];
  const rawTabGroups = d.tabGroups as unknown[];

  const sessions = filterSessions(rawSessions);
  const attempts = filterAttempts(rawAttempts);
  const sources = filterSources(rawSources);
  const highlights = filterHighlights(rawHighlights);
  const flashcards = filterFlashcards(rawFlashcards);
  const tabGroups = filterTabGroups(rawTabGroups);

  const totalRaw = rawSessions.length + rawAttempts.length + rawSources.length +
                   rawHighlights.length + rawFlashcards.length + rawTabGroups.length;
  const totalValid = sessions.length + attempts.length + sources.length +
                     highlights.length + flashcards.length + tabGroups.length;

  return {
    sessions,
    attempts,
    sources,
    highlights,
    flashcards,
    tabGroups,
    settings: isObj(d.settings) ? (d.settings as unknown as Settings) : undefined,
    skippedCount: totalRaw - totalValid
  };
}

function download(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function csvCell(value?: string): string {
  return `"${(value ?? "").replace(/"/g, '""')}"`;
}

export function exportFlashcardsCsv(cards: Flashcard[]): void {
  const rows = ["front,back,course,tags,source_url", ...cards.map((card) => [card.front, card.back, card.course, card.tags.join("; "), card.sourceUrl].map(csvCell).join(","))];
  download("studylock-flashcards.csv", rows.join("\n"), "text/csv");
}

export function sourcesMarkdown(sources: SavedSource[]): string {
  return sources.map((source) => `## ${source.title}\n\n- Course: ${source.course ?? "Unassigned"}\n- URL: ${source.url}\n- Type: ${source.sourceType}\n- Tags: ${source.tags.join(", ") || "None"}\n- Citation draft — verify before submitting: ${source.citationDraft}\n\n${source.note ? `Note: ${source.note}\n\n` : ""}${source.selectedText ? `> ${source.selectedText}\n` : ""}`).join("\n\n");
}

export function highlightsMarkdown(highlights: HighlightNote[]): string {
  return highlights.map((item) => `## ${item.pageTitle}\n\n- Course: ${item.course ?? "Unassigned"}\n- URL: ${item.url}\n- Tags: ${item.tags.join(", ") || "None"}\n\n> ${item.selectedText}\n\n${item.note ? `Note: ${item.note}\n` : ""}`).join("\n\n");
}

export function sessionsMarkdown(sessions: StudySession[]): string {
  return sessions.map((session) => `## ${session.course} ${session.task}\n\n- Status: ${session.status}\n- Planned duration: ${session.durationMinutes} minutes\n- Actual focused time: ${focusedMinutes(session)} minutes\n- Blocked attempts: ${session.blockedAttemptCount}\n- Bypasses: ${session.bypassCount}\n- Sources captured: ${session.sourcesSavedCount}\n- Notes created: ${session.notesCreatedCount}\n- Flashcards created: ${session.flashcardsCreatedCount}\n- Tab groups saved: ${session.tabGroupsSavedCount ?? 0}\n\n${session.reflection ? `Reflection: ${session.reflection}\n` : ""}`).join("\n\n");
}

export function exportSourcesMarkdown(sources: SavedSource[]): void {
  download("studylock-sources.md", sourcesMarkdown(sources), "text/markdown");
}

export function exportHighlightsMarkdown(highlights: HighlightNote[]): void {
  download("studylock-highlights.md", highlightsMarkdown(highlights), "text/markdown");
}

export function exportSessionsMarkdown(sessions: StudySession[]): void {
  download("studylock-sessions.md", sessionsMarkdown(sessions), "text/markdown");
}

export function exportAllJson(data: {
  sessions: StudySession[];
  attempts: BlockedAttempt[];
  sources: SavedSource[];
  highlights: HighlightNote[];
  flashcards: Flashcard[];
  tabGroups: TabGroup[];
  settings?: Settings;
}): void {
  const payload = {
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    sessions: data.sessions,
    attempts: data.attempts,
    sources: data.sources,
    highlights: data.highlights,
    flashcards: data.flashcards,
    tabGroups: data.tabGroups,
    ...(data.settings ? { settings: data.settings } : {})
  };
  download("studylock-data.json", JSON.stringify(payload, null, 2), "application/json");
}
