export type SessionStatus = "planned" | "active" | "completed" | "cancelled";
export type Strictness = "soft" | "normal" | "strict";
export type BlockingMode = "blocklist" | "allowlist";
export type SourceType = "article" | "video" | "pdf" | "textbook" | "webpage" | "other";
export type BypassType = "soft" | "normal" | "emergency";

export interface StudySession {
  id: string;
  course: string;
  task: string;
  goal?: string;
  durationMinutes: number;
  startTime?: string;
  endTime?: string;
  status: SessionStatus;
  strictness: Strictness;
  mode: BlockingMode;
  blockedDomains: string[];
  allowedDomains: string[];
  blockedAttemptCount: number;
  bypassCount: number;
  sourcesSavedCount: number;
  notesCreatedCount: number;
  flashcardsCreatedCount: number;
  tabGroupsSavedCount: number;
  reflection?: string;
}

export interface BlockedAttempt {
  id: string;
  sessionId: string;
  domain: string;
  url: string;
  timestamp: string;
  modeTriggered: BlockingMode;
  bypassed: boolean;
  bypassReason?: string;
  bypassType?: BypassType;
}

export interface CourseFolder {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
}

export interface TabGroup {
  id: string;
  courseId?: string;
  sessionId?: string;
  courseName: string;
  name: string;
  task?: string;
  tabs: { title: string; url: string; domain: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface SavedSource {
  id: string;
  course?: string;
  sessionId?: string;
  title: string;
  url: string;
  domain: string;
  sourceType: SourceType;
  assignment?: string;
  author?: string;
  publisher?: string;
  publishedDate?: string;
  accessedAt: string;
  selectedText?: string;
  note?: string;
  tags: string[];
  citationDraft: string;
}

export interface HighlightNote {
  id: string;
  sourceId?: string;
  course?: string;
  sessionId?: string;
  url: string;
  pageTitle: string;
  selectedText: string;
  note?: string;
  tags: string[];
  createdAt: string;
}

export interface Flashcard {
  id: string;
  course?: string;
  sourceId?: string;
  highlightId?: string;
  front: string;
  back: string;
  tags: string[];
  sourceUrl?: string;
  createdAt: string;
}

export interface Settings {
  defaultBlockedDomains: string[];
  defaultAllowedDomains: string[];
  defaultSessionLength: number;
  defaultStrictness: Strictness;
  enableAllowlist: boolean;
  showTimer: boolean;
  logBypassReasons: boolean;
}

export interface BypassGrant {
  sessionId: string;
  url: string;
  expiresAt: string;
}

export interface BlockingDecision {
  shouldBlock: boolean;
  reason: string;
  domain?: string;
  modeTriggered?: BlockingMode;
}

export const STORAGE_KEYS = {
  sessions: "studylock_sessions",
  activeSessionId: "studylock_active_session_id",
  blockedAttempts: "studylock_blocked_attempts",
  sources: "studylock_sources",
  highlights: "studylock_highlights",
  flashcards: "studylock_flashcards",
  tabGroups: "studylock_tab_groups",
  settings: "studylock_settings",
  bypassGrants: "studylock_bypass_grants",
  schemaVersion: "studylock_schema_version"
} as const;
