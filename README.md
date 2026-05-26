# StudyLock

![CI](https://github.com/YOUR_USERNAME/studylock-browser/actions/workflows/ci.yml/badge.svg)

**StudyLock** is a local-first Manifest V3 Chrome extension that turns online studying into focused academic sessions. It combines configurable distraction blocking, tab workspace management, source and highlight capture, citation drafts, flashcard export, analytics, session summaries, and JSON backup/restore using React, TypeScript, Vite, and Chrome APIs.

---

## Target Users

Students who research online, use course websites, collect sources, make notes, and need light friction around distracting sites during focused study sessions.

---

## Main Features

- **Focused study sessions** — Course, task, goal, duration, strictness, and mode settings with a live countdown timer.
- **Distraction blocking** — Blocklist mode blocks specific sites. Allowlist mode restricts access to only approved sites.
- **Three bypass strictness levels:**
  - *Soft* — continue freely, bypass logged.
  - *Normal* — 30-second pause + written reason (≥10 chars).
  - *Strict* — 60-second pause + written reason + acknowledgement checkbox.
- **Bypass logging** — Each bypass is stored with reason, type (soft/normal/emergency), and session context.
- **SPA navigation detection** — Content script monitors `pushState`, `replaceState`, `popstate`, and `hashchange` to block within single-page apps.
- **Source capture** — Save the active tab as a source with title, URL, type (article/video/PDF/textbook/webpage/other), assignment/project, note, tags, and an auto-generated citation draft.
- **Highlight and note capture** — Select text on any page, save it with a note and tags.
- **Flashcards** — Create from highlights or manually; export as CSV compatible with spreadsheet tools.
- **Tab groups** — Save and restore the current window's study tabs per course and task. Tab groups are linked to the active session and counted in the session summary.
- **Session summary** — After ending a session, a summary card shows focused time, blocks, bypasses, sources captured, notes created, cards created, tab groups saved, and reflection. Exportable as Markdown.
- **Dashboard** — Full dashboard with course filter, text search across all fields (sources, highlights, flashcards), edit/delete for sources/highlights/flashcards, analytics, settings, export, and JSON import (merge or replace).
- **Analytics** — Focus time, completed sessions, blocked attempts, bypasses, most-blocked domains, and focus minutes per course. Analytics respect the active course filter.
- **Export** — Flashcards CSV, sources Markdown, highlights Markdown, session summaries Markdown, and full JSON (includes `schemaVersion`, `exportedAt`, and optionally `settings`).
- **Import** — JSON import with a modal showing item counts before you choose: Replace all data, Merge (add new items without removing existing), or Cancel. Valid legacy items are normalized with safe defaults; unrecoverable malformed items are skipped with warnings. Active sessions in the import file are converted to completed. Settings are restored on replace but not on merge.
- **Close distracting tabs** — Button visible during active sessions that scans all tabs in the current window and closes the ones blocked by the current session. Pinned tabs are skipped (never closed silently).
- **Expired session summary** — When a session timer runs out, the popup automatically shows the session summary card. You can add a reflection after the fact.
- **Opt-in demo data** — Empty state shows a "Load demo data" button. Data is appended (never overwrites existing data), and a confirmation is shown when real data already exists.
- **Local privacy** — No backend, no account, no tracking, no external fonts, no remote requests of any kind. All data lives in `chrome.storage.local`.

---

## Demo Scenario

1. Open the extension popup.
2. Start a study session: Course = **Chemistry**, Task = **Final Review**, Duration = 60 min, Goal = "Review lectures and create flashcards", Mode = **Blocklist**, Blocked: reddit.com, instagram.com, tiktok.com, Strictness = **Normal**.
3. See timer and goal displayed in the popup.
4. Click **Save current tabs** to save open tabs as a Chemistry tab group.
5. Navigate to openstax.org, save the page as a source (type: Textbook, assignment: Chemistry Final).
6. Select a sentence on the page, save it as a highlight.
7. Create a flashcard from the highlight using the popup.
8. Navigate to `reddit.com` — the extension redirects to the blocked page.
9. Blocked attempt is logged in the dashboard.
10. Normal mode: wait 30 seconds, enter a reason, click **Continue anyway**.
11. Return to studying on openstax.org.
12. End the session — a full summary card appears.
13. Open the dashboard to review analytics.
14. Export flashcards as CSV and sources/notes as Markdown.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Extension platform | Chrome Manifest V3 |
| UI framework | React 18 |
| Language | TypeScript |
| Build tool | Vite |
| Tests | Vitest |
| Storage | `chrome.storage.local` |
| Backend | None |
| Authentication | None |
| Cloud/AI APIs | None |
| External fonts | None — system fonts only |

---

## Folder Structure

```
studylock-browser/
├── public/
│   └── icons/              # Extension icons (16, 32, 48, 128 px)
├── scripts/
│   ├── copy-extension-assets.mjs  # Copies manifest.json to dist/
│   └── generate-icons.mjs         # Generates PNG icons
├── src/
│   ├── background/
│   │   └── serviceWorker.ts       # MV3 service worker: blocking, bypass logging
│   ├── blocked/
│   │   ├── BlockedPage.tsx        # Blocked/focus redirect page
│   │   ├── blocked.css
│   │   └── blocked.html
│   ├── components/
│   │   ├── AnalyticsCards.tsx     # Overview analytics grid
│   │   ├── FlashcardCard.tsx      # Flashcard display + inline edit/delete
│   │   ├── HighlightCard.tsx      # Highlight display
│   │   ├── SessionCard.tsx        # Session summary card
│   │   ├── SourceCard.tsx         # Source display + inline edit/delete
│   │   └── TabGroupCard.tsx       # Tab group card with restore/rename/delete
│   ├── content/
│   │   └── contentScript.ts       # Page-level blocking check + SPA detection
│   ├── dashboard/
│   │   ├── Dashboard.tsx          # Full dashboard SPA
│   │   ├── dashboard.css
│   │   └── dashboard.html
│   ├── lib/
│   │   ├── analytics.ts           # Pure analytics calculations
│   │   ├── analytics.test.ts
│   │   ├── blockingEngine.ts      # Pure blocking logic
│   │   ├── blockingEngine.test.ts
│   │   ├── citationHelper.ts      # Citation draft generator
│   │   ├── citationHelper.test.ts
│   │   ├── demoData.ts            # Opt-in demo data seeder
│   │   ├── domainUtils.ts         # URL/domain parsing utilities
│   │   ├── domainUtils.test.ts
│   │   ├── exportUtils.ts         # CSV/Markdown/JSON export + import shape validation
│   │   ├── exportUtils.test.ts
│   │   ├── importUtils.ts         # Import normalization (safe defaults, active→completed)
│   │   ├── importUtils.test.ts
│   │   ├── flashcardManager.ts    # Flashcard CRUD
│   │   ├── highlightManager.ts    # Highlight CRUD
│   │   ├── recentActivity.ts      # Pure buildActivity helper
│   │   ├── sessionManager.ts      # Session lifecycle + incrementSessionCounter
│   │   ├── sourceManager.ts       # Source CRUD
│   │   ├── sourceRelationships.ts # Relationship helpers for source and highlight deletion
│   │   ├── storage.ts             # chrome.storage.local wrappers
│   │   ├── tabGroupManager.ts     # Tab group CRUD
│   │   └── types.ts               # All shared TypeScript types
│   ├── styles/
│   │   └── theme.css              # Design tokens (colors, spacing, typography)
│   └── popup/
│       ├── Popup.tsx              # Main popup with session form + capture tools
│       ├── popup.css
│       └── popup.html
├── manifest.json
├── package.json
├── tsconfig.json
├── vite.config.ts
├── MANUAL_QA.md
└── README.md
```

---

## Architecture

### Service Worker (`serviceWorker.ts`)

The MV3 background service worker handles two messages:

- **`CHECK_BLOCK`** — Called by the content script on every page load and SPA navigation. Checks the active session against the domain. If blocked, returns a URL to the blocked page with context (domain, session ID, attempt ID).
- **`BYPASS_BLOCK`** — Called by the blocked page when the user completes the bypass flow. Grants a 5-minute bypass for the exact URL, logs the attempt as bypassed (with `bypassType`: soft/normal/emergency), and increments the session's bypass count.

Both the `blockedAttemptCount` and `bypassCount` increments use `incrementSessionCounter` to read the latest state from storage before writing, avoiding stale-counter races.

### Content Script (`contentScript.ts`)

Injects at `document_start` on all URLs. Skips internal browser/extension pages. On the initial page load and on SPA navigation events (`pushState`, `replaceState`, `popstate`, `hashchange`), it sends a `CHECK_BLOCK` message and replaces the page location with the blocked URL if the service worker says to block. A 250ms debounce prevents rapid repeat checks during SPA route changes.

### Blocking Engine (`blockingEngine.ts`)

A pure function. Takes a URL and an optional session, returns a `BlockingDecision`. In blocklist mode: blocks if the domain matches any blocked domain. In allowlist mode: blocks if the domain is NOT in the allowed list. Internal URLs are always allowed. Sessions with status other than "active" do not trigger blocking.

### Storage (`storage.ts`)

Thin wrappers around `chrome.storage.local`. All data is stored under namespaced keys (e.g. `studylock_sessions`). CRUD helpers: `addItem`, `updateItem`, `removeItem`, `getArray`. Bypass grants have expiry timestamps and are cleaned up on read.

### Domain Matching (`domainUtils.ts`)

`domainMatches(current, rule)` returns true if the current domain equals the rule domain, or if the current domain ends with `.${rule}`. This means a rule of `reddit.com` blocks `reddit.com`, `www.reddit.com`, and `old.reddit.com`. `isLikelyDomain(value)` validates user-entered domain strings before they are saved to a session.

### Import Normalization (`importUtils.ts`)

Two-stage pipeline: shape validation (`parseImportPayload` in `exportUtils.ts`) then normalization (`normalizeImportPayload`). The shape validation uses relaxed minimum requirements — sessions only require an `id`, sources require `id` + `url`, tab groups require `id` + `tabs` array — so legacy or partially-formed records reach the normalization stage. `normalizeImportPayload` applies safe defaults to every imported item: active sessions become completed, missing counters default to 0, missing arrays default to `[]`, missing titles default to "Untitled Source", and sources with unparseable URLs are skipped (counted in `skippedCount`). `normalizeImportedSettings` validates ranges (session length: 5–480 min), normalizes domain lists with `normalizeDomain`/`isLikelyDomain`, deduplicates, and rejects invalid strictness values.

### Session Counter Helpers (`sessionManager.ts`)

`incrementSessionCounter(sessionId, counter, amount?)` reads the latest sessions array from storage before writing, preventing stale increments when multiple captures happen in quick succession. All session counter updates (sources captured, notes created, flashcards created, tab groups saved, blocked attempts, bypasses) go through this helper. `expireSessionIfNeeded()` returns the just-completed session so callers (popup, dashboard) can surface the summary immediately.

### Storage Consistency (`migration.ts`)

`repairStorageConsistency()` runs on every dashboard load and handles five cases: no pointer with orphaned active sessions (all completed), stale pointer to a missing session (pointer cleared), pointer to a non-active session (pointer cleared), exactly one valid active session (kept), multiple active sessions (all but the pointed one completed).

---

## Chrome Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves all local data: sessions, sources, highlights, flashcards, tab groups, settings, bypass grants |
| `tabs` | Reads open tabs in the current window to save tab groups; opens restored tab groups; counts and closes distracting tabs |
| `activeTab` | Lets the popup read the current page URL and title |
| `scripting` | Reads selected text from the active page for highlight capture |
| `<all_urls>` host permission | Allows the content script to run on all web pages and check them against the active session's blocking rules |

> No remote code is executed. All scripts are bundled locally. No external fonts or stylesheets are loaded.

---

## How to Install Dependencies

```bash
npm install
```

## How to Build

```bash
npm run build
```

Output is in `dist/`. The build runs `tsc`, then Vite, then copies `manifest.json` and icons.

## How to Run Tests

```bash
npm test
```

Runs 225 automated tests across domainUtils, blockingEngine, citationHelper, analytics, exportUtils, importUtils, searchUtils, sessionManager, sourceManager, highlightManager, flashcardManager, tabGroupManager, migration, sourceRelationships, and recentActivity.

## How to Load as an Unpacked Chrome Extension

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `dist/` folder from this project
5. Pin **StudyLock** in the Chrome toolbar
6. Click the icon to open the popup

## How to Run Coverage

```bash
npm run test:coverage
```

The coverage report focuses on the pure logic layer in `src/lib`. UI/manual extension behavior is covered through `MANUAL_QA.md` and real Chrome testing.

## How to Manually Test

See `MANUAL_QA.md` for a full manual testing checklist covering every feature.

---

## Data Model

All data is stored in `chrome.storage.local` under these keys:

| Key | Type | Description |
|---|---|---|
| `studylock_sessions` | `StudySession[]` | All study sessions (active, completed, cancelled) |
| `studylock_active_session_id` | `string` | ID of the currently active session |
| `studylock_blocked_attempts` | `BlockedAttempt[]` | Every blocked page attempt with bypass info |
| `studylock_sources` | `SavedSource[]` | Saved web sources with citation drafts |
| `studylock_highlights` | `HighlightNote[]` | Selected text + notes |
| `studylock_flashcards` | `Flashcard[]` | Study flashcards |
| `studylock_tab_groups` | `TabGroup[]` | Saved tab group snapshots |
| `studylock_settings` | `Settings` | User preferences |
| `studylock_bypass_grants` | `BypassGrant[]` | Temporary URL unlock grants (expire in 5 min) |

### Key Types

**`StudySession`** — Course, task, goal, duration, start/end times, status, strictness, mode, blocked/allowed domain lists, counts for blocked attempts, bypasses, sources, notes, flashcards, and tab groups. Optional reflection field.

**`BlockedAttempt`** — Domain, URL, timestamp, mode that triggered the block, and bypass info: `bypassed: boolean`, `bypassReason?: string`, `bypassType?: "soft" | "normal" | "emergency"`.

**`SavedSource`** — Title, URL, domain, source type, assignment/project, author, publisher, published date, accessed date, selected text, note, tags, and auto-generated citation draft.

**`Flashcard`** — Front, back, course, tags, source URL, references to source/highlight IDs.

---

## Local Privacy Statement

All study data is stored locally using `chrome.storage.local`. StudyLock has no backend, no account system, no analytics tracking service, no AI API, and no external network requests (including fonts). Your notes, sources, highlights, and session data never leave your browser. Uninstalling the extension removes all locally stored data.

---

## Limitations

- This is useful friction, not device-level lockdown. Students can disable or remove an unpacked extension from Chrome settings.
- Blocking does not apply to Chrome internal pages such as `chrome://`.
- Citation drafts are labeled "verify before submitting" — they are rough drafts generated from available metadata, not authoritative citations.
- YouTube is not blocked by default because many students use it for lectures.
- There is no cloud sync, account system, mobile app, native lockdown, or AI feature in Version 1.
- `chrome.storage.local` has a 5MB default limit. Heavy use over many months may approach this limit.
- SPA blocking relies on JavaScript `history` API interception. Sites using non-standard navigation may not be caught.

---

## Future Improvements

The following features are planned but not yet built:

### v1.1 planned
- In-app flashcard practice mode with card flipping, shuffle, correct/incorrect marking, keyboard shortcuts, course/session filters, and practice summaries

### Later roadmap
- Cloud sync across devices
- Account system with optional sign-in
- AI-powered session summarization
- AI-generated flashcard suggestions from highlights
- Google Docs / Notion export
- Anki integration
- LMS integration (Canvas, CourseWorks)
- Professor / parent / study-group accountability mode
- Mobile companion app
- Pomodoro scheduling with timed break intervals
- Calendar integration
- Focus streaks and gamification
- Per-course analytics views and progress charts
- Exam-mode presets (strict mode + preset blocklist + timed)
- Website category detection (social media, news, video)
- Native companion app for stricter desktop-level lockdown

---

## Resume Bullet

> "Built StudyLock, a local-first Manifest V3 Chrome extension that converts chaotic study browsing into structured academic sessions with configurable domain blocking, tab workspace management, source/highlight capture, citation drafts, flashcard CSV export, analytics, schema migrations, JSON backup/restore, and 200+ automated tests using React, TypeScript, Vite, and Chrome APIs."
