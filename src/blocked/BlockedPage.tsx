import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { getActiveSession } from "../lib/storage";
import { formatDuration, getTimeRemainingMs } from "../lib/sessionManager";
import { StudySession } from "../lib/types";
import "./blocked.css";

function useCountdown(session?: StudySession) {
  const [remaining, setRemaining] = useState(() => getTimeRemainingMs(session));
  useEffect(() => {
    setRemaining(getTimeRemainingMs(session));
    const id = window.setInterval(() => setRemaining(getTimeRemainingMs(session)), 1000);
    return () => window.clearInterval(id);
  }, [session]);
  return remaining;
}

function BlockedPage() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const attemptedUrl = params.get("url") ?? "";
  const domain = params.get("domain") ?? "this site";
  const attemptId = params.get("attemptId") ?? "";

  const [session, setSession] = useState<StudySession>();
  const [reasonText, setReasonText] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [waitLeft, setWaitLeft] = useState(0);
  const [bypassing, setBypassing] = useState(false);
  const sessionRemaining = useCountdown(session);

  useEffect(() => {
    void getActiveSession().then(setSession);
  }, []);

  useEffect(() => {
    if (!session) return;
    const seconds = session.strictness === "strict" ? 60 : session.strictness === "normal" ? 30 : 0;
    setWaitLeft(seconds);
    if (!seconds) return;
    const id = window.setInterval(() => setWaitLeft((prev) => {
      if (prev <= 1) { clearInterval(id); return 0; }
      return prev - 1;
    }), 1000);
    return () => window.clearInterval(id);
  }, [session?.strictness]);

  const strictness = session?.strictness ?? "normal";

  const minReasonLength = strictness === "soft" ? 0 : 10;
  const reasonOk = reasonText.trim().length >= minReasonLength;
  const checkboxOk = strictness !== "strict" || confirmed;
  const canBypass = !bypassing && waitLeft === 0 && reasonOk && checkboxOk;

  async function bypass() {
    setBypassing(true);
    const bypassType = strictness === "soft" ? "soft" : strictness === "strict" ? "emergency" : "normal";
    await chrome.runtime.sendMessage({
      type: "BYPASS_BLOCK",
      url: attemptedUrl,
      attemptId,
      reason: reasonText,
      bypassType
    });
    window.location.href = attemptedUrl;
  }

  function goBack() {
    window.location.href = chrome.runtime.getURL("src/dashboard/dashboard.html");
  }

  const title = session ? `${session.course} ${session.task}` : "your study session";

  const buttonLabel = () => {
    if (bypassing) return "Unlocking…";
    if (waitLeft > 0) return `Wait ${waitLeft}s`;
    if (strictness === "strict") return "Emergency unlock";
    return "Continue anyway";
  };

  return (
    <main className="blocked-page">
      <section className="blocked-panel">
        <div className="eyebrow">Focus Mode — {strictness} strictness</div>

        <h1>
          You tried to open <span className="highlight-domain">{domain}</span> during {title}.
        </h1>

        {session?.goal ? (
          <p className="goal-line">
            <strong>Goal:</strong> {session.goal}
          </p>
        ) : null}

        <p>This site is blocked because you chose to focus{session ? ` for ${session.durationMinutes} minutes` : ""}.</p>

        <div className="meta">
          <div><strong>Mode:</strong> {session?.mode ?? "blocklist"}</div>
          <div><strong>Strictness:</strong> {strictness}</div>
          <div><strong>Time remaining in session:</strong> {formatDuration(sessionRemaining)}</div>
        </div>

        {strictness === "strict" ? (
          <div className="strict-notice">
            This site stays blocked until your session ends. Emergency unlock requires a{" "}
            <strong>60-second pause</strong>, a written reason, and your acknowledgement.
          </div>
        ) : null}

        {strictness !== "soft" ? (
          <label className="reason-label">
            {strictness === "strict" ? "Emergency reason (10 chars min)" : "Why do you need this site right now? (10 chars min)"}
            <textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="Be specific — this is logged with your session."
              disabled={bypassing}
            />
            {reasonText.trim().length > 0 && !reasonOk ? (
              <span className="reason-hint">{reasonText.trim().length}/10 characters</span>
            ) : null}
          </label>
        ) : null}

        {strictness === "strict" ? (
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              disabled={bypassing}
            />
            I understand this emergency bypass will be logged with my session.
          </label>
        ) : null}

        <div className="actions">
          <button className="secondary" onClick={goBack} disabled={bypassing}>
            Return to study dashboard
          </button>
          <button
            className={strictness === "strict" ? "danger" : ""}
            disabled={!canBypass}
            onClick={() => void bypass()}
          >
            {buttonLabel()}
          </button>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<BlockedPage />);
