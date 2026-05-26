# Manual QA Checklist — StudyLock

Use this checklist to manually verify that StudyLock works correctly after every build.

---

## 1. Install and Build

- [ ] `npm install` completes without errors
- [ ] `npm run build` completes without errors
- [ ] `npm test` shows 225 tests passing, 0 failing
- [ ] `dist/` folder exists and contains `manifest.json`, `serviceWorker.js`, `contentScript.js`, `popup.js`, `dashboard.js`, `blocked.js`
- [ ] `dist/icons/` contains `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`

---

## 2. Load Unpacked Extension in Chrome

- [ ] Open `chrome://extensions`
- [ ] Enable Developer mode (toggle in top-right)
- [ ] Click **Load unpacked** → select the `dist/` folder
- [ ] Extension appears with name **StudyLock** and a green lock icon
- [ ] Extension icon appears in the Chrome toolbar
- [ ] No immediate errors in the extension's service worker

---

## 3. Popup — Initial State

- [ ] Click the extension icon to open the popup
- [ ] Popup opens without console errors (`F12` → Console in popup)
- [ ] "Start a study session" form is visible with pre-filled demo values
- [ ] Dashboard button opens the dashboard in a new tab
- [ ] Capture section visible with source type and assignment fields
- [ ] Flashcard section visible

---

## 4. Study Session Creation

- [ ] Fill in: Course = **Chemistry**, Task = **Final Review**, Duration = **60**, Goal = **Review lectures and create flashcards**
- [ ] Strictness = **Normal**
- [ ] Mode = **Blocklist**
- [ ] Blocked domains = `reddit.com, instagram.com, tiktok.com, x.com, netflix.com`
- [ ] Click **Start session**
- [ ] Session card appears with course/task/goal displayed
- [ ] No error messages shown

---

## 5. Timer

- [ ] Timer counts down from ~60:00
- [ ] Timer updates every second
- [ ] Session stats show blocks=0, sources=0, cards=0

---

## 6. Save Current Tabs

- [ ] With session active, click **Save current tabs**
- [ ] Green success banner appears: "Saved X tabs to this session." (where X is the actual tab count)
- [ ] Pluralisation correct: "Saved 1 tab to this session." vs "Saved 3 tabs to this session."
- [ ] Banner disappears automatically after ~3 seconds without user interaction
- [ ] Banner does not block the rest of the popup UI
- [ ] Dashboard → Tab Groups → confirm the tab group is listed with correct tab count

---

## 7. Source Capture

- [ ] Navigate to `https://openstax.org` (or any normal webpage)
- [ ] Open popup
- [ ] Set source type to **Textbook**
- [ ] Set assignment to **Chemistry Final**
- [ ] Add a note: `Great equilibrium resource`
- [ ] Click **Save source**
- [ ] Green success banner appears: "Source saved to this session."
- [ ] Banner disappears automatically after ~3 seconds without user interaction
- [ ] Banner does not block the rest of the popup UI
- [ ] Sources counter increments in session stats
- [ ] Dashboard → Sources → confirm the source appears

---

## 8. Highlight Capture

- [ ] On a normal webpage, select some text (e.g. highlight a sentence)
- [ ] Open popup
- [ ] Click **Save highlight**
- [ ] Success message confirms highlight saved
- [ ] Flash back field auto-populates with selected text
- [ ] If no text selected: message says "Select text on the page first"

---

## 9. Flashcard Creation

- [ ] Fill in Front: `What is Le Chatelier's principle?`
- [ ] Fill in Back (auto from highlight or type manually)
- [ ] Click **Create card**
- [ ] Success message: "Flashcard saved."
- [ ] Cards counter increments in session stats

---

## 10. Blocklist Mode — Block Check

- [ ] With session active (blocklist mode, reddit.com blocked)
- [ ] Navigate to `https://reddit.com`
- [ ] Extension redirects to the **blocked page**
- [ ] Blocked page shows: domain = reddit.com, session name, goal, time remaining
- [ ] Blocked page shows **Normal** strictness notice (30-second wait)

---

## 11. Soft Bypass

- [ ] End session, start a new one with Strictness = **Soft**
- [ ] Navigate to a blocked site
- [ ] Blocked page shows immediately (no wait)
- [ ] **Continue anyway** button is enabled immediately
- [ ] Click it → navigates back to the original URL without loop
- [ ] Dashboard blocked attempts shows 1 attempt logged

---

## 12. Normal Bypass (30-second wait + reason)

- [ ] Start a session with Strictness = **Normal**
- [ ] Navigate to a blocked site
- [ ] Blocked page shows 30-second countdown button
- [ ] Button disabled while countdown runs
- [ ] Typing less than 10 characters in reason keeps button disabled
- [ ] After 30s AND typing ≥10 chars reason, button enables
- [ ] Click **Continue anyway** → navigates back to original URL
- [ ] No redirect loop
- [ ] Check dashboard: attempt logged as bypassed with reason

---

## 13. Strict Mode — Emergency Unlock (60-second wait + reason + checkbox)

- [ ] Start a session with Strictness = **Strict**
- [ ] Navigate to a blocked site
- [ ] Blocked page shows strict notice: "60-second pause" mentioned
- [ ] Button countdown shows 60 seconds
- [ ] Reason textarea visible, minimum 10 chars required
- [ ] Checkbox: "I understand this emergency bypass will be logged." visible
- [ ] Button disabled until: countdown=0 AND reason≥10 chars AND checkbox checked
- [ ] Fill all requirements → **Emergency unlock** button enables
- [ ] Click → navigates back to original URL
- [ ] No redirect loop on returning to the site
- [ ] Check dashboard: attempt logged with bypassType "emergency"

---

## 14. No Redirect Loop

- [ ] After any bypass, revisiting the same URL within 5 minutes should NOT re-redirect
- [ ] After 5 minutes (bypass grant expires), the URL would be blocked again (expected)

---

## 15. Allowlist Mode

- [ ] Start a session with Mode = **Allowlist**
- [ ] Allowed domains = `openstax.org, docs.google.com`
- [ ] Navigate to `https://openstax.org` → NOT blocked
- [ ] Navigate to `https://reddit.com` → BLOCKED
- [ ] Navigate to `https://docs.google.com` → NOT blocked
- [ ] Navigate to `https://twitter.com` → BLOCKED

---

## 16. SPA Navigation Blocking

- [ ] With a session active (reddit.com blocked)
- [ ] Visit a site that uses client-side routing (e.g. YouTube)
- [ ] Navigate to a different video within YouTube using UI (pushState fires)
- [ ] If YouTube were blocked: should redirect. If not blocked: should be fine.
- [ ] The extension does not cause infinite redirect loops on allowed SPAs

---

## 17. End Session and Session Summary

- [ ] With session active, add a reflection note in the popup
- [ ] Click **End session and show summary**
- [ ] Session card disappears
- [ ] Session summary card appears showing:
  - Course and task
  - Actual focused time vs planned duration
  - Blocked attempts and bypasses
  - Sources saved
  - Notes/highlights
  - Flashcards created
  - Reflection text
- [ ] **Export summary** button downloads a `.md` file
- [ ] **Open dashboard** button opens the dashboard
- [ ] Dismiss (✕) button hides the summary and shows session start form

---

## 18. Dashboard — Initial State (No Data)

- [ ] Clear all data: Dashboard → Settings → **Reset all local data**
- [ ] Reopen Dashboard
- [ ] Overview tab shows: "No study data yet. Start your first study session from the popup, or load demo data to explore."
- [ ] **Load demo data** button is visible
- [ ] Other tabs also show helpful empty states with "Load demo data" option

---

## 19. Demo Data Opt-In

- [ ] With empty storage, click **Load demo data**
- [ ] Chemistry Final Review session appears
- [ ] Source, highlight, flashcard, and tab group appear
- [ ] Analytics cards show non-zero values
- [ ] Message: "Demo data loaded."

---

## 20. Course Filter

- [ ] Load demo data (Chemistry)
- [ ] Add a second session with course = **Biology** (from popup)
- [ ] In Dashboard, course filter dropdown shows: **All courses**, Chemistry, Biology
- [ ] Select **Chemistry** → only Chemistry items shown across all tabs
- [ ] Select **Biology** → only Biology items shown
- [ ] Select **All courses** → all items shown

---

## 21. Edit Source

- [ ] Dashboard → Sources
- [ ] Click **Edit** on a source
- [ ] Edit form appears with all 9 editable fields: Title, Source type, Course, Assignment/project, Author, Publisher, Published date, Note, Tags
- [ ] Change note to "Updated note"
- [ ] Click **Save changes**
- [ ] Source shows updated note
- [ ] No page reload needed

---

## 22. Delete Source

- [ ] Dashboard → Sources
- [ ] Click **Delete** on a source that has no related items
- [ ] Modal appears with source title and "Delete" and "Cancel" buttons
- [ ] Click Cancel → modal closes, source remains
- [ ] Click Delete → source removed from list, no related items changed
- [ ] Click **Delete** on a source that HAS related highlights and/or flashcards
- [ ] Modal shows counts: related highlights, directly linked flashcards, flashcards linked via highlights
- [ ] **Delete source + related items** → source, highlights, and all linked flashcards are removed
- [ ] **Delete source only** → source deleted; highlights kept with sourceId cleared; direct flashcards kept with sourceId cleared; indirect flashcards (via highlightId) untouched
- [ ] **Cancel** → modal closes, nothing deleted

---

## 23. Edit Flashcard

- [ ] Dashboard → Flashcards
- [ ] Click **Edit** on a flashcard
- [ ] Form shows current front, back, course, tags
- [ ] Edit front to "Updated question"
- [ ] Click **Save**
- [ ] Flashcard shows updated front

---

## 24. Delete Flashcard

- [ ] Dashboard → Flashcards
- [ ] Click **Delete** on a flashcard
- [ ] Confirmation dialog appears
- [ ] Confirm → flashcard removed from list

---

## 25. Create Flashcard from Highlight

- [ ] Dashboard → Highlights/Notes
- [ ] Click **Create flashcard** on a highlight
- [ ] Prompt asks for the front (question or term)
- [ ] Enter a question → flashcard created
- [ ] Dashboard → Flashcards shows new card using highlight text as back

---

## 26. Tab Groups — Save and Restore

- [ ] Dashboard → Tab Groups
- [ ] Verify the saved tab group from earlier is listed with tab count
- [ ] Click **Restore** → original tabs open as new Chrome tabs
- [ ] Click **Rename** → prompt to rename, updates name
- [ ] Click **Delete** → group removed from list

---

## 27. Analytics

- [ ] Dashboard → Overview
- [ ] Verify analytics cards show:
  - Focused time (non-zero after a session)
  - Completed sessions (≥1)
  - Blocked attempts (≥1 after blocking)
  - Bypasses (matches actual bypass count)
  - Sources saved
  - Highlights
  - Flashcards
  - Tab groups
- [ ] "Most blocked domains" panel shows reddit.com with count
- [ ] "Focus minutes by course" shows Chemistry with minutes

---

## 28. Export Buttons

- [ ] Dashboard → Export
- [ ] **Flashcards CSV** → downloads file with correct headers (front, back, course, tags, source_url)
- [ ] **Sources Markdown** → downloads .md file with source titles and citation drafts
- [ ] **Highlights Markdown** → downloads .md file with selected text in blockquotes
- [ ] **Sessions Markdown** → downloads .md file with session stats
- [ ] **All data JSON** → downloads complete JSON export

---

## 29. Settings

- [ ] Dashboard → Settings
- [ ] Change default blocked domains → Save → open popup → verify domains pre-filled
- [ ] Change default session length → Save → open popup → verify duration pre-filled
- [ ] **Reset all local data** → confirm → all data cleared, empty states shown
- [ ] Privacy note visible: "All study data is stored locally..."

---

## 30. No Blocked Extension Pages

- [ ] With active session (reddit blocked)
- [ ] Open `chrome://extensions` → NOT blocked/redirected
- [ ] Open the dashboard page (`chrome-extension://...`) → NOT blocked

---

## 31. Console Errors Check

- [ ] Open popup → check console (F12 on popup) → no unexpected errors
- [ ] Open dashboard → check console → no unexpected errors
- [ ] Open blocked page → check console → no unexpected errors

---

## 32. Session Summary in Dashboard

- [ ] After ending a session, open Dashboard → Sessions
- [ ] Completed session card shows course, task, focused time, blocked attempts, bypasses, reflection

---

## 33. Full Demo Flow Verification

Run the entire demo scenario described in README.md:

1. [ ] Open popup
2. [ ] Start Chemistry Final Review session (60 min, Normal, Blocklist)
3. [ ] See timer and goal in popup
4. [ ] Save current tabs as a Chemistry tab group
5. [ ] On openstax.org, save current page as source (type: Textbook)
6. [ ] Select text, save highlight
7. [ ] Create flashcard from popup
8. [ ] Visit reddit.com → blocked page appears
9. [ ] Blocked attempt logged
10. [ ] Normal mode: wait 30s, enter reason, continue
11. [ ] Return to studying
12. [ ] End session with reflection
13. [ ] Session summary card appears in popup
14. [ ] Export flashcards CSV and sources Markdown successfully

---

## 34. Source Metadata Editing

- [ ] Dashboard → Sources → Edit button on a source card
- [ ] Edit form shows: Title, Source type, Course, Assignment/project, Author, Publisher, Published date, Note, Tags
- [ ] Edit the Author field → Save changes → citation draft updates to include author name
- [ ] Edit the Publisher field → Save → citation draft reflects new publisher
- [ ] Cancel → all fields revert to original values
- [ ] Confirm citation draft is labeled "verify before submitting"

---

## 35. Highlight Edit and Delete

- [ ] Dashboard → Highlights/Notes → Edit button on a highlight card
- [ ] Edit form shows: Course, Note, Tags
- [ ] Change the note → Save → updated note shown
- [ ] Change course → Save → course pill updates
- [ ] Cancel → reverts to original values
- [ ] Delete button → confirmation dialog → highlight removed from list
- [ ] "Create flashcard" button still visible and functional after editing

---

## 36. Dashboard Search

- [ ] Dashboard → Sources → type a word in the search box → list filters in real time
- [ ] Dashboard → Highlights/Notes → search by selected text or page title → filters correctly
- [ ] Dashboard → Flashcards → search by front or back text → filters correctly
- [ ] Clear the search box → full list restored
- [ ] Course filter + search work together (both applied simultaneously)

---

## 37. Demo Data Confirmation with Existing Data

- [ ] Start a real study session (not demo)
- [ ] Go to Settings → Load demo data
- [ ] Confirmation dialog appears: "You already have study data. Load demo data anyway?"
- [ ] Cancel → no demo data added, existing data preserved
- [ ] Confirm → demo data appended, existing data still present
- [ ] Load demo data again → "Demo data is already loaded." message (no duplicate)

---

## 38. Citation Details in Popup

- [ ] Open popup → Capture section → click "Add citation details"
- [ ] Author, Publisher, Published date fields appear
- [ ] Fill in Author = "Jane Smith", Publisher = "OpenStax", Date = "Jan 2024"
- [ ] Save source → open Dashboard → Sources → verify citation draft includes "Jane Smith" and "OpenStax"
- [ ] Click "Hide citation details" → fields collapse

---

## 39. Tab Groups Linked to Sessions

- [ ] Start a study session
- [ ] Click "Save current tabs" in popup
- [ ] End session → session summary shows "tab groups" stat (≥ 1)
- [ ] Dashboard → Sessions → session card shows tab groups count
- [ ] Dashboard → Tab Groups → saved group is visible with correct course and session name

---

## 40. Import Modal — Replace / Merge / Cancel

- [ ] Dashboard → Export → Import from JSON section
- [ ] Select a valid StudyLock JSON export file
- [ ] Modal appears showing item counts (sessions, sources, highlights, flashcards, tab groups, blocked attempts)
- [ ] **Replace all data** button is present and styled distinctly (danger/red)
- [ ] **Merge (add new items)** button is present
- [ ] **Cancel** button is present
- [ ] Click Cancel → modal closes, no data changes, file input is cleared
- [ ] Click Merge → modal closes, imported items added, existing items preserved, no duplicate IDs
- [ ] Click Replace → modal closes, all arrays replaced with imported data
- [ ] After Replace: if import file included settings, settings are also updated
- [ ] After Merge: settings are NOT overwritten

---

## 41. Import — Invalid JSON Handling

- [ ] Dashboard → Export → Import from JSON section
- [ ] Select a plain text file (or a JSON file that is not a StudyLock export)
- [ ] Error message appears: "Invalid JSON file — could not parse" (for non-JSON) or "File is not a valid StudyLock export…"
- [ ] No modal appears for invalid files
- [ ] File input is reset after the error
- [ ] Select a JSON file missing one of the required arrays (e.g., `sessions` key absent)
- [ ] Same error message shown, no modal

---

## 42. Source Deletion — Related Items (Highlights + Indirect Flashcards)

- [ ] Create a source, then create a highlight from that source (highlight.sourceId = source.id)
- [ ] Create a flashcard from the highlight (flashcard.highlightId = highlight.id, no direct sourceId)
- [ ] Dashboard → Sources → Delete the source
- [ ] Confirmation dialog lists both the highlight and the flashcard count
- [ ] Choose "OK = delete source and all related items"
- [ ] Source, highlight, and the indirect flashcard are all removed from the dashboard
- [ ] Choose "Cancel = keep related items" instead
- [ ] Source deleted; highlight and flashcard still visible in their respective tabs
- [ ] Highlight's sourceId is cleared (no longer shows the deleted source)
- [ ] Flashcard linked via highlightId only is NOT unlinked (its highlight still exists)

---

## 43. Course-Filtered Recent Activity

- [ ] Load demo data (Chemistry course)
- [ ] Add a second session with course = **Biology** from the popup
- [ ] Dashboard → Overview → select course filter = Chemistry
- [ ] Recent Activity panel shows only Chemistry items — no Biology session appears
- [ ] Switch filter to Biology → only Biology items appear
- [ ] Switch filter to All courses → all items appear
- [ ] Recent Activity reflects the filter (not raw unfiltered data)

---

## 44. Close Distracting Tabs Button

- [ ] Start a study session with reddit.com in blocked domains
- [ ] Open several tabs in the current window including reddit.com and an allowed site (e.g., openstax.org)
- [ ] Return to popup — "Close distracting tabs" button is visible next to "End session"
- [ ] Click "Close distracting tabs"
- [ ] Confirmation dialog shows count of unpinned distracting tabs to be closed
- [ ] Confirm → distracting (unpinned) tabs in the current window are closed, allowed tabs remain
- [ ] Message shows how many tabs were closed
- [ ] If a distracting tab is pinned: it is skipped, message notes how many pinned tabs were skipped
- [ ] If all distracting tabs are pinned: message says only pinned tabs were found, none closed
- [ ] If no distracting tabs are open in the current window: message says "No distracting tabs found."
- [ ] "Close distracting tabs" button is NOT visible when no session is active

---

## 45. Distracting Tab Notification on Session Start

- [ ] Open several tabs in the current window including reddit.com (which is in blocked domains list)
- [ ] Start a new session with reddit.com blocked
- [ ] Success message includes "X distracting tab(s) open — use 'Close distracting tabs' to remove them"
- [ ] If no distracting tabs are open in the current window: plain "Study session started." message (no notice)

---

## 46. Expired Session Auto-Summary

- [ ] Start a short session (e.g., 5 minutes) and wait for it to expire without ending it manually
- [ ] After the timer runs out, the popup automatically shows the session summary card
- [ ] Message "Your session time is up." appears
- [ ] Summary card shows the correct stats (blocks, sources, etc.)
- [ ] Session form is hidden while summary is visible
- [ ] Dismiss (✕) button hides the summary and shows the session start form

---

## 47. Expired Session Reflection

- [ ] Let a session expire (do not end it manually)
- [ ] Summary card appears — if no reflection was added during the session, a "Add a reflection" textarea and "Save reflection" button are visible
- [ ] Type a reflection and click "Save reflection"
- [ ] Textarea is replaced by the saved reflection text
- [ ] Open Dashboard → Sessions → the completed session shows the reflection text
- [ ] If a reflection was already saved (manually ended session with reflection), the add-reflection UI is not shown

---

## 48. Domain Validation on Session Start

- [ ] In the Blocked domains field, enter junk text like "not a domain, !!!invalid, reddit.com"
- [ ] Start session
- [ ] Only valid-looking domains (e.g., reddit.com) are saved — junk entries are silently dropped
- [ ] Verify by navigating to a blocked valid domain → blocked as expected
- [ ] In Allowlist mode, entering only junk in allowed domains shows "Allowlist mode requires at least one allowed domain"

---

## 49. Import Normalization

- [ ] Dashboard → Export → Import from JSON
- [ ] Import a JSON file where one session has `"status": "active"` — after import, that session appears as "completed" in the Sessions tab
- [ ] Import a JSON file where sessions are missing `tabGroupsSavedCount` — all sessions load without errors, missing field defaults to 0
- [ ] Import a JSON file where a source has `"sourceType": "book"` (unknown type) — source imports with type "webpage"
- [ ] Import a JSON file where a source has an empty `domain` field — source imports and domain is derived from the URL
- [ ] Import a JSON file where a highlight has no `pageTitle` — highlight imports with title "Untitled Page"
- [ ] Import a JSON file where a flashcard is missing `tags` — flashcard imports with empty tags array
- [ ] Import a file containing items with invalid URLs (where domain cannot be parsed) — those items are counted in the skipped warning in the modal

---

## 50. Storage Consistency Repair

- [ ] Manually corrupt storage: set `studylock_active_session_id` to an ID that does not exist in `studylock_sessions`
- [ ] Open Dashboard — no crash, no broken UI
- [ ] Dashboard → Sessions — no "active" session displayed; pointer was cleared silently
- [ ] Manually set two sessions to `"status": "active"` in storage
- [ ] Open Dashboard — only one session (or none) remains active; extra active sessions are shown as "completed"
