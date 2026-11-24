import { openDB } from "idb";
import { defaultPreferences, type Preferences } from "./preferences";

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
      openDB("linguanest", 2, {
        upgrade(db, oldVersion, _newVersion, tx) {
          if (oldVersion < 1) {
            db.createObjectStore("kv");
            db.createObjectStore("lessons", { keyPath: "lessonId" });
            db.createObjectStore("activities", { keyPath: "id" }).createIndex(
              "by-day",
              "day",
            );
            db.createObjectStore("vocab", { keyPath: "id" }).createIndex(
              "by-due",
              "srs.due",
            );
            db.createObjectStore("conversations", { keyPath: "id" });
          }
          if (oldVersion < 2) {
            const results = db.createObjectStore("results", { keyPath: "id" });
            results.createIndex("by-lesson", "lessonId");
            results.createIndex("by-at", "at");
            tx.objectStore("activities").createIndex("by-type", "type");
            const kv = tx.objectStore("kv");
            void kv.get("prefs").then((prefs) => {
              if (
                prefs &&
                "dailyGoal" in prefs &&
                !("dailyGoalMinutes" in prefs)
              ) {
                const { dailyGoal, ...rest } = prefs;
                return kv.put(
                  { ...rest, dailyGoalMinutes: dailyGoal },
                  "prefs",
                );
              }
            });
          }
        },
        blocking(_current, _next, event) {
          (event.target as IDBDatabase).close();
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
    prefs: mergeDefaults(await db?.get("kv", "prefs")),
  };
}
export async function updatePreferences(patch: Partial<Preferences>) {
  const db = await database;
  if (db) {
    // Merge into the current row within a transaction, including fields introduced
    // by other pages or tabs that this shell does not edit.
    const tx = db.transaction("kv", "readwrite");
    const current = await tx.store.get("prefs");
    await tx.store.put({ ...mergeDefaults(current), ...patch }, "prefs");
    await tx.done;
  } else {
    memoryPrefs = { ...memoryPrefs, ...patch };
  }
  events.dispatchEvent(new Event("kv"));
  storeChanges?.postMessage("kv");
}

interface ChatSummary {
  id: string;
  title: string;
  updatedAt: string;
  kind: string;
}
export async function recentTutorChats(): Promise<ChatSummary[]> {
  const rows: ChatSummary[] =
    (await (await database)?.getAll("conversations")) ?? [];
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
    (await (await database)?.getAllFromIndex("activities", "by-day", today)) ??
    [];
  return Math.round(
    rows.reduce((seconds, row) => seconds + row.durationSec, 0) / 60,
  );
}
