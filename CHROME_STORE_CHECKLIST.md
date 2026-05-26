# Chrome Web Store Submission Checklist — StudyLock

Use this checklist before submitting or updating StudyLock on the Chrome Web Store.

---

## 1. Build Readiness

- [ ] `npm run build` completes without errors
- [ ] `npm test` passes all 225 tests, 0 failing
- [ ] `npm audit --omit=dev` shows 0 vulnerabilities
- [ ] `dist/` folder is clean and complete:
  - `manifest.json`
  - `serviceWorker.js`
  - `contentScript.js`
  - `popup.js`, `dashboard.js`, `blocked.js`
  - `icons/icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`
- [ ] Manifest version in `manifest.json` matches the version being submitted

---

## 2. Permissions Justification

Each permission must be individually justified in the store submission form.

| Permission | Justification |
|---|---|
| `storage` | Saves all local data: sessions, sources, highlights, flashcards, tab groups, settings, and bypass grants using `chrome.storage.local` |
| `tabs` | Reads open tabs in the current window to save tab groups; opens restored tab group tabs; counts distracting tabs during a session |
| `activeTab` | Lets the popup read the current page URL and title when saving a source |
| `scripting` | Reads selected text from the active page for highlight capture |
| `<all_urls>` host permission | Allows the content script to run on all web pages and check them against the active session's blocking rules |

> No remote code is executed. All scripts are bundled locally.

---

## 3. Store Listing Content

### Extension Name
`StudyLock`

### Short Description (≤ 132 characters)
`Stay focused while studying online. Block distractions, save sources, take notes, and create flashcards — all locally, no account needed.`

### Detailed Description (≤ 16,000 characters — draft below)

```
StudyLock helps students use the internet productively during study sessions. 
No backend. No account. No tracking. All data stays in your browser.

WHAT IT DOES
• Start a timed study session with a course name, task, and goal
• Block distracting sites (blocklist mode) or restrict to a study-only allowlist
• Three bypass strictness levels: Soft (continue freely), Normal (30-second wait + reason), Strict (60-second wait + reason + confirmation)
• Save the current page as a source with auto-generated citation drafts
• Highlight and save selected text with notes and tags
• Create flashcards from highlights or manually; export as CSV
• Save and restore tab groups per course and session
• View session summaries with focused time, blocks, bypasses, sources, notes, and flashcards
• Full dashboard with analytics, search, course filter, and export tools
• Import/export all data as JSON for backup and restore
• Demo data for first-time users to explore features

PRIVACY
All study data is stored locally using chrome.storage.local. StudyLock has no backend, no account system, no analytics service, and no AI or cloud API. Your notes, sources, highlights, and session data never leave your browser.

LIMITATIONS
• This is useful friction, not device-level lockdown. Students can disable an unpacked extension.
• Blocking does not apply to Chrome internal pages (chrome://).
• Citation drafts are rough drafts — always verify before submitting.
```

### Category
`Productivity`

### Keywords / Tags
`study, focus, productivity, blocker, distraction, flashcards, notes, sources, citation, student, session timer`

---

## 4. Screenshots

Minimum 1, recommended 3–5. Size: 1280×800 or 640×400.

- [ ] **Popup — session active**: Timer, goal, blocks counter, "Close distracting tabs" button visible
- [ ] **Popup — session start form**: Course, task, duration, strictness, mode, domain lists
- [ ] **Blocked page**: Domain name, session context, strictness countdown
- [ ] **Dashboard — Overview**: Analytics cards, Recent Activity panel, course filter
- [ ] **Dashboard — Sources**: Source cards with citation drafts, search box, export button
- [ ] **Dashboard — Flashcards**: Flashcard cards with front/back, inline edit, CSV export button
- [ ] **Dashboard — Session summary card**: Stats grid, reflection, export button

> Screenshots should use the demo data (Settings → Load demo data) for a realistic-looking store listing.

---

## 5. Promotional Images (Optional)

- [ ] Small promo tile: 440×280 px
- [ ] Large promo tile: 920×680 px (for featured placement)
- [ ] Marquee promo tile: 1400×560 px

---

## 6. Privacy Policy

StudyLock does not collect, transmit, or share any user data. All data is stored locally in the browser using `chrome.storage.local` and is removed when the extension is uninstalled.

- [ ] Host a one-page privacy policy at a public URL (e.g., GitHub Pages, a personal site)
- [ ] Privacy policy URL entered in the store developer dashboard
- [ ] Privacy policy states: no data collection, no third-party sharing, local-only storage

**Privacy policy template:**

```
StudyLock — Privacy Policy

Last updated: [date]

StudyLock does not collect, store, or transmit any personal data 
to any server. All study sessions, sources, highlights, flashcards, and 
settings are stored exclusively in your browser using chrome.storage.local.

No analytics, no accounts, no cloud sync, no AI APIs.

Data is removed when you uninstall the extension or use the "Reset all 
local data" option in the dashboard.

Questions? Contact: [your email]
```

---

## 7. Support Contact

- [ ] Support email set in the developer dashboard: `[your-email@example.com]`
- [ ] (Optional) GitHub Issues link added as the support URL

---

## 8. Demo Flow for Store Review

Reviewers may test the extension. Ensure this flow works end-to-end:

1. Install the unpacked extension from `dist/`
2. Click the extension icon → popup opens
3. Start a session: Chemistry, Final Review, 60 min, Normal, Blocklist, reddit.com blocked
4. See the timer and goal in the popup
5. Click "Save current tabs" → success message
6. Navigate to `openstax.org` → not blocked
7. Save it as a source (Textbook type) → "Source saved with a citation draft"
8. Select a sentence → save highlight → "Highlight saved"
9. Create a flashcard → "Flashcard saved"
10. Navigate to `reddit.com` → redirected to blocked page
11. Normal mode: wait 30 seconds, enter reason, continue
12. End session → summary card appears with stats
13. Open dashboard → all data visible
14. Export flashcards CSV and sources Markdown → downloads work
15. Settings → Reset all local data → data cleared, empty state shown

---

## 9. Pre-Submission Checks

- [ ] Manifest V3 (not V2)
- [ ] No remote code execution (no `eval`, no `new Function`, no remote scripts)
- [ ] All icons present in `dist/icons/`
- [ ] Extension name in manifest matches store listing name
- [ ] Version number incremented since last submission
- [ ] `content_security_policy` in manifest.json is `"script-src 'self'; object-src 'self'"` (no unsafe-inline, no remote sources)
- [ ] No hard-coded API keys or credentials in the codebase
- [ ] Store listing reviewed for typos and accurate feature descriptions
- [ ] All screenshot dimensions are correct (1280×800 or 640×400)

---

## 10. Post-Submission

- [ ] Monitor the Chrome Web Store developer dashboard for review status
- [ ] If rejected, read the rejection reason carefully — common issues are overly broad permissions or missing justifications
- [ ] Update the README with the Chrome Web Store link once published
- [ ] Tag the release in git: `git tag v1.0.0`
