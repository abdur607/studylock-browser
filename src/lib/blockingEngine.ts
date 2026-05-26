import { domainMatches, getDomainFromUrl, isInternalUrl } from "./domainUtils";
import { BlockingDecision, StudySession } from "./types";

export function decideBlocking(url: string, session?: StudySession): BlockingDecision {
  if (!session || session.status !== "active") {
    return { shouldBlock: false, reason: "No active study session." };
  }

  if (isInternalUrl(url)) {
    return { shouldBlock: false, reason: "Browser or extension page." };
  }

  const domain = getDomainFromUrl(url);
  if (!domain) {
    return { shouldBlock: false, reason: "No web domain found." };
  }

  if (session.mode === "blocklist") {
    const matched = session.blockedDomains.some((blocked) => domainMatches(domain, blocked));
    return {
      shouldBlock: matched,
      domain,
      modeTriggered: "blocklist",
      reason: matched ? `${domain} is on this session's blocklist.` : "Domain is not blocked."
    };
  }

  const allowed = session.allowedDomains.some((allowedDomain) => domainMatches(domain, allowedDomain));
  return {
    shouldBlock: !allowed,
    domain,
    modeTriggered: "allowlist",
    reason: allowed ? "Domain is allowed for this session." : `${domain} is not on this session's allowlist.`
  };
}
