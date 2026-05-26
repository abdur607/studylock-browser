import { Flashcard, HighlightNote } from "./types";

export interface SourceRelationships {
  relatedHighlights: HighlightNote[];
  /** Flashcards with sourceId === the deleted source. */
  directFlashcards: Flashcard[];
  /** Flashcards linked via a related highlight's highlightId (but not directly to the source). */
  indirectFlashcards: Flashcard[];
  /** Union of direct and indirect — everything that should be deleted or unlinked. */
  allRelatedFlashcards: Flashcard[];
}

export function findSourceRelationships(
  sourceId: string,
  highlights: HighlightNote[],
  flashcards: Flashcard[]
): SourceRelationships {
  const relatedHighlights = highlights.filter((h) => h.sourceId === sourceId);
  const relatedHighlightIds = new Set(relatedHighlights.map((h) => h.id));

  const directFlashcards = flashcards.filter((f) => f.sourceId === sourceId);
  const directIds = new Set(directFlashcards.map((f) => f.id));

  const indirectFlashcards = flashcards.filter(
    (f) => !directIds.has(f.id) && f.highlightId != null && relatedHighlightIds.has(f.highlightId)
  );

  return {
    relatedHighlights,
    directFlashcards,
    indirectFlashcards,
    allRelatedFlashcards: [...directFlashcards, ...indirectFlashcards]
  };
}

/** Returns flashcards that are linked to the given highlight via highlightId. */
export function findHighlightRelationships(
  highlightId: string,
  flashcards: Flashcard[]
): Flashcard[] {
  return flashcards.filter((f) => f.highlightId === highlightId);
}
