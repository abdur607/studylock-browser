import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { isLikelyDomain, parseDomainList } from "../lib/domainUtils";
import { saveFlashcard } from "../lib/flashcardManager";
import { saveHighlight } from "../lib/highlightManager";
import { completeActiveSession, expireSessionIfNeeded, focusedMinutes, formatDuration, getTimeRemainingMs } from "../lib/sessionManager";
import { getActiveSession, getSettings, updateItem } from "../lib/storage";
import { saveSource } from "../lib/sourceManager";
import { saveCurrentTabs } from "../lib/tabGroupManager";
import { HighlightNote, Settings, STORAGE_KEYS, SourceType, StudySession } from "../lib/types";
import "./popup.css";

type CaptureTab = { title: string; url: string; selectedText: string };

async function getCurrentTab(): Promise<chrome.tabs.Tab | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function getSelectedText(tabId?: number): Promise<string> {
  if (!tabId) return "";
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => window.getSelection()?.toString() ?? ""
    });
    return String(result.result ?? "");
  } catch {
    return "";
  }
}

async function getCaptureTab(): Promise<CaptureTab | undefined> {
  const tab = await getCurrentTab();
  if (!tab?.url) return undefined;
  return { title: tab.title ?? "Untitled Page", url: tab.url, selectedText: await getSelectedText(tab.id) };
}

function tagList(value: string): string[] {
  return value.split(",").map((t) => t.trim()).filter(Boolean);
}

function SessionSummary({
  session,
  onDismiss,
  onSaveReflection
}: {
  session: StudySession;
  onDismiss: () => void;
  onSaveReflection?: (text: string) => Promise<void>;
}) {
  const [draftReflection, setDraftReflection] = useState("");
  const actual = focusedMinutes(session);

  function exportSummary() {
    const lines = [
      `# Session Summary — ${session.course} ${session.task}`,
      "",
      `**Goal:** ${session.goal || "—"}`,
      `**Planned duration:** ${session.durationMinutes} min`,
      `**Actual focused time:** ${actual} min`,
      `**Blocked attempts:** ${session.blockedAttemptCount}`,
      `**Bypasses:** ${session.bypassCount}`,
      `**Sources captured:** ${session.sourcesSavedCount}`,
      `**Notes created:** ${session.notesCreatedCount}`,
      `**Flashcards created:** ${session.flashcardsCreatedCount}`,
      `**Tab groups saved:** ${session.tabGroupsSavedCount ?? 0}`,
      session.reflection ? `\n**Reflection:** ${session.reflection}` : ""
    ].filter((l) => l !== undefined);
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `studylock-summary-${session.course.toLowerCase().replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="card summary-card">
      <div className="summary-header">
        <div>
          <div className="eyebrow">Session complete</div>
          <h2>{session.course} — {session.task}</h2>
        </div>
        <button className="secondary icon-btn" onClick={onDismiss} title="Dismiss">✕</button>
      </div>
      {session.goal ? <p className="muted">{session.goal}</p> : null}
      <div className="stats summary-stats">
        <div className="stat"><strong>{actual}</strong><span>min focused</span></div>
        <div className="stat"><strong>{session.durationMinutes}</strong><span>planned</span></div>
        <div className="stat"><strong>{session.blockedAttemptCount}</strong><span>blocks</span></div>
        <div className="stat"><strong>{session.bypassCount}</strong><span>bypasses</span></div>
        <div className="stat"><strong>{session.sourcesSavedCount}</strong><span>sources captured</span></div>
        <div className="stat"><strong>{session.notesCreatedCount}</strong><span>notes created</span></div>
        <div className="stat"><strong>{session.flashcardsCreatedCount}</strong><span>cards created</span></div>
        <div className="stat"><strong>{session.tabGroupsSavedCount}</strong><span>tab groups saved</span></div>
      </div>
      {session.reflection ? (
        <div className="reflection-box">
          <span className="reflection-label">Reflection</span>
          <p>{session.reflection}</p>
        </div>
      ) : onSaveReflection ? (
        <div className="citation-details">
          <label>Add a reflection
            <textarea value={draftReflection} onChange={(e) => setDraftReflection(e.target.value)} placeholder="What did you get done?" />
          </label>
          <button className="secondary small" onClick={() => void onSaveReflection(draftReflection)}>Save reflection</button>
        </div>
      ) : null}
      <div className="summary-actions">
        <button className="secondary" onClick={exportSummary}>Export summary</button>
        <button onClick={openDashboard}>Open dashboard</button>
      </div>
    </section>
  );
}

function openDashboard() {
  chrome.tabs.create({ url: chrome.runtime.getURL("src/dashboard/dashboard.html") });
}

function Popup() {
  const [settings, setSettings] = useState<Settings>();
  const [session, setSession] = useState<StudySession>();
  const [lastSummary, setLastSummary] = useState<StudySession>();
  const [remaining, setRemaining] = useState(0);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"info" | "success" | "error">("info");
  const msgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [course, setCourse] = useState("Chemistry");
  const [task, setTask] = useState("Final Review");
  const [duration, setDuration] = useState(60);
  const [goal, setGoal] = useState("Review lectures and create flashcards");
  const [mode, setMode] = useState<"blocklist" | "allowlist">("blocklist");
  const [strictness, setStrictness] = useState<"soft" | "normal" | "strict">("normal");
  const [blockedDomains, setBlockedDomains] = useState("reddit.com, instagram.com, tiktok.com, x.com, netflix.com");
  const [allowedDomains, setAllowedDomains] = useState("courseworks.columbia.edu, docs.google.com, openstax.org");
  const [captureNote, setCaptureNote] = useState("");
  const [captureTags, setCaptureTags] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("webpage");
  const [assignment, setAssignment] = useState("");
  const [showCitationDetails, setShowCitationDetails] = useState(false);
  const [citationAuthor, setCitationAuthor] = useState("");
  const [citationPublisher, setCitationPublisher] = useState("");
  const [citationDate, setCitationDate] = useState("");
  const [flashFront, setFlashFront] = useState("");
  const [flashBack, setFlashBack] = useState("");
  const [reflection, setReflection] = useState("");
  const [lastSavedHighlight, setLastSavedHighlight] = useState<HighlightNote>();

  function showTempMessage(text: string, type: "success" | "error" | "info" = "info", durationMs = 3000) {
    if (msgTimerRef.current !== null) clearTimeout(msgTimerRef.current);
    setMessage(text);
    setMessageType(type);
    if (type === "success") {
      msgTimerRef.current = setTimeout(() => {
        setMessage("");
        msgTimerRef.current = null;
      }, durationMs);
    }
  }

  async function refresh() {
    const justExpired = await expireSessionIfNeeded();
    if (justExpired) {
      setLastSummary(justExpired);
      setMessage("Your session time is up.");
    }
    setSession(await getActiveSession());
    setSettings(await getSettings());
  }

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 3000);
    return () => {
      window.clearInterval(id);
      if (msgTimerRef.current !== null) clearTimeout(msgTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setRemaining(getTimeRemainingMs(session)), 1000);
    setRemaining(getTimeRemainingMs(session));
    return () => window.clearInterval(id);
  }, [session]);

  useEffect(() => {
    if (!settings) return;
    setDuration(settings.defaultSessionLength);
    setStrictness(settings.defaultStrictness);
    setBlockedDomains(settings.defaultBlockedDomains.join(", "));
    setAllowedDomains(settings.defaultAllowedDomains.join(", "));
    setMode(settings.enableAllowlist ? "allowlist" : "blocklist");
  }, [settings]);

  const activeTitle = useMemo(() => (session ? `${session.course} — ${session.task}` : ""), [session]);

  async function handleStart() {
    if (!course.trim()) { setMessage("Course name is required."); return; }
    if (!task.trim()) { setMessage("Task is required."); return; }
    if (duration < 5) { setMessage("Session duration must be at least 5 minutes."); return; }
    const parsedAllowed = parseDomainList(allowedDomains).filter(isLikelyDomain);
    const parsedBlocked = parseDomainList(blockedDomains).filter(isLikelyDomain);
    if (mode === "allowlist" && parsedAllowed.length === 0) {
      setMessage("Allowlist mode requires at least one allowed domain.");
      return;
    }
    const { startSession } = await import("../lib/sessionManager");
    const next = await startSession({
      course: course.trim(),
      task: task.trim(),
      durationMinutes: duration,
      goal,
      mode,
      strictness,
      blockedDomains: parsedBlocked,
      allowedDomains: parsedAllowed,
      endTime: undefined
    });
    setSession(next);
    setLastSummary(undefined);

    const { decideBlocking } = await import("../lib/blockingEngine");
    const allTabs = await chrome.tabs.query({ currentWindow: true });
    const distractingCount = allTabs.filter((tab) => tab.url && decideBlocking(tab.url, next).shouldBlock).length;

    const baseMsg =
      mode === "blocklist" && parsedBlocked.length === 0
        ? "Session started. No blocked domains set — nothing will be blocked."
        : "Study session started.";

    setMessage(
      distractingCount > 0
        ? `${baseMsg} ${distractingCount} distracting tab(s) open — use "Close distracting tabs" to remove them.`
        : baseMsg
    );
  }

  async function handleEnd() {
    const done = await completeActiveSession(reflection);
    setSession(undefined);
    setReflection("");
    if (done) {
      setLastSummary(done);
      setMessage("");
    } else {
      setMessage("No active session.");
    }
  }

  async function handleCloseDistractingTabs() {
    if (!session) return;
    const { decideBlocking } = await import("../lib/blockingEngine");
    const allTabs = await chrome.tabs.query({ currentWindow: true });
    const distracting = allTabs.filter((tab) => tab.url && decideBlocking(tab.url, session).shouldBlock);

    if (!distracting.length) {
      setMessage("No distracting tabs found.");
      return;
    }

    const pinned = distracting.filter((tab) => tab.pinned);
    const unpinned = distracting.filter((tab) => !tab.pinned);

    if (!unpinned.length) {
      setMessage(`Only ${pinned.length} pinned distracting tab(s) found — not closing pinned tabs.`);
      return;
    }

    const pinnedNote = pinned.length ? ` ${pinned.length} pinned tab(s) will be skipped.` : "";
    if (!window.confirm(`Close ${unpinned.length} distracting tab(s)?${pinnedNote}`)) return;

    const ids = unpinned.map((tab) => tab.id).filter((id): id is number => id !== undefined);
    if (ids.length) await chrome.tabs.remove(ids);
    setMessage(`Closed ${ids.length} distracting tab(s).${pinned.length ? ` ${pinned.length} pinned tab(s) skipped.` : ""}`);
  }

  async function handleSaveTabs() {
    const group = await saveCurrentTabs(session?.course ?? course, `${session?.task ?? task} tabs`, session?.task ?? task);
    showTempMessage(`Saved ${group.tabs.length} tab${group.tabs.length !== 1 ? "s" : ""} to this session.`, "success");
  }

  async function handleSaveSource() {
    const tab = await getCaptureTab();
    if (!tab) {
      setMessage("Open a normal webpage before saving a source.");
      return;
    }
    await saveSource({
      ...tab,
      note: captureNote,
      course: session?.course ?? course,
      sourceType,
      assignment: assignment || undefined,
      author: citationAuthor.trim() || undefined,
      publisher: citationPublisher.trim() || undefined,
      publishedDate: citationDate.trim() || undefined,
      tags: tagList(captureTags)
    });
    setCaptureNote("");
    showTempMessage("Source saved to this session.", "success");
    await refresh();
  }

  async function handleSaveHighlight() {
    const tab = await getCaptureTab();
    if (!tab?.selectedText.trim()) {
      setMessage("Select text on the page first, then save a highlight.");
      return;
    }
    const highlight = await saveHighlight({
      url: tab.url,
      pageTitle: tab.title,
      selectedText: tab.selectedText,
      note: captureNote,
      course: session?.course ?? course,
      tags: tagList(captureTags)
    });
    setLastSavedHighlight(highlight);
    setFlashBack(tab.selectedText);
    setCaptureNote("");
    setMessage("Highlight saved. You can turn it into a flashcard below.");
    await refresh();
  }

  async function handleCreateFlashcard() {
    const tab = await getCaptureTab();
    const back = flashBack || tab?.selectedText || "";
    if (!flashFront.trim() || !back.trim()) {
      setMessage("Add a front and back for the flashcard. Selected text can be the back.");
      return;
    }
    const highlightLink =
      lastSavedHighlight && back === lastSavedHighlight.selectedText ? lastSavedHighlight : undefined;
    await saveFlashcard({
      front: flashFront,
      back,
      course: session?.course ?? course,
      tags: tagList(captureTags),
      sourceUrl: tab?.url,
      highlightId: highlightLink?.id,
      sourceId: highlightLink?.sourceId
    });
    setFlashFront("");
    setFlashBack("");
    setLastSavedHighlight(undefined);
    setMessage("Flashcard saved.");
    await refresh();
  }

  async function handleSaveExpiredReflection(text: string) {
    if (!lastSummary || !text.trim()) return;
    const updated = await updateItem<StudySession>(STORAGE_KEYS.sessions, lastSummary.id, {
      reflection: text.trim()
    });
    if (updated) setLastSummary(updated);
  }

  return (
    <main className="popup">
      <div className="topbar">
        <div>
          <div className="brand">StudyLock</div>
          <div className="muted">Local study workspace</div>
        </div>
        <button className="secondary" onClick={openDashboard}>Dashboard</button>
      </div>

      {message ? <div className={`message ${messageType}`} role="status" aria-live="polite">{message}</div> : null}

      {lastSummary && !session ? (
        <SessionSummary
          session={lastSummary}
          onDismiss={() => setLastSummary(undefined)}
          onSaveReflection={handleSaveExpiredReflection}
        />
      ) : null}

      {session ? (
        <section className="card">
          <h2>{activeTitle}</h2>
          <div className="muted">{session.goal}</div>
          <div className="stats">
            <div className="stat"><strong>{formatDuration(remaining)}</strong><span>left</span></div>
            <div className="stat"><strong>{session.blockedAttemptCount}</strong><span>blocks</span></div>
            <div className="stat"><strong>{session.sourcesSavedCount}</strong><span>sources captured</span></div>
            <div className="stat"><strong>{session.flashcardsCreatedCount}</strong><span>cards created</span></div>
          </div>
          <label>
            Session reflection
            <textarea value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder="What did you get done?" />
          </label>
          <div className="grid">
            <button className="warning full" onClick={handleEnd}>End session and show summary</button>
            <button className="secondary" onClick={handleCloseDistractingTabs}>Close distracting tabs</button>
          </div>
        </section>
      ) : !lastSummary ? (
        <section className="card">
          <h2>Start a study session</h2>
          <div className="grid">
            <label>Course<input value={course} onChange={(e) => setCourse(e.target.value)} /></label>
            <label>Task<input value={task} onChange={(e) => setTask(e.target.value)} /></label>
          </div>
          <label>Goal<textarea value={goal} onChange={(e) => setGoal(e.target.value)} /></label>
          <div className="grid">
            <label>Duration (min)<input type="number" value={duration} min={5} onChange={(e) => setDuration(Number(e.target.value))} /></label>
            <label>Strictness
              <select value={strictness} onChange={(e) => setStrictness(e.target.value as typeof strictness)}>
                <option value="soft">Soft — continue freely</option>
                <option value="normal">Normal — 30s + reason</option>
                <option value="strict">Strict — 60s + reason</option>
              </select>
            </label>
          </div>
          <label>Mode
            <select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
              <option value="blocklist">Blocklist — block specific sites</option>
              <option value="allowlist">Allowlist — only allow listed sites</option>
            </select>
          </label>
          <label>Blocked domains<textarea value={blockedDomains} onChange={(e) => setBlockedDomains(e.target.value)} /></label>
          <label>Allowed domains<textarea value={allowedDomains} onChange={(e) => setAllowedDomains(e.target.value)} /></label>
          <button className="full primary" onClick={handleStart}>Start session</button>
        </section>
      ) : null}

      <section className="card">
        <h3>Capture study work</h3>
        <div className="grid">
          <label>Source type
            <select value={sourceType} onChange={(e) => setSourceType(e.target.value as SourceType)}>
              <option value="webpage">Webpage</option>
              <option value="article">Article</option>
              <option value="video">Video</option>
              <option value="pdf">PDF</option>
              <option value="textbook">Textbook</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>Assignment / project
            <input value={assignment} onChange={(e) => setAssignment(e.target.value)} placeholder="e.g. Chemistry Final" />
          </label>
        </div>
        <label>Note<textarea value={captureNote} onChange={(e) => setCaptureNote(e.target.value)} placeholder="Optional note for source or highlight" /></label>
        <label>Tags<input value={captureTags} onChange={(e) => setCaptureTags(e.target.value)} placeholder="exam, chapter 8" /></label>
        <button className="secondary small toggle-btn" onClick={() => setShowCitationDetails(!showCitationDetails)}>
          {showCitationDetails ? "Hide" : "Add"} citation details
        </button>
        {showCitationDetails ? (
          <div className="citation-details">
            <label>Author<input value={citationAuthor} onChange={(e) => setCitationAuthor(e.target.value)} placeholder="First Last" /></label>
            <label>Publisher<input value={citationPublisher} onChange={(e) => setCitationPublisher(e.target.value)} placeholder="Publisher name" /></label>
            <label>Published date<input value={citationDate} onChange={(e) => setCitationDate(e.target.value)} placeholder="2024 or Jan 2024" /></label>
          </div>
        ) : null}
        <div className="grid">
          <button onClick={handleSaveSource}>Save source</button>
          <button onClick={handleSaveHighlight}>Save highlight</button>
        </div>
      </section>

      <section className="card">
        <h3>Create flashcard</h3>
        <label>Front (question or term)<input value={flashFront} onChange={(e) => setFlashFront(e.target.value)} placeholder="Question or term" /></label>
        <label>Back (answer or definition)<textarea value={flashBack} onChange={(e) => setFlashBack(e.target.value)} placeholder="Answer or selected text" /></label>
        <div className="grid">
          <button onClick={handleCreateFlashcard}>Create card</button>
          <button className="secondary" onClick={handleSaveTabs}>Save current tabs</button>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Popup />);
