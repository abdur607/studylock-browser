# StudyLock — Privacy Policy

**Last updated:** 2026-05-25

---

## Overview

StudyLock is a local-first Chrome extension. It does not collect, transmit, or share any personal data with any server, company, or third party.

---

## Data Storage

All data created by StudyLock is stored exclusively in your browser using **`chrome.storage.local`** — a browser-native storage mechanism that never leaves your device unless you explicitly export a JSON backup file.

Data stored locally includes:

| Data | Stored as | Purpose |
|---|---|---|
| Study sessions | `studylock_sessions` | Session history and stats |
| Blocked page attempts | `studylock_blocked_attempts` | Bypass logging |
| Saved sources | `studylock_sources` | Source capture and citation |
| Highlights and notes | `studylock_highlights` | Highlight and note storage |
| Flashcards | `studylock_flashcards` | Flashcard study tool |
| Tab groups | `studylock_tab_groups` | Tab group snapshots |
| Settings | `studylock_settings` | User preferences |
| Bypass grants | `studylock_bypass_grants` | Temporary unlock tokens (expire in 5 minutes) |

---

## What We Do Not Do

- **No data collection** — No study data, usage analytics, or telemetry is sent anywhere.
- **No accounts** — The extension requires no sign-in, registration, or email address.
- **No cloud sync** — Data is not synced to any server or cloud service.
- **No third-party APIs** — The extension does not call any external API, AI service, or analytics platform.
- **No tracking** — No cookies, fingerprinting, or behavioral tracking.
- **No advertising** — The extension contains no ads.

---

## Permissions Used

| Chrome Permission | Why it is needed |
|---|---|
| `storage` | Saves all local data using `chrome.storage.local` |
| `tabs` | Reads open tabs in the current window to save and restore tab groups; counts distracting tabs |
| `activeTab` | Reads the current page URL and title when saving a source from the popup |
| `scripting` | Reads text selected on a page when saving a highlight from the popup |
| `<all_urls>` host permission | Allows the content script to run on all web pages to check blocking rules |

No permission is used for data collection or transmission.

---

## JSON Export

If you use the **Export all data JSON** feature, a file is downloaded to your device. This file is created locally and is not sent anywhere. You are responsible for the security of any exported file.

---

## Data Deletion

All locally stored data can be removed at any time:

- **Reset in the extension:** Dashboard → Settings → **Reset all local data**
- **Uninstall:** Uninstalling the extension from Chrome removes all `chrome.storage.local` data associated with it.

---

## No Minors' Data

StudyLock does not knowingly collect data from anyone, including minors.

---

## Changes to This Policy

If this policy changes in a future version, the "Last updated" date above will be updated and the new policy will be distributed with the updated extension.

---

## Contact

Questions about this privacy policy? Contact: [absaqib2005@gmail.com]
