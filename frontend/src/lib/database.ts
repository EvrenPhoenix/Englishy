import { openDB } from "idb";
import { defaultPreferences, type Preferences } from "./preferences";

import { learnerDatabase } from "./storage-keys";

const { stores, keyPaths, indexes, prefsKey } = learnerDatabase;
const storeChanges =
  typeof BroadcastChannel === "function"
    ? new BroadcastChannel("linguanest-store")
    : null;
const events = new EventTarget();
storeChanges?.addEventListener("message", (event) =>
  events.dispatchEvent(new Event(event.data)),
);
export function subscribe(store: string, refresh: () => void) {
  events.addEventListener(store, refresh);
  return () => events.removeEventListener(store, refresh);
}

async function openLearnerDatabase() {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      openDB(learnerDatabase.name, learnerDatabase.version, {
        upgrade(db, oldVersion, _newVersion, tx) {
          if (oldVersion < learnerDatabase.initialVersion) {
            db.createObjectStore(stores.kv);
            db.createObjectStore(stores.lessons, { keyPath: keyPaths.lessons });
            db.createObjectStore(stores.activities, {
              keyPath: keyPaths.activities,
            }).createIndex(...indexes.activities.day);
            db.createObjectStore(stores.vocab, {
              keyPath: keyPaths.vocab,
            }).createIndex(...indexes.vocab.due);
            db.createObjectStore(stores.conversations, {
              keyPath: keyPaths.conversations,
            });
          }
          if (oldVersion < 2) {
            const results = db.createObjectStore(stores.results, {
              keyPath: keyPaths.results,
            });
            results.createIndex(...indexes.results.lesson);
            results.createIndex(...indexes.results.at);
            tx.objectStore(stores.activities).createIndex(
              ...indexes.activities.type,
            );
            const kv = tx.objectStore(stores.kv);
            void kv.get(prefsKey).then((prefs) => {
              if (
                prefs &&
                "dailyGoal" in prefs &&
                !("dailyGoalMinutes" in prefs)
              ) {
                const { dailyGoal, ...rest } = prefs;
                return kv.put(
                  { ...rest, dailyGoalMinutes: dailyGoal },
                  prefsKey,
                );
              }
            });
          }
        },
      }),
      new Promise<null>((resolve) => {
        timer = setTimeout(resolve, 4000, null);
      }),
    ]);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
const database = openLearnerDatabase();
let memoryPrefs = defaultPreferences();

function mergeDefaults(saved?: Partial<Preferences>): Preferences {
  return {
    ...memoryPrefs,
    ...saved,
    onboarding: { ...memoryPrefs.onboarding, ...saved?.onboarding },
  };
}
export async function loadPreferences() {
  const db = await database;
  return {
    persistent: Boolean(db),
    prefs: mergeDefaults(await db?.get(stores.kv, prefsKey)),
  };
}
export async function updatePreferences(
  patch: Partial<Preferences> | ((prefs: Preferences) => Partial<Preferences>),
) {
  const db = await database;
  if (db) {
    // Merge into the current row within a transaction, including fields introduced
    // by other pages or tabs that this shell does not edit.
    const tx = db.transaction(stores.kv, "readwrite");
    const current = await tx.store.get(prefsKey);
    const prefs = mergeDefaults(current);
    await tx.store.put(
      { ...prefs, ...(typeof patch === "function" ? patch(prefs) : patch) },
      prefsKey,
    );
    await tx.done;
  } else {
    memoryPrefs = {
      ...memoryPrefs,
      ...(typeof patch === "function" ? patch(memoryPrefs) : patch),
    };
  }
  events.dispatchEvent(new Event(stores.kv));
  storeChanges?.postMessage(stores.kv);
}

interface ChatSummary {
  id: string;
  title: string;
  updatedAt: string;
  kind: string;
  scenarioId?: string;
  report?: unknown;
}
async function chatsOfKind(kind: string): Promise<ChatSummary[]> {
  const rows: ChatSummary[] =
    (await (await database)?.getAll(stores.conversations)) ?? [];
  return rows
    .filter((row) => row.kind === kind)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export const scenarioChats = () => chatsOfKind("scenario");
export async function recentTutorChats() {
  return (await chatsOfKind("tutor")).slice(0, 30);
}
export async function minutesToday() {
  const date = new Date();
  const today = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
  const rows: { durationSec: number }[] =
    (await (
      await database
    )?.getAllFromIndex(stores.activities, indexes.activities.day[0], today)) ??
    [];
  return Math.round(
    rows.reduce((seconds, row) => seconds + row.durationSec, 0) / 60,
  );
}
export interface LessonProgress {
  lessonId: string;
  status: string;
  bestScore: number;
  completedAt?: string | null;
}
export async function readLessonProgress(): Promise<LessonProgress[]> {
  return (await (await database)?.getAll(stores.lessons)) ?? [];
}
export interface Activity {
  id: string;
  title: string;
  total?: number;
  correct?: number;
  day: string;
  at: string;
  type: string;
  durationSec: number;
  xp: number;
}
export interface SavedWord {
  srs: { due: string; lastReviewed: string | null; interval: number };
}
export interface ExerciseResult {
  at: string;
  lessonId: string;
  correct: boolean;
}
export const progressStores = [
  stores.activities,
  stores.lessons,
  stores.vocab,
  stores.results,
] as const;
export async function readProgressRecords() {
  const db = await database;
  const [activities, lessons, vocab, results]: [
    Activity[],
    LessonProgress[],
    SavedWord[],
    ExerciseResult[],
  ] = await Promise.all([
    db?.getAll(stores.activities) ?? [],
    readLessonProgress(),
    db?.getAll(stores.vocab) ?? [],
    db?.getAll(stores.results) ?? [],
  ]);
  const newestFirst = (a: { at: string }, b: { at: string }) =>
    b.at.localeCompare(a.at);
  return {
    activities: activities.sort(newestFirst),
    lessons,
    vocab,
    results: results.sort(newestFirst),
  };
}
