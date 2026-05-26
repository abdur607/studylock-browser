import { ActivityItem, buildActivity } from "../lib/recentActivity";
import { BlockedAttempt, Flashcard, HighlightNote, SavedSource, StudySession, TabGroup } from "../lib/types";

export function RecentActivity({
  sessions,
  sources,
  highlights,
  flashcards,
  tabGroups,
  attempts
}: {
  sessions: StudySession[];
  sources: SavedSource[];
  highlights: HighlightNote[];
  flashcards: Flashcard[];
  tabGroups: TabGroup[];
  attempts: BlockedAttempt[];
}) {
  const items: ActivityItem[] = buildActivity(sessions, sources, highlights, flashcards, tabGroups, attempts);

  if (!items.length) return null;

  return (
    <section className="panel">
      <h3>Recent activity</h3>
      <ul className="activity-list">
        {items.map((item) => (
          <li key={item.id} className="activity-item">
            <span className="activity-label">{item.label}</span>
            {item.subLabel ? <span className="activity-sub">{item.subLabel}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
