const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function accessedDate(date = new Date()): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function createCitationDraft(
  title: string,
  domain: string,
  url: string,
  opts: { publisher?: string; author?: string; publishedDate?: string } = {},
  date = new Date()
): string {
  const titlePart = title?.trim() ? `"${title.trim()}."` : '"Untitled Page."';
  const sourcePart = opts.publisher?.trim() ?? domain;
  const authorPart = opts.author?.trim() ? `${opts.author.trim()}, ` : "";
  const pubDatePart = opts.publishedDate?.trim() ? `, ${opts.publishedDate.trim()}` : "";
  return `${authorPart}${titlePart} ${sourcePart}${pubDatePart}, ${url}. Accessed ${accessedDate(date)}.`;
}
