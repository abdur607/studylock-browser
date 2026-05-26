import { decideBlocking } from "../lib/blockingEngine";
import { grantBypass, getActiveSession, isBypassGranted, addItem, createId } from "../lib/storage";
import { expireSessionIfNeeded, incrementSessionCounter } from "../lib/sessionManager";
import { BlockedAttempt, BypassType, STORAGE_KEYS } from "../lib/types";

async function logBlockedAttempt(url: string, domain: string, sessionId: string, modeTriggered: "blocklist" | "allowlist"): Promise<BlockedAttempt> {
  const attempt: BlockedAttempt = {
    id: createId("attempt"),
    sessionId,
    domain,
    url,
    timestamp: new Date().toISOString(),
    modeTriggered,
    bypassed: false
  };
  await addItem(STORAGE_KEYS.blockedAttempts, attempt);
  await incrementSessionCounter(sessionId, "blockedAttemptCount");
  return attempt;
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(STORAGE_KEYS.settings, (result) => {
    if (!result[STORAGE_KEYS.settings]) {
      chrome.storage.local.set({
        [STORAGE_KEYS.settings]: {
          defaultBlockedDomains: ["reddit.com", "instagram.com", "tiktok.com", "x.com", "twitter.com", "netflix.com", "amazon.com"],
          defaultAllowedDomains: ["courseworks.columbia.edu", "docs.google.com", "openstax.org"],
          defaultSessionLength: 60,
          defaultStrictness: "normal",
          enableAllowlist: false,
          showTimer: true,
          logBypassReasons: true
        }
      });
    }
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  void (async () => {
    if (message.type === "CHECK_BLOCK") {
      await expireSessionIfNeeded();
      const session = await getActiveSession();
      if (session && (await isBypassGranted(session.id, message.url))) {
        sendResponse({ shouldBlock: false });
        return;
      }
      const decision = decideBlocking(message.url, session);
      if (!decision.shouldBlock || !session || !decision.domain || !decision.modeTriggered) {
        sendResponse({ shouldBlock: false, reason: decision.reason });
        return;
      }
      const attempt = await logBlockedAttempt(message.url, decision.domain, session.id, decision.modeTriggered);
      const blockedUrl = chrome.runtime.getURL(
        `src/blocked/blocked.html?url=${encodeURIComponent(message.url)}&domain=${encodeURIComponent(decision.domain)}&sessionId=${encodeURIComponent(session.id)}&attemptId=${encodeURIComponent(attempt.id)}&reason=${encodeURIComponent(decision.reason)}`
      );
      sendResponse({ shouldBlock: true, blockedUrl });
      return;
    }

    if (message.type === "BYPASS_BLOCK") {
      const session = await getActiveSession();
      if (!session) {
        sendResponse({ ok: false });
        return;
      }
      await grantBypass(session.id, message.url, 5);
      const stored = await chrome.storage.local.get(STORAGE_KEYS.blockedAttempts);
      const list = (stored[STORAGE_KEYS.blockedAttempts] ?? []) as BlockedAttempt[];
      const bypassType: BypassType = message.bypassType ?? "normal";
      const next = list.map((attempt) =>
        attempt.id === message.attemptId
          ? { ...attempt, bypassed: true, bypassReason: message.reason, bypassType }
          : attempt
      );
      await chrome.storage.local.set({ [STORAGE_KEYS.blockedAttempts]: next });
      await incrementSessionCounter(session.id, "bypassCount");
      sendResponse({ ok: true });
      return;
    }

    sendResponse({ ok: false });
  })();
  return true;
});
