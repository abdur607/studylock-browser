import { describe, expect, it } from "vitest";
import { saveFlashcard } from "./flashcardManager";
import { startSession } from "./sessionManager";
import { getActiveSession, getArray } from "./storage";
import { Flashcard, STORAGE_KEYS } from "./types";

const baseSession = {
  course: "Physics",
  task: "Practice",
  durationMinutes: 45,
  mode: "blocklist" as const,
  strictness: "normal" as const,
  blockedDomains: [],
  allowedDomains: []
};

describe("saveFlashcard", () => {
  it("saves flashcard to storage", async () => {
    const card = await saveFlashcard({ front: "What is force?", back: "F = ma", tags: [] });
    const cards = await getArray<Flashcard>(STORAGE_KEYS.flashcards);
    expect(cards.some((c) => c.id === card.id)).toBe(true);
  });

  it("stores front and back", async () => {
    const card = await saveFlashcard({ front: "Question", back: "Answer", tags: [] });
    expect(card.front).toBe("Question");
    expect(card.back).toBe("Answer");
  });

  it("increments flashcardsCreatedCount on the active session", async () => {
    await startSession(baseSession);
    await saveFlashcard({ front: "Q1", back: "A1", tags: [] });
    await saveFlashcard({ front: "Q2", back: "A2", tags: [] });
    await saveFlashcard({ front: "Q3", back: "A3", tags: [] });
    const active = await getActiveSession();
    expect(active?.flashcardsCreatedCount).toBe(3);
  });

  it("records course from active session when not explicitly provided", async () => {
    await startSession({ ...baseSession, course: "Maths" });
    const card = await saveFlashcard({ front: "Q", back: "A", tags: [] });
    expect(card.course).toBe("Maths");
  });
});
