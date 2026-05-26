export function isInternalUrl(url: string): boolean {
  return /^(chrome|chrome-extension|edge|brave|vivaldi|opera|moz-extension):\/\//i.test(url) ||
    /^about:/i.test(url);
}

export function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

export function normalizeDomain(domain: string): string {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];
}

export function parseDomainList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map(normalizeDomain)
    .filter(Boolean);
}

export function domainMatches(currentDomain: string, ruleDomain: string): boolean {
  const current = normalizeDomain(currentDomain);
  const rule = normalizeDomain(ruleDomain);
  return current === rule || current.endsWith(`.${rule}`);
}

export function isLikelyDomain(value: string): boolean {
  const normalized = normalizeDomain(value);
  if (!normalized) return false;
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(normalized);
}
