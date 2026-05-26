import { BlockedAttempt, Flashcard, HighlightNote, SavedSource, StudySession, TabGroup } from "./types";

export interface ActivityItem {
  id: string;
  label: string;
  subLabel: string;
  timestamp: string;
}

export function buildActivity(
  sessions: StudySession[],
  sources: SavedSource[],
  highlights: HighlightNote[],
  flashcards: Flashcard[],
  tabGroups: TabGroup[],
  attempts: BlockedAttempt[],
  maxItems = 5
): ActivityItem[] {
  const items: ActivityItem[] = [
    ...sessions.map((s) => ({
      id: s.id,
      label: `Session: ${s.course} — ${s.task}`,
      subLabel: s.status,
      timestamp: s.startTime ?? ""
    })),
    ...sources.map((s) => ({
      id: s.id,
      label: `Source: ${s.title}`,
      subLabel: s.domain,
      timestamp: s.accessedAt
    })),
    ...highlights.map((h) => ({
      id: h.id,
      label: `Highlight: ${h.pageTitle}`,
      subLabel: h.selectedText.length > 70 ? h.selectedText.slice(0, 70) + "…" : h.selectedText,
      timestamp: h.createdAt
    })),
    ...flashcards.map((f) => ({
      id: f.id,
      label: `Flashcard: ${f.front.length > 60 ? f.front.slice(0, 60) + "…" : f.front}`,
      subLabel: f.course ?? "",
      timestamp: f.createdAt
    })),
    ...tabGroups.map((g) => ({
      id: g.id,
      label: `Tab group: ${g.name}`,
      subLabel: g.courseName,
      timestamp: g.createdAt
    })),
    ...attempts.map((a) => ({
      id: a.id,
      label: `Blocked: ${a.domain}`,
      subLabel: a.bypassed ? "bypassed" : "blocked",
      timestamp: a.timestamp
    }))
  ];

  return items
    .filter((item) => Boolean(item.timestamp))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, maxItems);
}
