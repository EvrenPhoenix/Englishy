// Saved words (the "vocab" store) and their spaced-repetition schedule. The record
// shape and the bank:<id> identities are part of the stored data format.
import type { Level } from "../../../shared/constants";
import type { VocabularyWord } from "../data/types";
import { learnerDb, notifyStore } from "./database";
import { learnerDatabase } from "./storage-keys";

const { stores } = learnerDatabase;
const DAY_MS = 86_400_000;

export interface Srs {
  ease: number;
  interval: number;
  reps: number;
  lapses: number;
  due: string;
  lastReviewed: string | null;
}
export interface SavedWord {
  id: string;
  word: string;
  pos: string;
  definition: string;
  translation?: string;
  ipa?: string;
  examples: string[];
  collocations?: string[];
  synonyms?: string[];
  antonyms?: string[];
  level: Level;
  topic: string;
  custom: boolean;
  savedAt: string;
  srs: Srs;
}

export const newSrs = (now = new Date()): Srs => ({
  ease: 2.5,
  interval: 0,
  reps: 0,
  lapses: 0,
  due: now.toISOString(),
  lastReviewed: null,
});

/**
 * SM-2 style scheduling. Grades: 0 again, 3 hard, 4 good, 5 easy. A failed card
 * returns in ten minutes; intervals are capped at a year.
 */
export function scheduleReview(srs: Srs, grade: number, now = new Date()): Srs {
  const ease = Math.max(
    1.3,
    +(srs.ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))).toFixed(3),
  );
  if (grade < 3)
    return {
      ease,
      interval: 0,
      reps: 0,
      lapses: srs.lapses + 1,
      due: new Date(now.getTime() + 600_000).toISOString(),
      lastReviewed: now.toISOString(),
    };
  const reps = srs.reps + 1;
  let interval =
    reps === 1
      ? grade === 5
        ? 3
        : 1
      : reps === 2
        ? grade === 3
          ? 3
          : 6
        : Math.round(
            srs.interval * (grade === 3 ? 1.2 : ease) * (grade === 5 ? 1.3 : 1),
          );
  interval = Math.max(1, Math.min(interval, 365));
  return {
    ease,
    interval,
    reps,
    lapses: srs.lapses,
    due: new Date(now.getTime() + interval * DAY_MS).toISOString(),
    lastReviewed: now.toISOString(),
  };
}

export type WordStage = "new" | "learning" | "reviewing" | "mastered";
export function wordStage(srs: Srs): WordStage {
  if (!srs.lastReviewed) return "new";
  return srs.interval >= 21
    ? "mastered"
    : srs.interval >= 7
      ? "reviewing"
      : "learning";
}
export const isDue = (srs: Srs, now = new Date()) =>
  new Date(srs.due).getTime() <= now.getTime();

/** "10 min", "1 day" or "N days": when a card comes back after this grade. */
export function nextReviewLabel(srs: Srs, grade: number, now = new Date()) {
  const { interval } = scheduleReview(srs, grade, now);
  return interval === 0
    ? "10 min"
    : interval === 1
      ? "1 day"
      : `${interval} days`;
}

export async function readVocab(): Promise<SavedWord[]> {
  return (await (await learnerDb())?.getAll(stores.vocab)) ?? [];
}
export async function saveWord(word: SavedWord) {
  await (await learnerDb())?.put(stores.vocab, word);
  notifyStore(stores.vocab);
}
export async function removeWord(id: string) {
  await (await learnerDb())?.delete(stores.vocab, id);
  notifyStore(stores.vocab);
}

/** A word bank entry as a notebook record, translated into the learner's language. */
export function wordFromBank(
  entry: VocabularyWord,
  nativeLanguage: string,
): SavedWord {
  return {
    id: `bank:${entry.id}`,
    word: entry.word,
    pos: entry.pos,
    definition: entry.definition,
    translation:
      nativeLanguage !== "en" && nativeLanguage !== "other"
        ? entry.translations[nativeLanguage as keyof typeof entry.translations]
        : undefined,
    ipa: entry.ipa,
    examples: entry.examples,
    collocations: entry.collocations,
    synonyms: entry.synonyms,
    antonyms: entry.antonyms,
    level: entry.level,
    topic: entry.topic,
    custom: false,
    savedAt: new Date().toISOString(),
    srs: newSrs(),
  };
}
