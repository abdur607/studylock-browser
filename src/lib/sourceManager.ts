import { addItem, createId, getActiveSession } from "./storage";
import { getDomainFromUrl } from "./domainUtils";
import { createCitationDraft } from "./citationHelper";
import { incrementSessionCounter } from "./sessionManager";
import { SavedSource, SourceType, STORAGE_KEYS } from "./types";

export async function saveSource(input: {
  title: string;
  url: string;
  selectedText?: string;
  note?: string;
  course?: string;
  sourceType?: SourceType;
  assignment?: string;
  author?: string;
  publisher?: string;
  publishedDate?: string;
  tags?: string[];
}): Promise<SavedSource> {
  const active = await getActiveSession();
  const domain = getDomainFromUrl(input.url);
  const source: SavedSource = {
    id: createId("source"),
    course: input.course || active?.course,
    sessionId: active?.id,
    title: input.title || "Untitled Page",
    url: input.url,
    domain,
    sourceType: input.sourceType ?? "webpage",
    assignment: input.assignment,
    author: input.author,
    publisher: input.publisher,
    publishedDate: input.publishedDate,
    accessedAt: new Date().toISOString(),
    selectedText: input.selectedText,
    note: input.note,
    tags: input.tags ?? [],
    citationDraft: createCitationDraft(input.title, domain, input.url, {
      publisher: input.publisher,
      author: input.author,
      publishedDate: input.publishedDate
    })
  };
  await addItem(STORAGE_KEYS.sources, source);
  if (active) await incrementSessionCounter(active.id, "sourcesSavedCount");
  return source;
}
