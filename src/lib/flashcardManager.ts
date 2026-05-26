import { addItem, createId, getActiveSession } from "./storage";
import { incrementSessionCounter } from "./sessionManager";
import { Flashcard, STORAGE_KEYS } from "./types";

export async function saveFlashcard(input: { front: string; back: string; course?: string; tags?: string[]; sourceUrl?: string; sourceId?: string; highlightId?: string }): Promise<Flashcard> {
  const active = await getActiveSession();
  const flashcard: Flashcard = {
    id: createId("flashcard"),
    course: input.course || active?.course,
    sourceId: input.sourceId,
    highlightId: input.highlightId,
    front: input.front,
    back: input.back,
    tags: input.tags ?? [],
    sourceUrl: input.sourceUrl,
    createdAt: new Date().toISOString()
  };
  await addItem(STORAGE_KEYS.flashcards, flashcard);
  if (active) await incrementSessionCounter(active.id, "flashcardsCreatedCount");
  return flashcard;
}
