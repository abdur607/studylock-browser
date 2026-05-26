import { describe, expect, it } from "vitest";
import { decideBlocking } from "./blockingEngine";
import { StudySession } from "./types";

function makeSession(overrides: Partial<StudySession> = {}): StudySession {
  return {
    id: "s1",
    course: "Chemistry",
    task: "Final Review",
    durationMinutes: 60,
    startTime: new Date(Date.now() - 10_000).toISOString(),
    status: "active",
    strictness: "normal",
    mode: "blocklist",
    blockedDomains: ["reddit.com", "instagram.com"],
    allowedDomains: ["openstax.org", "docs.google.com"],
    blockedAttemptCount: 0,
    bypassCount: 0,
    sourcesSavedCount: 0,
    notesCreatedCount: 0,
    flashcardsCreatedCount: 0,
    tabGroupsSavedCount: 0,
    ...overrides
  };
}

describe("decideBlocking — no session", () => {
  it("allows page when no session", () => {
    expect(decideBlocking("https://reddit.com", undefined).shouldBlock).toBe(false);
  });
  it("allows page when session is completed", () => {
    const s = makeSession({ status: "completed" });
    expect(decideBlocking("https://reddit.com", s).shouldBlock).toBe(false);
  });
});

describe("decideBlocking — internal URLs", () => {
  const session = makeSession();
  it("never blocks chrome:// URLs", () => {
    expect(decideBlocking("chrome://extensions", session).shouldBlock).toBe(false);
  });
  it("never blocks chrome-extension:// URLs", () => {
    expect(decideBlocking("chrome-extension://abc/popup.html", session).shouldBlock).toBe(false);
  });
  it("never blocks about:blank", () => {
    expect(decideBlocking("about:blank", session).shouldBlock).toBe(false);
  });
});

describe("decideBlocking — blocklist mode", () => {
  const session = makeSession({ mode: "blocklist" });

  it("blocks a domain on the blocklist", () => {
    expect(decideBlocking("https://reddit.com", session).shouldBlock).toBe(true);
  });
  it("blocks a subdomain of a blocked domain", () => {
    expect(decideBlocking("https://www.reddit.com/r/news", session).shouldBlock).toBe(true);
  });
  it("allows a domain not on the blocklist", () => {
    expect(decideBlocking("https://openstax.org", session).shouldBlock).toBe(false);
  });
  it("allows a domain from the allowed list (blocklist mode does not restrict unlisted)", () => {
    expect(decideBlocking("https://docs.google.com", session).shouldBlock).toBe(false);
  });
});

describe("decideBlocking — allowlist mode", () => {
  const session = makeSession({ mode: "allowlist" });

  it("allows an explicitly allowed domain", () => {
    expect(decideBlocking("https://openstax.org", session).shouldBlock).toBe(false);
  });
  it("blocks a domain not on the allowlist", () => {
    expect(decideBlocking("https://reddit.com", session).shouldBlock).toBe(true);
  });
  it("blocks any random domain", () => {
    expect(decideBlocking("https://twitter.com", session).shouldBlock).toBe(true);
  });
  it("allows subdomain of an allowed domain", () => {
    expect(decideBlocking("https://docs.google.com/document/abc", session).shouldBlock).toBe(false);
  });
});

describe("decideBlocking — expired/malformed", () => {
  it("returns shouldBlock false for a URL with no domain", () => {
    const session = makeSession();
    expect(decideBlocking("not-a-url", session).shouldBlock).toBe(false);
  });
});
