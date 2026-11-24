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
export async function updatePreferences(patch: Partial<Preferences>) {
  const db = await database;
  if (db) {
    // Merge into the current row within a transaction, including fields introduced
    // by other pages or tabs that this shell does not edit.
    const tx = db.transaction(stores.kv, "readwrite");
    const current = await tx.store.get(prefsKey);
    await tx.store.put({ ...mergeDefaults(current), ...patch }, prefsKey);
    await tx.done;
  } else {
    memoryPrefs = { ...memoryPrefs, ...patch };
  }
  events.dispatchEvent(new Event(stores.kv));
  storeChanges?.postMessage(stores.kv);
}

interface ChatSummary {
  id: string;
  title: string;
  updatedAt: string;
  kind: string;
}
export async function recentTutorChats(): Promise<ChatSummary[]> {
  const rows: ChatSummary[] =
    (await (await database)?.getAll(stores.conversations)) ?? [];
  return rows
    .filter((row) => row.kind === "tutor")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 30);
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
