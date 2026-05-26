import { BlockedAttempt, Flashcard, HighlightNote, SavedSource, StudySession, TabGroup } from "./types";
import { focusedMinutes } from "./sessionManager";

export function filterAttemptsBySessionIds(
  attempts: BlockedAttempt[],
  sessionIds: ReadonlySet<string>
): BlockedAttempt[] {
  return attempts.filter((a) => sessionIds.has(a.sessionId));
}

export function buildAnalytics(data: {
  sessions: StudySession[];
  attempts: BlockedAttempt[];
  sources: SavedSource[];
  highlights: HighlightNote[];
  flashcards: Flashcard[];
  tabGroups: TabGroup[];
}) {
  const focusMinutesByCourse = data.sessions.reduce<Record<string, number>>((acc, session) => {
    acc[session.course] = (acc[session.course] ?? 0) + focusedMinutes(session);
    return acc;
  }, {});

  const blockedDomains = data.attempts.reduce<Record<string, number>>((acc, attempt) => {
    acc[attempt.domain] = (acc[attempt.domain] ?? 0) + 1;
    return acc;
  }, {});

  return {
    totalFocusedTime: data.sessions.reduce((sum, session) => sum + focusedMinutes(session), 0),
    sessionsCompleted: data.sessions.filter((session) => session.status === "completed").length,
    blockedAttempts: data.attempts.length,
    bypassAttempts: data.attempts.filter((attempt) => attempt.bypassed).length,
    mostBlockedDomains: Object.entries(blockedDomains).sort((a, b) => b[1] - a[1]).slice(0, 5),
    sourcesSaved: data.sources.length,
    highlightsCreated: data.highlights.length,
    flashcardsCreated: data.flashcards.length,
    tabGroupsSaved: data.tabGroups.length,
    focusMinutesByCourse
  };
}
