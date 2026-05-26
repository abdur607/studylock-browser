import { BlockedAttempt, Flashcard, HighlightNote, SavedSource, Settings, StudySession, TabGroup } from "./types";
import { ImportPayload } from "./exportUtils";
import { getDomainFromUrl, isLikelyDomain, normalizeDomain } from "./domainUtils";
import { defaultSettings } from "./storage";
import { createCitationDraft } from "./citationHelper";

function safeStr(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function safeNum(v: unknown, fallback: number): number {
  return typeof v === "number" && isFinite(v) && v >= 0 ? v : fallback;
}

function safeStrArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((item): item is string => typeof item === "string") : [];
}

function normalizeSession(raw: StudySession): StudySession {
  const validStatuses = new Set(["planned", "completed", "cancelled"]);
  const status = raw.status === "active" || !validStatuses.has(raw.status)
    ? "completed"
    : raw.status;

  const endTime = status === "completed"
    ? (safeStr(raw.endTime) ?? new Date().toISOString())
    : safeStr(raw.endTime);

  return {
    id: raw.id,
    course: safeStr(raw.course) ?? "Unknown Course",
    task: safeStr(raw.task) ?? "Untitled Task",
    goal: safeStr(raw.goal),
    durationMinutes: safeNum(raw.durationMinutes, 60) || 60,
    startTime: safeStr(raw.startTime),
    endTime,
    status,
    strictness: ["soft", "normal", "strict"].includes(raw.strictness) ? raw.strictness : "normal",
    mode: ["blocklist", "allowlist"].includes(raw.mode) ? raw.mode : "blocklist",
    blockedDomains: safeStrArr(raw.blockedDomains),
    allowedDomains: safeStrArr(raw.allowedDomains),
    blockedAttemptCount: safeNum(raw.blockedAttemptCount, 0),
    bypassCount: safeNum(raw.bypassCount, 0),
    sourcesSavedCount: safeNum(raw.sourcesSavedCount, 0),
    notesCreatedCount: safeNum(raw.notesCreatedCount, 0),
    flashcardsCreatedCount: safeNum(raw.flashcardsCreatedCount, 0),
    tabGroupsSavedCount: safeNum(raw.tabGroupsSavedCount, 0),
    reflection: safeStr(raw.reflection),
  };
}

function normalizeSource(raw: SavedSource): SavedSource | undefined {
  const url = safeStr(raw.url);
  if (!url) return undefined;
  const domain = safeStr(raw.domain) || getDomainFromUrl(url);
  if (!domain) return undefined;
  const validTypes = new Set(["article", "video", "pdf", "textbook", "webpage", "other"]);
  const title = safeStr(raw.title) || "Untitled Source";
  const accessedAt = safeStr(raw.accessedAt) ?? new Date().toISOString();
  const existingDraft = safeStr(raw.citationDraft);
  const citationDraft = existingDraft?.trim()
    ? existingDraft
    : createCitationDraft(
        title,
        domain,
        url,
        {
          publisher: safeStr(raw.publisher),
          author: safeStr(raw.author),
          publishedDate: safeStr(raw.publishedDate),
        },
        new Date(accessedAt)
      );

  return {
    id: raw.id,
    course: safeStr(raw.course),
    sessionId: safeStr(raw.sessionId),
    title,
    url,
    domain,
    sourceType: validTypes.has(raw.sourceType) ? raw.sourceType : "webpage",
    assignment: safeStr(raw.assignment),
    author: safeStr(raw.author),
    publisher: safeStr(raw.publisher),
    publishedDate: safeStr(raw.publishedDate),
    accessedAt,
    selectedText: safeStr(raw.selectedText),
    note: safeStr(raw.note),
    tags: safeStrArr(raw.tags),
    citationDraft,
  };
}

function normalizeHighlight(raw: HighlightNote): HighlightNote {
  return {
    id: raw.id,
    sourceId: safeStr(raw.sourceId),
    course: safeStr(raw.course),
    sessionId: safeStr(raw.sessionId),
    url: raw.url,
    pageTitle: (safeStr(raw.pageTitle) || "").trim() || "Untitled Page",
    selectedText: raw.selectedText,
    note: safeStr(raw.note),
    tags: safeStrArr(raw.tags),
    createdAt: safeStr(raw.createdAt) ?? new Date().toISOString(),
  };
}

function normalizeFlashcard(raw: Flashcard): Flashcard {
  return {
    id: raw.id,
    course: safeStr(raw.course),
    sourceId: safeStr(raw.sourceId),
    highlightId: safeStr(raw.highlightId),
    front: raw.front,
    back: raw.back,
    tags: safeStrArr(raw.tags),
    sourceUrl: safeStr(raw.sourceUrl),
    createdAt: safeStr(raw.createdAt) ?? new Date().toISOString(),
  };
}

function normalizeTabGroup(raw: TabGroup): TabGroup {
  const tabs = Array.isArray(raw.tabs)
    ? raw.tabs
        .filter((t): t is { title: string; url: string; domain: string } => {
          return !!t && typeof t === "object" && typeof (t as Record<string, unknown>).url === "string";
        })
        .map((t) => ({
          title: safeStr(t.title) ?? "",
          url: t.url,
          domain: safeStr(t.domain) || getDomainFromUrl(t.url),
        }))
    : [];

  return {
    id: raw.id,
    courseId: safeStr(raw.courseId),
    sessionId: safeStr(raw.sessionId),
    courseName: safeStr(raw.courseName) ?? "Untitled Group",
    name: (safeStr(raw.name) || "").trim() || "Saved Tabs",
    task: safeStr(raw.task),
    tabs,
    createdAt: safeStr(raw.createdAt) ?? new Date().toISOString(),
    updatedAt: safeStr(raw.updatedAt) ?? new Date().toISOString(),
  };
}

function normalizeAttempt(raw: BlockedAttempt): BlockedAttempt {
  const validBypassTypes = new Set(["soft", "normal", "emergency"]);
  const validModes = new Set(["blocklist", "allowlist"]);
  const url = safeStr(raw.url) ?? "";
  const domain = safeStr(raw.domain) || getDomainFromUrl(url);

  return {
    id: raw.id,
    sessionId: safeStr(raw.sessionId) ?? "",
    domain,
    url,
    timestamp: safeStr(raw.timestamp) ?? new Date().toISOString(),
    modeTriggered: validModes.has(raw.modeTriggered) ? raw.modeTriggered : "blocklist",
    bypassed: typeof raw.bypassed === "boolean" ? raw.bypassed : false,
    bypassReason: safeStr(raw.bypassReason),
    bypassType: validBypassTypes.has(raw.bypassType as string) ? raw.bypassType : undefined,
  };
}

function normalizeDomainList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const normalized = value
    .filter((d): d is string => typeof d === "string")
    .map(normalizeDomain)
    .filter(isLikelyDomain);
  return [...new Set(normalized)];
}

export function normalizeImportedSettings(value: unknown, defaults: Settings): Settings {
  if (!value || typeof value !== "object" || Array.isArray(value)) return defaults;
  const raw = value as Record<string, unknown>;
  const validStrictness = new Set(["soft", "normal", "strict"]);

  const sessionLength = raw.defaultSessionLength;
  const validSessionLength =
    typeof sessionLength === "number" &&
    isFinite(sessionLength) &&
    sessionLength >= 5 &&
    sessionLength <= 480;

  return {
    defaultBlockedDomains: normalizeDomainList(raw.defaultBlockedDomains, defaults.defaultBlockedDomains),
    defaultAllowedDomains: normalizeDomainList(raw.defaultAllowedDomains, defaults.defaultAllowedDomains),
    defaultSessionLength: validSessionLength ? sessionLength : defaults.defaultSessionLength,
    defaultStrictness: validStrictness.has(raw.defaultStrictness as string)
      ? (raw.defaultStrictness as Settings["defaultStrictness"])
      : defaults.defaultStrictness,
    enableAllowlist: typeof raw.enableAllowlist === "boolean" ? raw.enableAllowlist : defaults.enableAllowlist,
    showTimer: typeof raw.showTimer === "boolean" ? raw.showTimer : defaults.showTimer,
    logBypassReasons: typeof raw.logBypassReasons === "boolean" ? raw.logBypassReasons : defaults.logBypassReasons,
  };
}

export function normalizeImportPayload(payload: ImportPayload): ImportPayload {
  const sessions = payload.sessions.map(normalizeSession);

  const rawSourceCount = payload.sources.length;
  const sources = payload.sources
    .map(normalizeSource)
    .filter((s): s is SavedSource => s !== undefined);

  const highlights = payload.highlights.map(normalizeHighlight);
  const flashcards = payload.flashcards.map(normalizeFlashcard);
  const tabGroups = payload.tabGroups.map(normalizeTabGroup);
  const attempts = payload.attempts.map(normalizeAttempt);

  const normalizationSkipped = rawSourceCount - sources.length;

  return {
    sessions,
    sources,
    highlights,
    flashcards,
    tabGroups,
    attempts,
    settings: payload.settings
      ? normalizeImportedSettings(payload.settings, defaultSettings)
      : undefined,
    skippedCount: payload.skippedCount + normalizationSkipped,
  };
}
