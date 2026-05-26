import { buildAnalytics } from "../lib/analytics";
import { BlockedAttempt, Flashcard, HighlightNote, SavedSource, StudySession, TabGroup } from "../lib/types";

export function AnalyticsCards({ data }: { data: { sessions: StudySession[]; attempts: BlockedAttempt[]; sources: SavedSource[]; highlights: HighlightNote[]; flashcards: Flashcard[]; tabGroups: TabGroup[] } }) {
  const analytics = buildAnalytics(data);
  const cards = [
    ["Focused time", `${analytics.totalFocusedTime} min`],
    ["Completed sessions", analytics.sessionsCompleted],
    ["Blocked attempts", analytics.blockedAttempts],
    ["Bypasses", analytics.bypassAttempts],
    ["Sources", analytics.sourcesSaved],
    ["Highlights", analytics.highlightsCreated],
    ["Flashcards", analytics.flashcardsCreated],
    ["Tab groups", analytics.tabGroupsSaved]
  ];

  return (
    <>
      <div className="analytics-grid">
        {cards.map(([label, value]) => (
          <div className="analytics-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <section className="panel">
        <h3>Most blocked domains</h3>
        {analytics.mostBlockedDomains.length
          ? analytics.mostBlockedDomains.map(([domain, count]) => (
              <div key={domain} className="activity-item">
                <span className="activity-label">{domain}</span>
                <span className="activity-sub">{count} attempt{count !== 1 ? "s" : ""}</span>
              </div>
            ))
          : <p className="muted-text">No blocked attempts yet.</p>}
        <h3 style={{ marginTop: "14px" }}>Focus minutes by course</h3>
        {Object.entries(analytics.focusMinutesByCourse).length
          ? Object.entries(analytics.focusMinutesByCourse).map(([course, minutes]) => (
              <div key={course} className="activity-item">
                <span className="activity-label">{course}</span>
                <span className="activity-sub">{minutes} min</span>
              </div>
            ))
          : <p className="muted-text">No focus time yet.</p>}
      </section>
    </>
  );
}
