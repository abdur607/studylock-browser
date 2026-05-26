import { focusedMinutes } from "../lib/sessionManager";
import { StudySession } from "../lib/types";

export function SessionCard({ session }: { session: StudySession }) {
  return (
    <article className="item-card">
      <div>
        <strong>{session.course}</strong> {session.task}
      </div>
      <p>{session.goal || "No goal saved."}</p>
      <div className="pill-row">
        <span className={`status-${session.status}`}>{session.status}</span>
        <span>{focusedMinutes(session)} min focused</span>
        <span>{session.blockedAttemptCount} blocks</span>
        <span>{session.bypassCount} bypasses</span>
        <span>{session.sourcesSavedCount} sources captured</span>
        <span>{session.notesCreatedCount} notes created</span>
        <span>{session.flashcardsCreatedCount} cards created</span>
        {session.tabGroupsSavedCount ? <span>{session.tabGroupsSavedCount} tab groups saved</span> : null}
      </div>
      {session.reflection ? <p><strong>Reflection:</strong> {session.reflection}</p> : null}
    </article>
  );
}
