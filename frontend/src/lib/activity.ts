// Activity log and per-exercise results. Rows keep the recovered release format
// (ids prefixed act_/res_, local calendar day keys) so progress stats stay comparable.
import { learnerDb, notifyStore } from "./database";
import { learnerDatabase } from "./storage-keys";

const { stores } = learnerDatabase;

export function newId(prefix = "") {
  return (
    prefix +
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36))
  );
}

/** Local calendar day (YYYY-MM-DD) used by streaks and daily goals. */
export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export type ActivityType =
  | "lesson"
  | "review"
  | "flashcards"
  | "conversation"
  | "tutor"
  | "writing"
  | "placement"
  | "speaking"
  | "listening"
  | "grammar";

export interface NewActivity {
  type: ActivityType;
  title: string;
  durationSec: number;
  xp: number;
  refId?: string;
  correct?: number;
  total?: number;
  at?: string;
}

export async function logActivity(activity: NewActivity) {
  const at = activity.at ?? new Date().toISOString();
  const row = {
    ...activity,
    id: newId("act_"),
    at,
    day: localDay(new Date(at)),
    durationSec: Math.max(0, Math.round(activity.durationSec)),
  };
  await (await learnerDb())?.put(stores.activities, row);
  notifyStore(stores.activities);
  return row;
}

export interface NewResult {
  lessonId: string;
  exerciseId: string;
  skill: string;
  correct: boolean;
  given?: string;
  expected?: string;
}

export async function recordResults(results: NewResult[]) {
  if (!results.length) return;
  const db = await learnerDb();
  const at = new Date().toISOString();
  if (db) {
    const tx = db.transaction(stores.results, "readwrite");
    await Promise.all([
      ...results.map((r) => tx.store.put({ ...r, id: newId("res_"), at })),
      tx.done,
    ]);
  }
  notifyStore(stores.results);
}
