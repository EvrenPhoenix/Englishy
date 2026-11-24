// Portable progress backups ("linguanest-progress" v1). Existing backup files depend on
// this exact format and validation; do not rename fields or tighten limits.
import { z } from "zod";
import { BRAND } from "../../../shared/brand";
import {
  CORRECTION_MODES,
  GOALS,
  LEVELS,
  NATIVE_LANGUAGES,
  UI_LANGUAGES,
  VARIETIES,
} from "../../../shared/constants";
import { learnerDb, notifyStore } from "./database";
import { learnerDatabase } from "./storage-keys";
import { defaultPreferences, type Preferences } from "./preferences";

export const BACKUP_FORMAT = "linguanest-progress";
const { stores, prefsKey } = learnerDatabase;

const date = z.string().max(40);
const srs = z.object({
  ease: z.number().min(1.3).max(5),
  interval: z.number().min(0).max(3650),
  reps: z.number().int().min(0),
  lapses: z.number().int().min(0),
  due: date,
  lastReviewed: date.nullable(),
});
const prefs = z
  .object({
    uiLanguage: z.enum(UI_LANGUAGES),
    nativeLanguage: z.enum(NATIVE_LANGUAGES),
    explanationLanguage: z.enum(NATIVE_LANGUAGES),
    level: z.enum(LEVELS),
    goals: z.array(z.enum(GOALS)),
    variety: z.enum(VARIETIES),
    dailyGoalMinutes: z.number().int().min(1).max(240),
    theme: z.enum(["system", "light", "dark"]),
    textSize: z.enum(["normal", "large", "xlarge"]),
    reducedMotion: z.boolean(),
    speechRate: z.number().min(0.5).max(1.5),
    voiceURI: z.string().max(300).nullable(),
    correctionMode: z.enum(CORRECTION_MODES),
    saveConversations: z.boolean(),
    streaksEnabled: z.boolean(),
    showTranslations: z.enum(["auto", "always", "never"]),
    onboarding: z.object({
      completed: z.boolean(),
      step: z.number().int().min(0).max(20),
      placementTaken: z.boolean(),
    }),
    createdAt: date,
  })
  .partial();
const lesson = z.object({
  lessonId: z.string().max(80),
  status: z.enum(["started", "completed"]),
  attempts: z.number().int().min(0),
  bestScore: z.number().min(0).max(1),
  lastScore: z.number().min(0).max(1),
  startedAt: date,
  completedAt: date.nullable(),
  updatedAt: date,
});
const activity = z.object({
  id: z.string().max(80),
  type: z.enum([
    "lesson",
    "review",
    "flashcards",
    "conversation",
    "tutor",
    "writing",
    "placement",
    "speaking",
    "listening",
    "grammar",
  ]),
  at: date,
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationSec: z.number().min(0).max(86400),
  xp: z.number().min(0).max(1e4),
  title: z.string().max(200),
  refId: z.string().max(120).optional(),
  correct: z.number().int().min(0).optional(),
  total: z.number().int().min(0).optional(),
});
const result = z.object({
  id: z.string().max(80),
  lessonId: z.string().max(80),
  exerciseId: z.string().max(120),
  skill: z.string().max(80),
  at: date,
  correct: z.boolean(),
  given: z.string().max(500).optional(),
  expected: z.string().max(500).optional(),
});
const word = z.object({
  id: z.string().max(120),
  word: z.string().min(1).max(80),
  pos: z.string().max(40),
  definition: z.string().max(500),
  translation: z.string().max(200).optional(),
  ipa: z.string().max(80).optional(),
  examples: z.array(z.string().max(300)).max(10),
  collocations: z.array(z.string().max(80)).max(10).optional(),
  synonyms: z.array(z.string().max(80)).max(10).optional(),
  antonyms: z.array(z.string().max(80)).max(10).optional(),
  level: z.enum(LEVELS),
  topic: z.string().max(60),
  custom: z.boolean(),
  savedAt: date,
  srs,
});
const conversation = z.object({
  id: z.string().max(80),
  kind: z.enum(["tutor", "scenario"]),
  scenarioId: z.string().max(60).optional(),
  title: z.string().max(200),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2e4),
        at: date,
      }),
    )
    .max(500),
  createdAt: date,
  updatedAt: date,
  report: z.unknown().optional(),
});
const backupFile = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.literal(1),
  exportedAt: date,
  data: z.object({
    prefs: prefs.nullable(),
    lessons: z.array(lesson).max(5e3),
    activities: z.array(activity).max(1e5),
    results: z.array(result).max(2e5).default([]),
    vocab: z.array(word).max(2e4),
    conversations: z.array(conversation).max(2e3).default([]),
  }),
});
export type BackupFile = z.infer<typeof backupFile>;
type LessonRecord = z.infer<typeof lesson>;

const progressStores = [
  stores.lessons,
  stores.activities,
  stores.results,
  stores.vocab,
  stores.conversations,
] as const;
const allStores = [stores.kv, ...progressStores] as const;

/** Merge saved preferences with today's defaults, like the preferences loader. */
function withDefaults(saved: Partial<Preferences>): Preferences {
  const base = defaultPreferences();
  return {
    ...base,
    ...saved,
    onboarding: { ...base.onboarding, ...(saved.onboarding ?? {}) },
  };
}

export async function createBackup(includeConversations = true) {
  const db = await learnerDb();
  const all = async (store: string) => (db ? await db.getAll(store) : []);
  return {
    format: BACKUP_FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      prefs: (await db?.get(stores.kv, prefsKey)) ?? null,
      lessons: await all(stores.lessons),
      activities: await all(stores.activities),
      results: await all(stores.results),
      vocab: await all(stores.vocab),
      conversations: includeConversations
        ? await all(stores.conversations)
        : [],
    },
  };
}

export function parseBackup(
  text: string,
): { ok: true; file: BackupFile } | { ok: false; error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "This file is not valid JSON." };
  }
  const parsed = backupFile.safeParse(raw);
  if (parsed.success) return { ok: true, file: parsed.data };
  const looksLikeBackup =
    typeof raw === "object" &&
    raw !== null &&
    (raw as { format?: unknown }).format === BACKUP_FORMAT;
  return {
    ok: false,
    error: looksLikeBackup
      ? `This ${BRAND.name} file is damaged or from an unsupported version.`
      : `This is not a ${BRAND.name} backup file.`,
  };
}

/** Decide which incoming lesson rows to write, merged with what is on this device. */
export function mergeLessons(
  incoming: LessonRecord[],
  existing: Map<string, LessonRecord>,
): LessonRecord[] {
  return incoming
    .filter((row) => {
      const current = existing.get(row.lessonId);
      return (
        !current ||
        row.bestScore > current.bestScore ||
        (row.status === "completed" && current.status !== "completed")
      );
    })
    .map((row) => {
      const current = existing.get(row.lessonId);
      return current
        ? {
            ...row,
            attempts: Math.max(row.attempts, current.attempts),
            startedAt:
              current.startedAt < row.startedAt
                ? current.startedAt
                : row.startedAt,
          }
        : row;
    });
}

/**
 * Restore a backup. "merge" keeps everything on this device and adds what is new;
 * "replace" clears progress first (preferences are overwritten only if present).
 */
export async function restoreBackup(
  file: BackupFile,
  mode: "merge" | "replace",
) {
  const db = await learnerDb();
  const counts = { lessons: 0, activities: 0, vocab: 0, conversations: 0 };
  if (!db) return counts;
  const data = file.data;
  if (mode === "replace") {
    for (const store of progressStores) await db.clear(store);
    if (data.prefs) await db.put(stores.kv, withDefaults(data.prefs), prefsKey);
  } else if (data.prefs && !(await db.get(stores.kv, prefsKey))) {
    await db.put(stores.kv, withDefaults(data.prefs), prefsKey);
  }
  const putMany = async (store: string, rows: unknown[]) => {
    if (!rows.length) return;
    const tx = db.transaction(store, "readwrite");
    await Promise.all([...rows.map((row) => tx.store.put(row)), tx.done]);
  };
  const lessons = mergeLessons(
    data.lessons,
    new Map(
      ((await db.getAll(stores.lessons)) as LessonRecord[]).map((row) => [
        row.lessonId,
        row,
      ]),
    ),
  );
  await putMany(stores.lessons, lessons);
  const ids = async (store: string) =>
    new Set(
      ((await db.getAll(store)) as { id: string }[]).map((row) => row.id),
    );
  const knownActivities = await ids(stores.activities);
  const activities = data.activities.filter(
    (row) => !knownActivities.has(row.id),
  );
  await putMany(stores.activities, activities);
  const knownResults = await ids(stores.results);
  await putMany(
    stores.results,
    data.results.filter((row) => !knownResults.has(row.id)),
  );
  const knownChats = await ids(stores.conversations);
  const conversations = data.conversations.filter(
    (row) => !knownChats.has(row.id),
  );
  await putMany(stores.conversations, conversations);
  const localWords = new Map(
    ((await db.getAll(stores.vocab)) as z.infer<typeof word>[]).map((row) => [
      row.id,
      row,
    ]),
  );
  const vocab = data.vocab.filter((row) => {
    const current = localWords.get(row.id);
    return (
      !current ||
      (row.srs.lastReviewed ?? "") > (current.srs.lastReviewed ?? "")
    );
  });
  await putMany(stores.vocab, vocab);
  for (const store of allStores) notifyStore(store);
  return {
    lessons: lessons.length,
    activities: activities.length,
    vocab: vocab.length,
    conversations: conversations.length,
  };
}

export async function clearConversations() {
  const db = await learnerDb();
  await db?.clear(stores.conversations);
  notifyStore(stores.conversations);
}

/** Delete every learner record and every `ln-` localStorage entry on this device. */
export async function clearAllData() {
  const db = await learnerDb();
  for (const store of allStores) {
    await db?.clear(store);
    notifyStore(store);
  }
  try {
    for (const key of Object.keys(localStorage))
      if (key.startsWith("ln-")) localStorage.removeItem(key);
  } catch {
    // Storage blocked: nothing to remove.
  }
}
