import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { AnalyticsCards } from "../components/AnalyticsCards";
import { FlashcardCard } from "../components/FlashcardCard";
import { HighlightCard } from "../components/HighlightCard";
import { RecentActivity } from "../components/RecentActivity";
import { SessionCard } from "../components/SessionCard";
import { SourceCard } from "../components/SourceCard";
import { TabGroupCard } from "../components/TabGroupCard";
import { ImportPayload, exportAllJson, exportFlashcardsCsv, exportHighlightsMarkdown, exportSessionsMarkdown, exportSourcesMarkdown, parseImportPayload } from "../lib/exportUtils";
import { normalizeImportPayload } from "../lib/importUtils";
import { filterAttemptsBySessionIds } from "../lib/analytics";
import { seedDemoData } from "../lib/demoData";
import { saveFlashcard } from "../lib/flashcardManager";
import { repairStorageConsistency, runMigrations } from "../lib/migration";
import { includesQuery } from "../lib/searchUtils";
import { findHighlightRelationships, findSourceRelationships, SourceRelationships } from "../lib/sourceRelationships";
import { clearAllLocalData, getArray, getSettings, removeItem, saveSettings, setActiveSession, setArray, updateItem } from "../lib/storage";
import { deleteTabGroup, renameTabGroup, restoreTabGroup } from "../lib/tabGroupManager";
import { BlockedAttempt, Flashcard, HighlightNote, SavedSource, Settings, STORAGE_KEYS, StudySession, TabGroup } from "../lib/types";
import "./dashboard.css";

type TabName = "Overview" | "Sessions" | "Sources" | "Highlights/Notes" | "Flashcards" | "Tab Groups" | "Settings" | "Export";

const TABS: TabName[] = ["Overview", "Sessions", "Sources", "Highlights/Notes", "Flashcards", "Tab Groups", "Settings", "Export"];

function listText(value: string[]): string { return value.join(", "); }
function parseList(value: string): string[] { return value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean); }

function CourseFilter({ courses, value, onChange }: { courses: string[]; value: string; onChange: (v: string) => void }) {
  if (!courses.length) return null;
  return (
    <div className="course-filter">
      <label>
        Course filter
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">All courses</option>
          {courses.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
    </div>
  );
}

function EmptyState({ label, onLoadDemo }: { label: string; onLoadDemo?: () => void }) {
  return (
    <div className="empty-state">
      <p>{label}</p>
      {onLoadDemo ? (
        <button className="secondary" onClick={onLoadDemo}>Load demo data</button>
      ) : null}
    </div>
  );
}

function ImportModal({
  payload,
  onReplace,
  onMerge,
  onCancel
}: {
  payload: ImportPayload;
  onReplace: () => void;
  onMerge: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Import StudyLock data</h3>
        <p>Found in the file:</p>
        <ul>
          <li>{payload.sessions.length} session(s)</li>
          <li>{payload.sources.length} source(s)</li>
          <li>{payload.highlights.length} highlight(s)</li>
          <li>{payload.flashcards.length} flashcard(s)</li>
          <li>{payload.tabGroups.length} tab group(s)</li>
          <li>{payload.attempts.length} blocked attempt(s)</li>
          {payload.settings ? <li>Settings included</li> : null}
        </ul>
        {payload.skippedCount > 0 ? (
          <p className="import-warning">{payload.skippedCount} item(s) skipped — they did not match the expected format.</p>
        ) : null}
        <p>How would you like to import?</p>
        <div className="modal-actions">
          <button className="danger" onClick={onReplace}>Replace all data</button>
          <button onClick={onMerge}>Merge (add new items)</button>
          <button className="secondary" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function DeleteSourceModal({
  source,
  relationships,
  onDeleteSourceOnly,
  onDeleteWithRelated,
  onCancel
}: {
  source: SavedSource;
  relationships: SourceRelationships;
  onDeleteSourceOnly: () => void;
  onDeleteWithRelated: () => void;
  onCancel: () => void;
}) {
  const { relatedHighlights, directFlashcards, indirectFlashcards, allRelatedFlashcards } = relationships;
  const hasRelated = relatedHighlights.length > 0 || allRelatedFlashcards.length > 0;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Delete source</h3>
        <p><strong>{source.title}</strong></p>
        {hasRelated ? (
          <>
            <p>Related items that will be affected:</p>
            <ul>
              {relatedHighlights.length > 0 ? <li>{relatedHighlights.length} highlight(s)</li> : null}
              {directFlashcards.length > 0 ? <li>{directFlashcards.length} flashcard(s) directly linked to this source</li> : null}
              {indirectFlashcards.length > 0 ? <li>{indirectFlashcards.length} flashcard(s) linked via related highlights</li> : null}
            </ul>
            <div className="modal-actions">
              <button className="danger" onClick={onDeleteWithRelated}>Delete source + related items</button>
              <button onClick={onDeleteSourceOnly}>Delete source only</button>
              <button className="secondary" onClick={onCancel}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <p>Delete this source? This cannot be undone.</p>
            <div className="modal-actions">
              <button className="danger" onClick={onDeleteWithRelated}>Delete</button>
              <button className="secondary" onClick={onCancel}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DeleteHighlightModal({
  highlight,
  relatedFlashcards,
  onDeleteOnly,
  onDeleteWithRelated,
  onCancel
}: {
  highlight: HighlightNote;
  relatedFlashcards: Flashcard[];
  onDeleteOnly: () => void;
  onDeleteWithRelated: () => void;
  onCancel: () => void;
}) {
  const preview = highlight.selectedText.length > 100
    ? `${highlight.selectedText.slice(0, 100)}…`
    : highlight.selectedText;
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Delete highlight?</h3>
        <p><em>{preview}</em></p>
        {relatedFlashcards.length > 0 ? (
          <>
            <p>This highlight has {relatedFlashcards.length} related flashcard(s). What would you like to do?</p>
            <div className="modal-actions">
              <button className="danger" onClick={onDeleteWithRelated}>Delete highlight + flashcards</button>
              <button onClick={onDeleteOnly}>Delete highlight only</button>
              <button className="secondary" onClick={onCancel}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <p>Delete this highlight? This cannot be undone.</p>
            <div className="modal-actions">
              <button className="danger" onClick={onDeleteWithRelated}>Delete</button>
              <button className="secondary" onClick={onCancel}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabName>("Overview");
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [attempts, setAttempts] = useState<BlockedAttempt[]>([]);
  const [sources, setSources] = useState<SavedSource[]>([]);
  const [highlights, setHighlights] = useState<HighlightNote[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [tabGroups, setTabGroups] = useState<TabGroup[]>([]);
  const [settings, setSettings] = useState<Settings>();
  const [settingsForm, setSettingsForm] = useState({ blocked: "", allowed: "", length: 60, strictness: "normal", allowlist: false, timer: true, bypassReasons: true });
  const [manualCard, setManualCard] = useState({ front: "", back: "", course: "", tags: "" });
  const [message, setMessage] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [importPending, setImportPending] = useState<ImportPayload | null>(null);
  const [deletePending, setDeletePending] = useState<{ source: SavedSource; rels: SourceRelationships } | null>(null);
  const [deleteHighlightPending, setDeleteHighlightPending] = useState<{ highlight: HighlightNote; relatedFlashcards: Flashcard[] } | null>(null);

  async function refresh() {
    await runMigrations();
    await repairStorageConsistency();
    const [nextSessions, nextAttempts, nextSources, nextHighlights, nextFlashcards, nextTabGroups, nextSettings] = await Promise.all([
      getArray<StudySession>(STORAGE_KEYS.sessions),
      getArray<BlockedAttempt>(STORAGE_KEYS.blockedAttempts),
      getArray<SavedSource>(STORAGE_KEYS.sources),
      getArray<HighlightNote>(STORAGE_KEYS.highlights),
      getArray<Flashcard>(STORAGE_KEYS.flashcards),
      getArray<TabGroup>(STORAGE_KEYS.tabGroups),
      getSettings()
    ]);
    setSessions(nextSessions);
    setAttempts(nextAttempts);
    setSources(nextSources);
    setHighlights(nextHighlights);
    setFlashcards(nextFlashcards);
    setTabGroups(nextTabGroups);
    setSettings(nextSettings);
    setSettingsForm({
      blocked: listText(nextSettings.defaultBlockedDomains),
      allowed: listText(nextSettings.defaultAllowedDomains),
      length: nextSettings.defaultSessionLength,
      strictness: nextSettings.defaultStrictness,
      allowlist: nextSettings.enableAllowlist,
      timer: nextSettings.showTimer,
      bypassReasons: nextSettings.logBypassReasons
    });
  }

  useEffect(() => {
    void refresh();
  }, []);

  const allCourses = useMemo(() => {
    const set = new Set<string>();
    for (const s of sessions) if (s.course) set.add(s.course);
    for (const s of sources) if (s.course) set.add(s.course);
    for (const h of highlights) if (h.course) set.add(h.course);
    for (const f of flashcards) if (f.course) set.add(f.course);
    for (const g of tabGroups) if (g.courseName) set.add(g.courseName);
    return [...set].sort();
  }, [sessions, sources, highlights, flashcards, tabGroups]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let filteredSessions = courseFilter ? sessions.filter((s) => s.course === courseFilter) : sessions;
    let filteredSources = courseFilter ? sources.filter((s) => s.course === courseFilter) : sources;
    let filteredHighlights = courseFilter ? highlights.filter((h) => h.course === courseFilter) : highlights;
    let filteredFlashcards = courseFilter ? flashcards.filter((f) => f.course === courseFilter) : flashcards;
    let filteredTabGroups = courseFilter ? tabGroups.filter((g) => g.courseName === courseFilter) : tabGroups;

    if (q) {
      filteredSources = filteredSources.filter((s) =>
        includesQuery([s.title, s.url, s.domain, s.course, s.assignment, s.sourceType, s.author, s.publisher, s.publishedDate, s.note, s.tags.join(" "), s.citationDraft], q)
      );
      filteredHighlights = filteredHighlights.filter((h) =>
        includesQuery([h.pageTitle, h.url, h.course, h.selectedText, h.note, h.tags.join(" ")], q)
      );
      filteredFlashcards = filteredFlashcards.filter((f) =>
        includesQuery([f.front, f.back, f.course, f.tags.join(" "), f.sourceUrl], q)
      );
    }

    const filteredSessionIds = new Set(filteredSessions.map((s) => s.id));
    return {
      sessions: filteredSessions,
      attempts: filterAttemptsBySessionIds(attempts, filteredSessionIds),
      sources: filteredSources,
      highlights: filteredHighlights,
      flashcards: filteredFlashcards,
      tabGroups: filteredTabGroups
    };
  }, [courseFilter, searchQuery, sessions, attempts, sources, highlights, flashcards, tabGroups]);

  const data = { sessions, attempts, sources, highlights, flashcards, tabGroups };

  async function loadDemo() {
    const hasRealData = sessions.some((s) => !s.id.startsWith("demo_"));
    if (hasRealData && !window.confirm("You already have study data. Load demo data anyway? It will be added without replacing your existing data.")) return;
    const { alreadyLoaded } = await seedDemoData();
    if (alreadyLoaded) {
      setMessage("Demo data is already loaded.");
    } else {
      setMessage("Demo data loaded. Explore the Chemistry Final Review session.");
      await refresh();
    }
  }

  const isEmpty = !sessions.length && !sources.length && !flashcards.length && !highlights.length;

  async function saveSettingsForm() {
    if (!settings) return;
    await saveSettings({
      ...settings,
      defaultBlockedDomains: parseList(settingsForm.blocked),
      defaultAllowedDomains: parseList(settingsForm.allowed),
      defaultSessionLength: settingsForm.length,
      defaultStrictness: settingsForm.strictness as Settings["defaultStrictness"],
      enableAllowlist: settingsForm.allowlist,
      showTimer: settingsForm.timer,
      logBypassReasons: settingsForm.bypassReasons
    });
    setMessage("Settings saved.");
    await refresh();
  }

  async function createManualFlashcard() {
    if (!manualCard.front.trim() || !manualCard.back.trim()) {
      setMessage("A flashcard needs both a front and a back.");
      return;
    }
    await saveFlashcard({
      front: manualCard.front,
      back: manualCard.back,
      course: manualCard.course,
      tags: parseList(manualCard.tags)
    });
    setManualCard({ front: "", back: "", course: "", tags: "" });
    setMessage("Flashcard saved.");
    await refresh();
  }

  async function cardFromHighlight(highlight: HighlightNote) {
    const front = window.prompt("Front of flashcard (question or term)", "");
    if (!front?.trim()) return;
    await saveFlashcard({
      front: front.trim(),
      back: highlight.selectedText,
      course: highlight.course,
      tags: highlight.tags,
      sourceUrl: highlight.url,
      highlightId: highlight.id,
      sourceId: highlight.sourceId
    });
    setMessage("Flashcard created from highlight.");
    await refresh();
  }

  async function resetAll() {
    if (!window.confirm("Reset all StudyLock local data? This cannot be undone.")) return;
    await clearAllLocalData();
    setMessage("All local data has been reset.");
    await refresh();
  }

  const importFileRef = useRef<HTMLInputElement>(null);

  function handleImportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        setMessage("Invalid JSON file — could not parse.");
        if (importFileRef.current) importFileRef.current.value = "";
        return;
      }
      const rawPayload = parseImportPayload(parsed);
      if (!rawPayload) {
        setMessage("File is not a valid StudyLock export. Expected arrays for sessions, attempts, sources, highlights, flashcards, and tabGroups.");
        if (importFileRef.current) importFileRef.current.value = "";
        return;
      }
      setImportPending(normalizeImportPayload(rawPayload));
    });
  }

  function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
    const ids = new Set(existing.map((i) => i.id));
    return [...existing, ...incoming.filter((i) => !ids.has(i.id))];
  }

  async function handleImportReplace() {
    if (!importPending) return;
    const pending = importPending;
    await setArray(STORAGE_KEYS.sessions, pending.sessions);
    await setArray(STORAGE_KEYS.blockedAttempts, pending.attempts);
    await setArray(STORAGE_KEYS.sources, pending.sources);
    await setArray(STORAGE_KEYS.highlights, pending.highlights);
    await setArray(STORAGE_KEYS.flashcards, pending.flashcards);
    await setArray(STORAGE_KEYS.tabGroups, pending.tabGroups);
    await setArray(STORAGE_KEYS.bypassGrants, []);
    await setActiveSession(undefined);
    if (pending.settings) await saveSettings(pending.settings);
    setImportPending(null);
    if (importFileRef.current) importFileRef.current.value = "";
    setMessage(`Replaced all data: ${pending.sessions.length} sessions and ${pending.sources.length} sources imported.`);
    await runMigrations();
    await refresh();
  }

  async function handleImportMerge() {
    if (!importPending) return;
    const pending = importPending;
    await setArray(STORAGE_KEYS.sessions, mergeById(sessions, pending.sessions));
    await setArray(STORAGE_KEYS.blockedAttempts, mergeById(attempts, pending.attempts));
    await setArray(STORAGE_KEYS.sources, mergeById(sources, pending.sources));
    await setArray(STORAGE_KEYS.highlights, mergeById(highlights, pending.highlights));
    await setArray(STORAGE_KEYS.flashcards, mergeById(flashcards, pending.flashcards));
    await setArray(STORAGE_KEYS.tabGroups, mergeById(tabGroups, pending.tabGroups));
    setImportPending(null);
    if (importFileRef.current) importFileRef.current.value = "";
    setMessage("Merged: imported items added without removing existing data.");
    await runMigrations();
    await refresh();
  }

  function handleImportCancel() {
    setImportPending(null);
    if (importFileRef.current) importFileRef.current.value = "";
  }

  async function handleDeleteSourceOnly() {
    if (!deletePending) return;
    const { source, rels: { relatedHighlights, directFlashcards } } = deletePending;
    for (const h of relatedHighlights) {
      await updateItem<HighlightNote>(STORAGE_KEYS.highlights, h.id, { sourceId: undefined });
    }
    for (const f of directFlashcards) {
      await updateItem<Flashcard>(STORAGE_KEYS.flashcards, f.id, { sourceId: undefined });
    }
    await removeItem(STORAGE_KEYS.sources, source.id);
    setDeletePending(null);
    setMessage("Source deleted. Related highlights and flashcards kept and unlinked.");
    await refresh();
  }

  async function handleDeleteSourceAndRelated() {
    if (!deletePending) return;
    const { source, rels: { relatedHighlights, allRelatedFlashcards } } = deletePending;
    for (const h of relatedHighlights) await removeItem(STORAGE_KEYS.highlights, h.id);
    for (const f of allRelatedFlashcards) await removeItem(STORAGE_KEYS.flashcards, f.id);
    await removeItem(STORAGE_KEYS.sources, source.id);
    const relatedCount = relatedHighlights.length + allRelatedFlashcards.length;
    setDeletePending(null);
    setMessage(`Source deleted${relatedCount > 0 ? ` along with ${relatedHighlights.length} highlight(s) and ${allRelatedFlashcards.length} flashcard(s)` : ""}.`);
    await refresh();
  }

  async function handleDeleteHighlightOnly() {
    if (!deleteHighlightPending) return;
    const { highlight, relatedFlashcards } = deleteHighlightPending;
    for (const f of relatedFlashcards) {
      await updateItem<Flashcard>(STORAGE_KEYS.flashcards, f.id, { highlightId: undefined });
    }
    await removeItem(STORAGE_KEYS.highlights, highlight.id);
    setDeleteHighlightPending(null);
    setMessage(`Highlight deleted. ${relatedFlashcards.length > 0 ? `${relatedFlashcards.length} flashcard(s) kept and unlinked.` : ""}`);
    await refresh();
  }

  async function handleDeleteHighlightAndFlashcards() {
    if (!deleteHighlightPending) return;
    const { highlight, relatedFlashcards } = deleteHighlightPending;
    for (const f of relatedFlashcards) {
      await removeItem(STORAGE_KEYS.flashcards, f.id);
    }
    await removeItem(STORAGE_KEYS.highlights, highlight.id);
    setDeleteHighlightPending(null);
    setMessage(`Highlight deleted${relatedFlashcards.length > 0 ? ` along with ${relatedFlashcards.length} flashcard(s)` : ""}.`);
    await refresh();
  }

  function renderContent() {
    if (activeTab === "Overview") {
      return (
        <>
          <CourseFilter courses={allCourses} value={courseFilter} onChange={setCourseFilter} />
          {isEmpty ? (
            <div className="empty-state">
              <p>No study data yet. Start your first study session from the popup, or load demo data to explore.</p>
              <button onClick={loadDemo}>Load demo data</button>
            </div>
          ) : (
            <>
              <AnalyticsCards data={{ ...data, sessions: filtered.sessions, attempts: filtered.attempts, sources: filtered.sources, highlights: filtered.highlights, flashcards: filtered.flashcards, tabGroups: filtered.tabGroups }} />
              <RecentActivity sessions={filtered.sessions} sources={filtered.sources} highlights={filtered.highlights} flashcards={filtered.flashcards} tabGroups={filtered.tabGroups} attempts={filtered.attempts} />
            </>
          )}
        </>
      );
    }

    if (activeTab === "Sessions") {
      return (
        <>
          <div className="section-title">
            <h2>Sessions</h2>
            <button onClick={() => exportSessionsMarkdown(filtered.sessions)} disabled={!filtered.sessions.length}>Export summaries</button>
          </div>
          <CourseFilter courses={allCourses} value={courseFilter} onChange={setCourseFilter} />
          {filtered.sessions.length
            ? filtered.sessions.map((s) => <SessionCard key={s.id} session={s} />)
            : <EmptyState label="No sessions yet. Start one from the popup." onLoadDemo={isEmpty ? loadDemo : undefined} />}
        </>
      );
    }

    if (activeTab === "Sources") {
      return (
        <>
          <div className="section-title">
            <h2>Sources</h2>
            <button onClick={() => exportSourcesMarkdown(filtered.sources)} disabled={!filtered.sources.length}>Export Markdown</button>
          </div>
          <CourseFilter courses={allCourses} value={courseFilter} onChange={setCourseFilter} />
          <input className="search-input" placeholder="Search sources…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          {filtered.sources.length
            ? filtered.sources.map((source) => (
                <SourceCard
                  key={source.id}
                  source={source}
                  onUpdate={async (patch) => {
                    await updateItem<SavedSource>(STORAGE_KEYS.sources, source.id, patch);
                    setMessage("Source updated.");
                    await refresh();
                  }}
                  onDelete={() => {
                    const rels = findSourceRelationships(source.id, highlights, flashcards);
                    setDeletePending({ source, rels });
                  }}
                />
              ))
            : <EmptyState label="No sources saved yet. Use the popup on any webpage." onLoadDemo={isEmpty ? loadDemo : undefined} />}
        </>
      );
    }

    if (activeTab === "Highlights/Notes") {
      return (
        <>
          <div className="section-title">
            <h2>Highlights and notes</h2>
            <button onClick={() => exportHighlightsMarkdown(filtered.highlights)} disabled={!filtered.highlights.length}>Export Markdown</button>
          </div>
          <CourseFilter courses={allCourses} value={courseFilter} onChange={setCourseFilter} />
          <input className="search-input" placeholder="Search highlights…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          {filtered.highlights.length
            ? filtered.highlights.map((highlight) => (
                <div key={highlight.id} className="highlight-row">
                  <HighlightCard
                    highlight={highlight}
                    onUpdate={async (patch) => {
                      await updateItem<HighlightNote>(STORAGE_KEYS.highlights, highlight.id, patch);
                      setMessage("Highlight updated.");
                      await refresh();
                    }}
                    onDelete={() => {
                      const related = findHighlightRelationships(highlight.id, flashcards);
                      setDeleteHighlightPending({ highlight, relatedFlashcards: related });
                    }}
                  />
                  <button className="secondary small" onClick={() => void cardFromHighlight(highlight)}>Create flashcard</button>
                </div>
              ))
            : <EmptyState label="No highlights saved yet. Select text on a page, then use the popup." onLoadDemo={isEmpty ? loadDemo : undefined} />}
        </>
      );
    }

    if (activeTab === "Flashcards") {
      return (
        <>
          <div className="section-title">
            <h2>Flashcards</h2>
            <button onClick={() => exportFlashcardsCsv(filtered.flashcards)} disabled={!filtered.flashcards.length}>Export CSV</button>
          </div>
          <CourseFilter courses={allCourses} value={courseFilter} onChange={setCourseFilter} />
          <input className="search-input" placeholder="Search flashcards…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <section className="panel">
            <h3>Create a flashcard</h3>
            <label>Front (question or term)
              <input value={manualCard.front} onChange={(e) => setManualCard({ ...manualCard, front: e.target.value })} />
            </label>
            <label>Back (answer or definition)
              <textarea value={manualCard.back} onChange={(e) => setManualCard({ ...manualCard, back: e.target.value })} />
            </label>
            <div className="settings-grid">
              <label>Course<input value={manualCard.course} onChange={(e) => setManualCard({ ...manualCard, course: e.target.value })} /></label>
              <label>Tags<input value={manualCard.tags} onChange={(e) => setManualCard({ ...manualCard, tags: e.target.value })} /></label>
            </div>
            <button onClick={createManualFlashcard}>Save flashcard</button>
          </section>
          {filtered.flashcards.length
            ? filtered.flashcards.map((card) => (
                <FlashcardCard
                  key={card.id}
                  card={card}
                  onUpdate={async (patch) => {
                    await updateItem<Flashcard>(STORAGE_KEYS.flashcards, card.id, patch);
                    setMessage("Flashcard updated.");
                    await refresh();
                  }}
                  onDelete={async () => {
                    if (!window.confirm("Delete this flashcard?")) return;
                    await removeItem(STORAGE_KEYS.flashcards, card.id);
                    setMessage("Flashcard deleted.");
                    await refresh();
                  }}
                />
              ))
            : <EmptyState label="No flashcards yet. Create one above or save a highlight." onLoadDemo={isEmpty ? loadDemo : undefined} />}
        </>
      );
    }

    if (activeTab === "Tab Groups") {
      return (
        <>
          <h2>Tab groups</h2>
          <CourseFilter courses={allCourses} value={courseFilter} onChange={setCourseFilter} />
          {filtered.tabGroups.length
            ? filtered.tabGroups.map((group) => (
                <TabGroupCard
                  key={group.id}
                  group={group}
                  onRestore={() => void restoreTabGroup(group)}
                  onDelete={async () => { await deleteTabGroup(group.id); await refresh(); }}
                  onRename={async (name) => { await renameTabGroup(group.id, name); await refresh(); }}
                />
              ))
            : <EmptyState label="No tab groups saved yet. Use 'Save current tabs' in the popup while studying." onLoadDemo={isEmpty ? loadDemo : undefined} />}
        </>
      );
    }

    if (activeTab === "Settings") {
      return (
        <section className="panel">
          <h2>Settings</h2>
          <div className="settings-grid">
            <label>Default blocked websites
              <textarea value={settingsForm.blocked} onChange={(e) => setSettingsForm({ ...settingsForm, blocked: e.target.value })} />
            </label>
            <label>Default allowed websites
              <textarea value={settingsForm.allowed} onChange={(e) => setSettingsForm({ ...settingsForm, allowed: e.target.value })} />
            </label>
            <label>Default session length (minutes)
              <input type="number" min={5} value={settingsForm.length} onChange={(e) => setSettingsForm({ ...settingsForm, length: Number(e.target.value) })} />
            </label>
            <label>Default strictness
              <select value={settingsForm.strictness} onChange={(e) => setSettingsForm({ ...settingsForm, strictness: e.target.value })}>
                <option value="soft">Soft — continue freely</option>
                <option value="normal">Normal — 30s + reason</option>
                <option value="strict">Strict — 60s + reason + confirm</option>
              </select>
            </label>
          </div>
          <label className="checkbox-inline">
            <input type="checkbox" checked={settingsForm.allowlist} onChange={(e) => setSettingsForm({ ...settingsForm, allowlist: e.target.checked })} />
            Use allowlist mode by default
          </label>
          <label className="checkbox-inline">
            <input type="checkbox" checked={settingsForm.timer} onChange={(e) => setSettingsForm({ ...settingsForm, timer: e.target.checked })} />
            Show timer in popup
          </label>
          <label className="checkbox-inline">
            <input type="checkbox" checked={settingsForm.bypassReasons} onChange={(e) => setSettingsForm({ ...settingsForm, bypassReasons: e.target.checked })} />
            Log bypass reasons
          </label>
          <div className="button-row">
            <button onClick={saveSettingsForm}>Save settings</button>
            <button className="secondary" onClick={loadDemo}>Load demo data</button>
            <button className="secondary" onClick={() => exportAllJson({ ...data, settings: settings ?? undefined })}>Export all data JSON</button>
            <button className="danger" onClick={resetAll}>Reset all local data</button>
          </div>
          <div className="privacy-note">
            All study data is stored locally using chrome.storage.local. StudyLock has no backend, no account system, no analytics tracking service, and no AI API. Your data never leaves your browser.
          </div>
        </section>
      );
    }

    return (
      <>
        <section className="panel">
          <h2>Export</h2>
          <p className="muted-text">Download your study data in various formats.</p>
          <div className="button-row">
            <button onClick={() => exportFlashcardsCsv(flashcards)} disabled={!flashcards.length}>Flashcards CSV</button>
            <button onClick={() => exportSourcesMarkdown(sources)} disabled={!sources.length}>Sources Markdown</button>
            <button onClick={() => exportHighlightsMarkdown(highlights)} disabled={!highlights.length}>Highlights Markdown</button>
            <button onClick={() => exportSessionsMarkdown(sessions)} disabled={!sessions.length}>Sessions Markdown</button>
            <button className="secondary" onClick={() => exportAllJson({ ...data, settings: settings ?? undefined })}>All data JSON</button>
          </div>
        </section>
        <section className="panel">
          <h3>Import from JSON</h3>
          <p className="muted-text">Restore or merge a StudyLock JSON export. Choose to replace or merge existing data in the confirmation dialog.</p>
          <input ref={importFileRef} type="file" accept=".json" onChange={handleImportFileChange} className="import-file-input" />
        </section>
      </>
    );
  }

  return (
    <main className="dashboard">
      <header className="header">
        <div>
          <h1>StudyLock</h1>
          <p>Turn online studying into focused academic sessions — local-first, no account needed.</p>
        </div>
      </header>
      <div className="layout">
        <nav className="tabs" aria-label="Dashboard sections">
          {TABS.map((tab) => (
            <button className={activeTab === tab ? "active" : ""} key={tab} onClick={() => setActiveTab(tab)}>{tab}</button>
          ))}
        </nav>
        <section className="content">
          {message ? <div className="panel message-panel">{message} <button className="secondary small close-msg" onClick={() => setMessage("")}>✕</button></div> : null}
          {renderContent()}
        </section>
      </div>
      {importPending ? (
        <ImportModal
          payload={importPending}
          onReplace={() => void handleImportReplace()}
          onMerge={() => void handleImportMerge()}
          onCancel={handleImportCancel}
        />
      ) : null}
      {deletePending ? (
        <DeleteSourceModal
          source={deletePending.source}
          relationships={deletePending.rels}
          onDeleteSourceOnly={() => void handleDeleteSourceOnly()}
          onDeleteWithRelated={() => void handleDeleteSourceAndRelated()}
          onCancel={() => setDeletePending(null)}
        />
      ) : null}
      {deleteHighlightPending ? (
        <DeleteHighlightModal
          highlight={deleteHighlightPending.highlight}
          relatedFlashcards={deleteHighlightPending.relatedFlashcards}
          onDeleteOnly={() => void handleDeleteHighlightOnly()}
          onDeleteWithRelated={() => void handleDeleteHighlightAndFlashcards()}
          onCancel={() => setDeleteHighlightPending(null)}
        />
      ) : null}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Dashboard />);
