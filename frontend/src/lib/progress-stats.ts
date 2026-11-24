import type {
  Activity,
  LessonProgress,
  SavedWord,
  ExerciseResult,
} from "./database";
import { lessons } from "../data/lessons";
import { lessonsForLevel } from "./course";
import type { CourseLevel } from "../data/types";

function localDay(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
function offsetDay(day: string, offset: number) {
  const [year, month, date] = day.split("-").map(Number);
  return localDay(new Date(year, month - 1, date + offset));
}
export function totalMinutes(rows: Activity[]) {
  return Math.round(
    rows.reduce((total, row) => total + row.durationSec, 0) / 60,
  );
}
export function totalXp(rows: Activity[]) {
  return rows.reduce((total, row) => total + row.xp, 0);
}
export function currentStreak(rows: Activity[], today = localDay(new Date())) {
  const active = new Set(rows.map((row) => row.day));
  let day = active.has(today) ? today : offsetDay(today, -1);
  let count = 0;
  while (active.has(day)) {
    count++;
    day = offsetDay(day, -1);
  }
  return count;
}
export function bestStreak(rows: Activity[]) {
  const days = [...new Set(rows.map((row) => row.day))].sort();
  let longest = 0,
    run = 0;
  for (const [index, day] of days.entries()) {
    run = index > 0 && offsetDay(days[index - 1], 1) === day ? run + 1 : 1;
    longest = Math.max(run, longest);
  }
  return longest;
}
export interface DayTotal {
  day: string;
  minutes: number;
  activities: number;
}
export function dailyTotals(
  rows: Activity[],
  count: number,
  today = localDay(new Date()),
): DayTotal[] {
  return Array.from({ length: count }, (_, i) => {
    const day = offsetDay(today, 1 - count + i);
    const entries = rows.filter((row) => row.day === day);
    return { day, minutes: totalMinutes(entries), activities: entries.length };
  });
}
export function weekStats(rows: Activity[], today = localDay(new Date())) {
  const start = offsetDay(today, -6),
    previousStart = offsetDay(today, -13);
  const week = rows.filter((row) => row.day >= start && row.day <= today);
  const previous = rows.filter(
    (row) => row.day >= previousStart && row.day < start,
  );
  const count = (type: string) =>
    week.filter((row) => row.type === type).length;
  return {
    minutes: totalMinutes(week),
    previousMinutes: totalMinutes(previous),
    days: new Set(week.map((row) => row.day)).size,
    lessons: count("lesson"),
    reviews: count("flashcards") + count("review"),
    conversations: count("conversation"),
    writing: count("writing"),
  };
}
export function courseProgress(rows: LessonProgress[]) {
  const completed = new Set(
    rows.filter((row) => row.status === "completed").map((row) => row.lessonId),
  );
  const count = (items: typeof lessons) =>
    items.filter((lesson) => completed.has(lesson.id)).length;
  const forLevel = (level: CourseLevel) => {
    const items = lessonsForLevel(level);
    return { total: items.length, completed: count(items) };
  };
  return {
    completed,
    completedCount: count(lessons),
    total: lessons.length,
    preA1: forLevel("pre-a1"),
    a1: forLevel("a1"),
  };
}
export function vocabCounts(rows: SavedWord[]) {
  const counts = { new: 0, learning: 0, reviewing: 0, mastered: 0 };
  for (const { srs } of rows) {
    if (!srs.lastReviewed) counts.new++;
    else if (srs.interval >= 21) counts.mastered++;
    else if (srs.interval >= 7) counts.reviewing++;
    else counts.learning++;
  }
  return counts;
}
export function revisionTopics(rows: ExerciseResult[], now = new Date()) {
  const cutoff = new Date(now.getTime() - 30 * 86400000).toISOString();
  const scores = new Map<string, { correct: number; attempts: number }>();
  for (const row of rows) {
    if (row.at < cutoff) continue;
    const score = scores.get(row.lessonId) ?? { correct: 0, attempts: 0 };
    score.attempts++;
    if (row.correct) score.correct++;
    scores.set(row.lessonId, score);
  }
  return [...scores]
    .filter(
      ([, score]) =>
        score.attempts >= 3 && score.correct / score.attempts < 0.7,
    )
    .map(([lessonId, score]) => ({
      lessonId,
      accuracy: score.correct / score.attempts,
      attempts: score.attempts,
      title:
        lessons.find((lesson) => lesson.id === lessonId)?.title ??
        (lessonId.startsWith("grammar:")
          ? "Grammar: " + lessonId.slice(8).replace(/-/g, " ")
          : lessonId),
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5);
}

/** Short notes about recent wrong answers, sent to the tutor as context. */
export function mistakeNotes(
  rows: { correct: boolean; given?: string; expected?: string }[],
  limit = 5,
) {
  return rows
    .filter((row) => !row.correct && row.expected)
    .slice(0, limit)
    .map((row) =>
      row.given
        ? `wrote "${row.given.slice(0, 60)}" instead of "${row.expected!.slice(0, 60)}"`
        : `needed "${row.expected!.slice(0, 60)}"`,
    );
}
