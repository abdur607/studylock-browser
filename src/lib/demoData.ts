import { createCitationDraft } from "./citationHelper";
import { addItem, getArray } from "./storage";
import { BlockedAttempt, Flashcard, HighlightNote, SavedSource, STORAGE_KEYS, StudySession, TabGroup } from "./types";

const DEMO_SESSION_ID = "demo_chemistry_session";

export async function seedDemoData(): Promise<{ alreadyLoaded: boolean }> {
  const existing = await getArray<StudySession>(STORAGE_KEYS.sessions);
  if (existing.some((s) => s.id === DEMO_SESSION_ID)) {
    return { alreadyLoaded: true };
  }

  const now = new Date();
  const started = new Date(now.getTime() - 52 * 60_000).toISOString();
  const ended = new Date(now.getTime() - 7 * 60_000).toISOString();
  const sessionId = DEMO_SESSION_ID;
  const sourceId = "demo_openstax_source";
  const highlightId = "demo_highlight";

  const demoSession: StudySession = {
    id: sessionId,
    course: "Chemistry",
    task: "Final Review",
    goal: "Review lectures and create flashcards",
    durationMinutes: 60,
    startTime: started,
    endTime: ended,
    status: "completed",
    strictness: "normal",
    mode: "blocklist",
    blockedDomains: ["reddit.com", "instagram.com", "tiktok.com", "x.com", "netflix.com"],
    allowedDomains: ["courseworks.columbia.edu", "docs.google.com", "openstax.org"],
    blockedAttemptCount: 2,
    bypassCount: 0,
    sourcesSavedCount: 1,
    notesCreatedCount: 1,
    flashcardsCreatedCount: 1,
    tabGroupsSavedCount: 1,
    reflection: "Finished equilibrium review and marked weak areas for tomorrow."
  };

  const source: SavedSource = {
    id: sourceId,
    course: "Chemistry",
    sessionId,
    title: "Chemistry 2e: Equilibrium",
    url: "https://openstax.org/books/chemistry-2e/pages/13-introduction",
    domain: "openstax.org",
    sourceType: "textbook",
    assignment: "Chemistry Final",
    publisher: "OpenStax",
    accessedAt: now.toISOString(),
    tags: ["equilibrium", "final"],
    citationDraft: createCitationDraft(
      "Chemistry 2e: Equilibrium",
      "openstax.org",
      "https://openstax.org/books/chemistry-2e/pages/13-introduction",
      { publisher: "OpenStax" }
    ),
    note: "Useful overview for Le Chatelier's principle."
  };

  const highlight: HighlightNote = {
    id: highlightId,
    sourceId,
    course: "Chemistry",
    sessionId,
    url: source.url,
    pageTitle: source.title,
    selectedText: "A system at equilibrium responds to stress by shifting in the direction that reduces the stress.",
    note: "Turn this into a concept card.",
    tags: ["equilibrium"],
    createdAt: now.toISOString()
  };

  const flashcard: Flashcard = {
    id: "demo_flashcard",
    course: "Chemistry",
    sourceId,
    highlightId,
    front: "What does Le Chatelier's principle predict?",
    back: highlight.selectedText,
    tags: ["equilibrium", "final"],
    sourceUrl: source.url,
    createdAt: now.toISOString()
  };

  const tabGroup: TabGroup = {
    id: "demo_tab_group",
    sessionId,
    courseName: "Chemistry",
    name: "Final Review tabs",
    task: "Final Review",
    tabs: [
      { title: "CourseWorks", url: "https://courseworks.columbia.edu", domain: "courseworks.columbia.edu" },
      { title: "OpenStax Chemistry 2e", url: source.url, domain: "openstax.org" }
    ],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  const attempt1: BlockedAttempt = {
    id: "demo_attempt_1",
    sessionId,
    domain: "reddit.com",
    url: "https://reddit.com/r/funny",
    timestamp: new Date(now.getTime() - 30 * 60_000).toISOString(),
    modeTriggered: "blocklist",
    bypassed: false
  };

  const attempt2: BlockedAttempt = {
    id: "demo_attempt_2",
    sessionId,
    domain: "instagram.com",
    url: "https://www.instagram.com/",
    timestamp: new Date(now.getTime() - 15 * 60_000).toISOString(),
    modeTriggered: "blocklist",
    bypassed: false
  };

  // Append — never overwrite existing user data
  await addItem(STORAGE_KEYS.sessions, demoSession);
  await addItem(STORAGE_KEYS.sources, source);
  await addItem(STORAGE_KEYS.highlights, highlight);
  await addItem(STORAGE_KEYS.flashcards, flashcard);
  await addItem(STORAGE_KEYS.tabGroups, tabGroup);
  await addItem(STORAGE_KEYS.blockedAttempts, attempt1);
  await addItem(STORAGE_KEYS.blockedAttempts, attempt2);

  return { alreadyLoaded: false };
}
