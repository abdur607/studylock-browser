# StudyLock — Architecture Diagram

This document describes the runtime architecture of the StudyLock Chrome extension using Mermaid diagrams.

---

## Extension Context Map

```mermaid
graph TD
    User["User (Chrome Browser)"]

    subgraph "Extension Pages"
        Popup["Popup (popup.html)\nReact 18 + TypeScript\nSession management, source/highlight/flashcard capture"]
        Dashboard["Dashboard (dashboard.html)\nReact 18 + TypeScript\nData review, analytics, export, import, settings"]
        Blocked["Blocked Page (blocked.html)\nReact 18 + TypeScript\nBypass flow (soft / normal / strict)"]
    end

    subgraph "Background"
        SW["Service Worker (serviceWorker.js)\nMV3 background script\nCHECK_BLOCK, BYPASS_BLOCK messages"]
    end

    subgraph "Content Script"
        CS["Content Script (contentScript.js)\nInjects at document_start on <all_urls>\nSPA navigation detection + block check"]
    end

    subgraph "Shared Libraries"
        Lib["src/lib/\nblockingEngine, sessionManager, storage,\nexportUtils, importUtils, domainUtils,\ncitationHelper, migration, analytics,\nsourceManager, highlightManager,\nflashcardManager, tabGroupManager,\ntabGroupManager, recentActivity,\nsourceRelationships, searchUtils"]
    end

    subgraph "Storage"
        CStorage["chrome.storage.local\n(all data, 5 MB limit)"]
    end

    User -->|"clicks icon"| Popup
    User -->|"opens options page"| Dashboard
    User -->|"visits blocked site"| CS

    CS -->|"chrome.runtime.sendMessage\nCHECK_BLOCK"| SW
    SW -->|"returns block decision\n(url to redirect or null)"| CS
    CS -->|"location.replace(blocked_url)"| Blocked

    Blocked -->|"chrome.runtime.sendMessage\nBYPASS_BLOCK"| SW
    SW -->|"grants 5-min bypass\nlogs attempt + bypassType"| CStorage

    Popup -->|"reads/writes"| Lib
    Dashboard -->|"reads/writes"| Lib
    Lib -->|"chrome.storage.local wrappers"| CStorage

    SW -->|"incrementSessionCounter\nblockedAttemptCount, bypassCount"| CStorage
```

---

## Import / Export Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Dashboard
    participant exportUtils
    participant importUtils
    participant Storage as chrome.storage.local

    Note over User,Storage: Export
    User->>Dashboard: Click "All data JSON"
    Dashboard->>exportUtils: exportAllJson({ sessions, sources, ... })
    exportUtils->>User: Download studylock-data.json

    Note over User,Storage: Import
    User->>Dashboard: Select JSON file
    Dashboard->>exportUtils: parseImportPayload(rawData)
    exportUtils-->>Dashboard: ImportPayload (shape-validated, skippedCount)
    Dashboard->>importUtils: normalizeImportPayload(payload)
    importUtils-->>Dashboard: Normalized payload (active→completed, defaults filled)
    Dashboard->>User: Show ImportModal (counts + skippedCount warning)
    User->>Dashboard: Click "Replace all data" or "Merge"
    Dashboard->>Storage: setArray for each collection
    Dashboard->>Storage: setActiveSession(undefined) [on Replace]
    Dashboard->>Storage: setArray(bypassGrants, []) [on Replace]
```

---

## Session Lifecycle

```mermaid
stateDiagram-v2
    [*] --> planned : (not used in v1 — sessions start as active)
    [*] --> active : startSession()
    active --> completed : completeActiveSession() or expireSessionIfNeeded()
    active --> cancelled : (future)
    completed --> [*]
    cancelled --> [*]

    note right of active
        repairStorageConsistency() 
        completes orphaned actives 
        on every dashboard load
    end note

    note right of completed
        normalizeImportPayload() 
        converts imported "active" 
        sessions to "completed"
    end note
```

---

## Blocking Decision Flow

```mermaid
flowchart TD
    Nav["Page navigation\n(load or SPA route change)"]
    Internal{"isInternalUrl?"}
    Nav --> Internal
    Internal -->|"yes (chrome://, extension pages)"| Allow["Allow — no check sent"]
    Internal -->|"no"| Debounce["250ms debounce\n(prevents rapid SPA checks)"]
    Debounce --> SendMsg["contentScript sends\nCHECK_BLOCK to service worker"]
    SendMsg --> ActiveSession{"Active session?"}
    ActiveSession -->|"none"| AllowNoSession["Allow — no active session"]
    ActiveSession -->|"yes"| BypassGrant{"Bypass grant\nfor this URL?"}
    BypassGrant -->|"yes (< 5 min old)"| AllowGrant["Allow — bypass active"]
    BypassGrant -->|"no"| Mode{"Session mode"}
    Mode -->|"blocklist"| BlocklistCheck{"Domain in\nblockedDomains?"}
    Mode -->|"allowlist"| AllowlistCheck{"Domain in\nallowedDomains?"}
    BlocklistCheck -->|"no"| AllowFinal["Allow"]
    BlocklistCheck -->|"yes"| Block["Block →\nredirect to blocked page"]
    AllowlistCheck -->|"yes"| AllowFinal
    AllowlistCheck -->|"no"| Block
```

---

## Storage Keys Reference

| Key | Type | Description |
|---|---|---|
| `studylock_sessions` | `StudySession[]` | All sessions (active, completed, cancelled) |
| `studylock_active_session_id` | `string \| null` | ID of the current active session |
| `studylock_blocked_attempts` | `BlockedAttempt[]` | Every blocked page attempt with bypass info |
| `studylock_sources` | `SavedSource[]` | Saved web sources with citation drafts |
| `studylock_highlights` | `HighlightNote[]` | Text highlights with notes |
| `studylock_flashcards` | `Flashcard[]` | Study flashcards |
| `studylock_tab_groups` | `TabGroup[]` | Saved tab group snapshots |
| `studylock_settings` | `Settings` | User preferences |
| `studylock_bypass_grants` | `BypassGrant[]` | Temporary URL unlock grants (expire in 5 min) |
| `studylock_schema_version` | `number` | Schema version for migrations |

---

## Key Design Constraints

- **Local-first**: No network requests, no backend, no account. All data in `chrome.storage.local`.
- **MV3**: Service worker (not persistent background page). Background logic runs on-demand via messages.
- **Session expiry**: Sessions expire when the extension is next used (popup open, blocking check, dashboard load) — not via a background timer.
- **Blocking scope**: Content script runs on all URLs but skips internal pages. Close Distracting Tabs scans only the current window.
- **No device-level lockdown**: Students can disable an unpacked extension from Chrome settings. The friction model is deliberate, not absolute.
- **CSP**: `script-src 'self'; object-src 'self'` — no remote scripts, no `eval`, no `unsafe-inline`.
