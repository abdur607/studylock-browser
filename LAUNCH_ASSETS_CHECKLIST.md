# Launch Assets Checklist — StudyLock

Use this checklist to prepare all assets needed before submitting to the Chrome Web Store.

---

## 1. Extension Icons

Required sizes for `public/icons/` (PNG, square):

| File | Size | Status |
|---|---|---|
| `icon16.png` | 16×16 px | [ ] |
| `icon32.png` | 32×32 px | [ ] |
| `icon48.png` | 48×48 px | [ ] |
| `icon128.png` | 128×128 px | [ ] |

- [ ] Icons clearly convey the extension's purpose (lock + study / book imagery)
- [ ] Icons look sharp at small sizes (16px, 32px)
- [ ] Icons have transparent or solid background (no JPEG artifacts)

---

## 2. Store Screenshots

Required by the Chrome Web Store. Size: **1280×800** or **640×400** px (PNG or JPEG).

| Screenshot | Content | Status |
|---|---|---|
| `screenshot-01-session-active.png` | Popup with active session: timer, goal, blocks counter, close tabs button | [ ] |
| `screenshot-02-session-form.png` | Popup with session start form (course, task, domain list) | [ ] |
| `screenshot-03-blocked-page.png` | Blocked page showing domain, session name, strictness countdown | [ ] |
| `screenshot-04-dashboard-overview.png` | Dashboard Overview: analytics cards, recent activity, course filter | [ ] |
| `screenshot-05-dashboard-sources.png` | Dashboard Sources: source cards, citation drafts, search bar | [ ] |

> Use demo data (Dashboard → Settings → Load demo data) for realistic screenshots.

**Recommended optional screenshots:**

| Screenshot | Content |
|---|---|
| `screenshot-06-dashboard-flashcards.png` | Flashcard cards with front/back, CSV export button |
| `screenshot-07-import-modal.png` | Import modal showing item counts and action buttons |
| `screenshot-08-session-summary.png` | Session summary card in popup with stats and reflection |

---

## 3. Promotional Images (Optional)

| Image | Size | Purpose |
|---|---|---|
| `promo-small.png` | 440×280 px | Shown in search results |
| `promo-large.png` | 920×680 px | Shown on extension detail page |
| `promo-marquee.png` | 1400×560 px | Featured placement (if selected) |

- [ ] Promo images use the extension logo and a brief tagline
- [ ] Text in images is readable at display size
- [ ] No misleading claims in promo images

---

## 4. Store Listing Text

- [ ] Extension name: `StudyLock` (≤ 45 characters)
- [ ] Short description (≤ 132 characters) drafted and reviewed — see `CHROME_STORE_CHECKLIST.md`
- [ ] Detailed description (≤ 16,000 characters) drafted and reviewed — see `CHROME_STORE_CHECKLIST.md`
- [ ] Category: `Productivity`
- [ ] Language: `English`

---

## 5. Privacy Policy

- [ ] `PRIVACY_POLICY_DRAFT.md` reviewed and finalized
- [ ] Privacy policy hosted at a public URL (GitHub Pages, personal site, or similar)
- [ ] Contact email filled in
- [ ] "Last updated" date set to publication date
- [ ] URL added to Chrome Web Store developer dashboard

---

## 6. Developer Account

- [ ] Google developer account registered ($5 one-time fee)
- [ ] Developer dashboard accessible at [https://chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole)
- [ ] Payment method on file (for one-time registration fee)
- [ ] Support email set in developer profile

---

## 7. Distribution ZIP

- [ ] Run `npm run build` — clean build
- [ ] `dist/` folder contains all required files (see `CHROME_STORE_CHECKLIST.md § 1`)
- [ ] ZIP the contents of `dist/` (not `dist/` itself — zip the files inside it)
- [ ] ZIP size is reasonable (< 10 MB)
- [ ] Test the ZIP by loading it as an unpacked extension in Chrome before upload

---

## 8. Final Verification Before Upload

- [ ] Loaded `dist/` as unpacked extension — all features work end-to-end
- [ ] Demo flow in `CHROME_STORE_CHECKLIST.md § 8` runs without errors
- [ ] No console errors in popup, dashboard, or blocked page
- [ ] `npm audit --omit=dev` shows 0 vulnerabilities
- [ ] Version in `manifest.json` matches the version being submitted
- [ ] Git tag created: `git tag v1.0.0 && git push --tags`

---

## 9. Post-Submission

- [ ] Submission confirmation email received from Google
- [ ] Monitor developer dashboard for review status (typically 1–3 business days)
- [ ] If rejected: read rejection reason; fix and resubmit
- [ ] Once approved: update `README.md` with Chrome Web Store link
- [ ] Announce in relevant communities (optional)
