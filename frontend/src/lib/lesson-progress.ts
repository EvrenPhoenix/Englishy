// Lesson progress rows ("lessons" store) and the in-progress lesson draft
// (ln-lesson-draft:<lessonId>). Both formats are read by existing installs.
import type { Exercise, Lesson } from "../data/types";
import { lessons } from "../data/lessons";
import { learnerDb, notifyStore } from "./database";
import {
  learnerDatabase,
  storageKeys,
  type LessonOutcome,
} from "./storage-keys";

const { stores } = learnerDatabase;

/** A lesson counts as completed with at least 70% of scored answers correct. */
export const PASS_SCORE = 0.7;

export interface LessonRecord {
  lessonId: string;
  status: "started" | "completed";
  attempts: number;
  bestScore: number;
  lastScore: number;
  startedAt: string;
  completedAt: string | null;
  updatedAt: string;
}

/** Create the "started" row the first time a lesson is opened. */
export async function markLessonStarted(lessonId: string) {
  const db = await learnerDb();
  if (!db || (await db.get(stores.lessons, lessonId))) return;
  const now = new Date().toISOString();
  await db.put(stores.lessons, {
    lessonId,
    status: "started",
    attempts: 0,
    bestScore: 0,
    lastScore: 0,
    startedAt: now,
    completedAt: null,
    updatedAt: now,
  } satisfies LessonRecord);
  notifyStore(stores.lessons);
}

/** Record a finished attempt. Completion is permanent once reached. */
export async function recordLessonAttempt(lessonId: string, score: number) {
  const db = await learnerDb();
  const now = new Date().toISOString();
  const previous: LessonRecord | undefined = await db?.get(
    stores.lessons,
    lessonId,
  );
  const row: LessonRecord = {
    lessonId,
    status:
      score >= PASS_SCORE || previous?.status === "completed"
        ? "completed"
        : "started",
    attempts: (previous?.attempts ?? 0) + 1,
    bestScore: Math.max(previous?.bestScore ?? 0, score),
    lastScore: score,
    startedAt: previous?.startedAt ?? now,
    completedAt: previous?.completedAt ?? (score >= PASS_SCORE ? now : null),
    updatedAt: now,
  };
  await db?.put(stores.lessons, row);
  notifyStore(stores.lessons);
  return row;
}

/** The lesson after this one in course order. */
export function lessonAfter(lessonId: string) {
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  return index >= 0 ? lessons[index + 1] : undefined;
}

const exerciseKey = (lesson: Lesson) =>
  lesson.exercises.map(({ id }) => id).join("|");

/**
 * Read a saved draft. It is used only if it belongs to this exact version of the
 * lesson (same exercise ids in the same order) and points at a valid question.
 */
export function loadLessonDraft(lesson: Lesson) {
  try {
    const draft = JSON.parse(
      localStorage.getItem(storageKeys.lessonDraft(lesson.id)) ?? "null",
    );
    if (
      draft?.version !== 1 ||
      !Number.isInteger(draft.index) ||
      draft.index < 0 ||
      draft.index >= lesson.exercises.length ||
      draft.exerciseIds !== exerciseKey(lesson) ||
      !draft.outcomes ||
      typeof draft.outcomes !== "object"
    )
      return null;
    const outcomes: Record<string, LessonOutcome> = {};
    for (const { id } of lesson.exercises.slice(0, draft.index + 1)) {
      const result = draft.outcomes[id];
      if (result && typeof result.correct === "boolean")
        outcomes[id] = {
          correct: result.correct,
          skipped: result.skipped === true,
          deviceSkip: result.deviceSkip === true,
          given: typeof result.given === "string" ? result.given : undefined,
          expected:
            typeof result.expected === "string" ? result.expected : undefined,
        };
    }
    return { index: draft.index as number, outcomes };
  } catch {
    return null;
  }
}

export function saveLessonDraft(
  lesson: Lesson,
  index: number,
  outcomes: Record<string, LessonOutcome>,
) {
  try {
    localStorage.setItem(
      storageKeys.lessonDraft(lesson.id),
      JSON.stringify({
        version: 1,
        index,
        outcomes,
        exerciseIds: exerciseKey(lesson),
      }),
    );
  } catch {
    // Storage can be disabled. The current lesson remains usable in memory.
  }
}

export function clearLessonDraft(lesson: Lesson) {
  try {
    localStorage.removeItem(storageKeys.lessonDraft(lesson.id));
  } catch {
    // Nothing to clear.
  }
}

export type { Exercise };
