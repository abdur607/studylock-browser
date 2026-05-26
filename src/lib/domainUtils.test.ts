import { describe, expect, it } from "vitest";
import { domainMatches, getDomainFromUrl, isInternalUrl, isLikelyDomain, normalizeDomain } from "./domainUtils";

describe("isInternalUrl", () => {
  it("detects chrome:// URLs", () => expect(isInternalUrl("chrome://extensions")).toBe(true));
  it("detects chrome-extension:// URLs", () => expect(isInternalUrl("chrome-extension://abc/blocked.html")).toBe(true));
  it("detects about:blank", () => expect(isInternalUrl("about:blank")).toBe(true));
  it("allows http URLs", () => expect(isInternalUrl("http://reddit.com")).toBe(false));
  it("allows https URLs", () => expect(isInternalUrl("https://google.com")).toBe(false));
});

describe("getDomainFromUrl", () => {
  it("strips www prefix", () => expect(getDomainFromUrl("https://www.reddit.com/r/test")).toBe("reddit.com"));
  it("handles no www", () => expect(getDomainFromUrl("https://reddit.com")).toBe("reddit.com"));
  it("handles subdomain", () => expect(getDomainFromUrl("https://old.reddit.com/r/news")).toBe("old.reddit.com"));
  it("handles invalid URL gracefully", () => expect(getDomainFromUrl("not a url")).toBe(""));
  it("handles empty string", () => expect(getDomainFromUrl("")).toBe(""));
});

describe("normalizeDomain", () => {
  it("strips https://", () => expect(normalizeDomain("https://reddit.com")).toBe("reddit.com"));
  it("strips www.", () => expect(normalizeDomain("www.reddit.com")).toBe("reddit.com"));
  it("strips path", () => expect(normalizeDomain("reddit.com/r/test")).toBe("reddit.com"));
  it("trims whitespace", () => expect(normalizeDomain("  reddit.com  ")).toBe("reddit.com"));
  it("lowercases", () => expect(normalizeDomain("Reddit.COM")).toBe("reddit.com"));
});

describe("isLikelyDomain", () => {
  it("accepts simple domain", () => expect(isLikelyDomain("reddit.com")).toBe(true));
  it("accepts subdomain", () => expect(isLikelyDomain("old.reddit.com")).toBe(true));
  it("accepts domain with https:// prefix (normalized)", () => expect(isLikelyDomain("https://reddit.com")).toBe(true));
  it("accepts domain with www prefix (normalized)", () => expect(isLikelyDomain("www.reddit.com")).toBe(true));
  it("accepts domain with path (path stripped)", () => expect(isLikelyDomain("reddit.com/r/test")).toBe(true));
  it("rejects plain word without dot", () => expect(isLikelyDomain("reddit")).toBe(false));
  it("rejects empty string", () => expect(isLikelyDomain("")).toBe(false));
  it("rejects string with spaces", () => expect(isLikelyDomain("not a domain")).toBe(false));
  it("rejects bare TLD with leading dot", () => expect(isLikelyDomain(".com")).toBe(false));
  it("accepts multi-part TLD like co.uk", () => expect(isLikelyDomain("bbc.co.uk")).toBe(true));
});

describe("domainMatches", () => {
  it("exact match", () => expect(domainMatches("reddit.com", "reddit.com")).toBe(true));
  it("subdomain matches parent rule", () => expect(domainMatches("old.reddit.com", "reddit.com")).toBe(true));
  it("www stripped and matched", () => expect(domainMatches("www.reddit.com", "reddit.com")).toBe(true));
  it("subdomain path matches parent rule", () => expect(domainMatches("reddit.com/r/test", "reddit.com")).toBe(true));
  it("does not false-match partial domain", () => expect(domainMatches("fakereddit.com", "reddit.com")).toBe(false));
  it("rule google.com matches docs.google.com (subdomain of rule)", () => expect(domainMatches("docs.google.com", "google.com")).toBe(true));
  it("rule docs.google.com does NOT match google.com (narrower rule does not match parent)", () => expect(domainMatches("google.com", "docs.google.com")).toBe(false));
  it("google.com matches google.com", () => expect(domainMatches("google.com", "google.com")).toBe(true));
  it("malformed URL does not crash", () => expect(domainMatches("not a url", "reddit.com")).toBe(false));
});
